import React from "react";
import type { KatalixNode, KatalixAction } from "@katalix/core";
import { normalizeAction } from "@katalix/core";
import { resolveMotionToNative } from "@katalix/motion";
import { useKatalixAction } from "./action-context.js";
import { useTokenRegistry } from "./registry-context.js";
import { resolveButtonVariantStyle } from "./button-variants.js";
import { createExtraRenderers } from "./extra-renderers.js";
import { resolveStyleToNative } from "./resolve-style-native.js";
import type {
  RNViewStyle,
  RNTextStyle,
  RNImageStyle,
  RNViewProps,
  RNTextProps,
  RNImageProps,
  RNTextInputProps,
  RNPressableProps,
  RNScrollViewProps,
} from "./rn-types.js";

/** Props passed to every node renderer. */
export interface KatalixNodeProps {
  readonly node: KatalixNode;
}

/**
 * Lazy accessor for react-native components.
 * At runtime `react-native` must be available as a peer dependency.
 * During unit tests the module is replaced with mocks.
 */
let _rn: {
  View: React.ComponentType<RNViewProps>;
  Text: React.ComponentType<RNTextProps>;
  Image: React.ComponentType<RNImageProps>;
  TextInput: React.ComponentType<RNTextInputProps>;
  Pressable: React.ComponentType<RNPressableProps>;
  ScrollView: React.ComponentType<RNScrollViewProps>;
  SafeAreaView?: React.ComponentType<RNViewProps>;
  FlatList?: React.ComponentType<Record<string, unknown>>;
  Modal?: React.ComponentType<Record<string, unknown>>;
  KeyboardAvoidingView?: React.ComponentType<RNViewProps>;
  Switch?: React.ComponentType<Record<string, unknown>>;
} | undefined;

const getRN = (): NonNullable<typeof _rn> => {
  if (!_rn) {
    throw new Error(
      "React Native components not available. " +
      "Call setRNComponents() or ensure react-native is loaded before rendering.",
    );
  }
  return _rn;
};

/**
 * Inject mock RN components for testing (avoids real react-native dependency).
 * Call with `undefined` to reset.
 */
export const setRNComponents = (components: typeof _rn): void => {
  _rn = components;
};

/** Resolve node styles and initial motion state for RN-compatible renderers. */
const useNodeStyle = (node: KatalixNode): RNViewStyle | RNTextStyle | RNImageStyle => {
  const registry = useTokenRegistry();
  const style = resolveStyleToNative(node.normalizedStyle, { registry }, node.style);
  const motion = resolveMotionToNative(node.animation);
  return { ...style, ...motion.initialStyle };
};

/** Recursively render children of a container node. */
const RenderChildren: React.FC<{ children?: readonly KatalixNode[] }> = ({
  children,
}) => {
  if (!children || children.length === 0) {
    return null;
  }
  return (
    <>
      {children.map((child, i) => (
        <RenderNodeNative key={child.id ?? `${child.kind}-${i}`} node={child} />
      ))}
    </>
  );
};

/** Resolve an action prop (string id or KatalixAction) into a press handler. */
const useActionHandler = (
  actionProp: unknown,
): (() => void) | undefined => {
  const dispatch = useKatalixAction();
  if (actionProp === undefined || actionProp === null) {
    return undefined;
  }
  return () => {
    const action: KatalixAction =
      typeof actionProp === "string"
        ? normalizeAction(actionProp)
        : (actionProp as KatalixAction);
    dispatch(action);
  };
};

const ScreenRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { ScrollView, SafeAreaView, View } = getRN();
  const style = useNodeStyle(node);
  const safeArea = node.props.safeArea as string | undefined;
  const body = (
    <ScrollView
      testID={`katalix-screen-${node.id ?? "root"}`}
      contentContainerStyle={{ flexGrow: 1, ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </ScrollView>
  );
  if (safeArea && SafeAreaView) {
    const edges =
      safeArea === "all" ? (["top", "bottom", "left", "right"] as const) : ([safeArea] as const);
    return <SafeAreaView testID="katalix-screen-safe-area" edges={edges}>{body}</SafeAreaView>;
  }
  if (safeArea) {
    return <View testID="katalix-screen-safe-area">{body}</View>;
  }
  return body;
};

const StackRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View } = getRN();
  const style = useNodeStyle(node);
  return (
    <View
      testID="katalix-stack"
      style={{ flexDirection: "column", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </View>
  );
};

const RowRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View } = getRN();
  const style = useNodeStyle(node);
  return (
    <View
      testID="katalix-row"
      style={{ flexDirection: "row", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </View>
  );
};

const BoxRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View } = getRN();
  const style = useNodeStyle(node);
  return (
    <View testID="katalix-box" style={style}>
      <RenderChildren>{node.children}</RenderChildren>
    </View>
  );
};

const TextRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { Text } = getRN();
  const style = useNodeStyle(node) as RNTextStyle;
  const content = node.props.content as string | undefined;
  const numberOfLines = node.props.numberOfLines as number | undefined;
  return (
    <Text testID="katalix-text" style={style} numberOfLines={numberOfLines}>
      {content ?? ""}
    </Text>
  );
};

const ImageRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { Image } = getRN();
  const style = useNodeStyle(node) as RNImageStyle;
  const source = node.props.source as string | undefined;
  const alt = (node.props.alt as string | undefined) ?? "";
  const resizeMode = (node.props.resizeMode as RNImageStyle["resizeMode"]) ?? "cover";
  return (
    <Image
      testID="katalix-image"
      source={{ uri: source ?? "" }}
      accessibilityLabel={alt}
      resizeMode={resizeMode}
      style={style}
    />
  );
};

const ButtonRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { Pressable, Text } = getRN();
  const registry = useTokenRegistry();
  const baseStyle = useNodeStyle(node);
  const variant = node.props.variant as string | undefined;
  const style = {
    ...resolveButtonVariantStyle(variant, registry),
    ...baseStyle,
    ...(node.props.loading ? { opacity: 0.6 } : {}),
  };
  const label = node.props.label as string | undefined;
  const onPress = useActionHandler(node.props.onPress);
  const disabled = Boolean(node.props.disabled) || Boolean(node.props.loading);
  return (
    <Pressable
      testID="katalix-button"
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={style}
    >
      {node.children && node.children.length > 0 ? (
        <RenderChildren>{node.children}</RenderChildren>
      ) : (
        <Text>{label ?? ""}</Text>
      )}
    </Pressable>
  );
};

const INPUT_KEYBOARD_TYPES: Record<string, string> = {
  email: "email-address",
  phone: "phone-pad",
  numeric: "numeric",
};

const InputRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { TextInput } = getRN();
  const dispatch = useKatalixAction();
  const registry = useTokenRegistry();
  const borderColor = registry?.["input.border"];
  const backgroundColor = registry?.["input.background"];
  const style = {
    borderWidth: 1,
    borderColor: borderColor !== undefined ? String(borderColor) : "#d1d5db",
    backgroundColor: backgroundColor !== undefined ? String(backgroundColor) : "#fff",
    borderRadius: 8,
    padding: 10,
    ...useNodeStyle(node),
  } as RNTextStyle;
  const placeholder = node.props.placeholder as string | undefined;
  const controlledValue = node.props.value as string | undefined;
  const [localValue, setLocalValue] = React.useState(controlledValue ?? "");
  const value = controlledValue !== undefined ? controlledValue : localValue;
  const inputType = node.props.inputType as string | undefined;
  const secure = Boolean(node.props.secure) || inputType === "password";
  const multiline = Boolean(node.props.multiline) || inputType === "multiline";

  const handleChangeText = (text: string) => {
    if (controlledValue === undefined) {
      setLocalValue(text);
    }
    const onChangeProp = node.props.onChange;
    if (onChangeProp !== undefined && onChangeProp !== null) {
      const action: KatalixAction =
        typeof onChangeProp === "string"
          ? normalizeAction(onChangeProp)
          : (onChangeProp as KatalixAction);
      dispatch({ ...action, payload: { ...action.payload, value: text } });
    }
  };

  return (
    <TextInput
      testID="katalix-input"
      placeholder={placeholder}
      value={value}
      onChangeText={handleChangeText}
      secureTextEntry={secure}
      keyboardType={inputType ? INPUT_KEYBOARD_TYPES[inputType] : undefined}
      multiline={multiline}
      style={style}
    />
  );
};

const BadgeRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View, Text } = getRN();
  const style = useNodeStyle(node);
  const label = node.props.label as string | undefined;
  return (
    <View testID="katalix-badge" style={style}>
      <Text>{label ?? ""}</Text>
    </View>
  );
};

const DividerRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View } = getRN();
  const style = useNodeStyle(node);
  return (
    <View
      testID="katalix-divider"
      style={{ height: 1, backgroundColor: "#e5e7eb", ...style }}
    />
  );
};

const SpacerRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View } = getRN();
  const style = useNodeStyle(node);
  return <View testID="katalix-spacer" style={{ flex: 1, ...style }} />;
};

const ListRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View, FlatList } = getRN();
  const style = useNodeStyle(node);
  const children = node.children ?? [];
  if (FlatList && node.props.virtualized !== false) {
    return (
      <FlatList
        testID="katalix-list"
        data={children}
        style={{ flexDirection: "column", ...style }}
        keyExtractor={(item: KatalixNode, index: number) => item.id ?? `${item.kind}-${index}`}
        renderItem={({ item }: { item: KatalixNode }) => (
          <>{renderNodeRef.current({ node: item })}</>
        )}
      />
    );
  }
  return (
    <View
      testID="katalix-list"
      accessibilityRole="list"
      style={{ flexDirection: "column", ...style }}
    >
      {children.map((child, i) => (
        <View key={child.id ?? `${child.kind}-${i}`}>
          <>{renderNodeRef.current({ node: child })}</>
        </View>
      ))}
    </View>
  );
};

const CORE_RENDERERS: Readonly<Record<string, React.FC<KatalixNodeProps>>> = {
  screen: ScreenRenderer,
  stack: StackRenderer,
  row: RowRenderer,
  box: BoxRenderer,
  text: TextRenderer,
  image: ImageRenderer,
  button: ButtonRenderer,
  input: InputRenderer,
  badge: BadgeRenderer,
  divider: DividerRenderer,
  spacer: SpacerRenderer,
  list: ListRenderer,
};

const renderNodeRef: { current: React.FC<KatalixNodeProps> } = {
  current: () => null,
};

const NODE_RENDERERS: Readonly<Record<string, React.FC<KatalixNodeProps>>> = {
  ...CORE_RENDERERS,
  ...createExtraRenderers(getRN as never, {
    useNodeStyle,
    RenderChildren,
    RenderNodeNative: (props) => renderNodeRef.current(props),
  }),
};

/**
 * Render a single semantic node by dispatching to the appropriate kind renderer.
 * Unknown kinds render a diagnostic View with a testID.
 */
export const RenderNodeNative: React.FC<KatalixNodeProps> = ({ node }) => {
  const Renderer = NODE_RENDERERS[node.kind];
  if (Renderer) {
    return <Renderer node={node} />;
  }
  const { View, Text } = getRN();
  return (
    <View testID={`katalix-unknown-${node.kind}`}>
      <Text>{`[unsupported node kind: ${node.kind}]`}</Text>
    </View>
  );
};

renderNodeRef.current = RenderNodeNative;
