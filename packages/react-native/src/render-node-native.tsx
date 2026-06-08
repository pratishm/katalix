import React from "react";
import type { KatalixNode, KatalixAction } from "@katalix/core";
import { normalizeAction } from "@katalix/core";
import { useKatalixAction } from "./action-context.js";
import { useTokenRegistry } from "./registry-context.js";
import { resolveButtonVariantStyles } from "./button-variants.js";
import { partitionButtonStyles } from "./button-text-style.js";
import { resolveBadgeDefaultStyles } from "./badge-defaults.js";
import { resolveViewHost, resolveTextHost, resolveScrollHost, nodeUsesAnimatedHost, pressableShellStyle } from "./animated-host.js";
import { createExtraRenderers } from "./extra-renderers.js";
import { resolveStyleToNative } from "./resolve-style-native.js";
import { useAnimatedNodeStyle } from "./use-animated-node-style.js";
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

/** Resolve node styles and animated motion state for RN-compatible renderers. */
const useNodeStyle = useAnimatedNodeStyle;

const hasVirtualizedList = (node: KatalixNode): boolean => {
  const walk = (current: KatalixNode): boolean => {
    if (
      current.kind === "flatList" ||
      (current.kind === "list" && current.props.virtualized !== false)
    ) {
      return true;
    }
    return current.children?.some(walk) ?? false;
  };
  return walk(node);
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
  const ViewHost = resolveViewHost(node, View);
  const ScrollHost = resolveScrollHost(node, ScrollView);
  const safeArea = node.props.safeArea as string | undefined;
  const scrollable = node.props.scrollable !== false && !hasVirtualizedList(node);
  const content = (
    <>
      <RenderChildren>{node.children}</RenderChildren>
    </>
  );
  const body = scrollable ? (
    <ScrollHost
      testID={`katalix-screen-${node.id ?? "root"}`}
      contentContainerStyle={{ flexGrow: 1, ...style }}
    >
      {content}
    </ScrollHost>
  ) : (
    <ViewHost
      testID={`katalix-screen-${node.id ?? "root"}`}
      style={{ flexGrow: 1, ...style }}
    >
      {content}
    </ViewHost>
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
  const ViewHost = resolveViewHost(node, View);
  return (
    <ViewHost
      testID="katalix-stack"
      style={{ flexDirection: "column", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </ViewHost>
  );
};

const RowRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View } = getRN();
  const style = useNodeStyle(node);
  const ViewHost = resolveViewHost(node, View);
  return (
    <ViewHost
      testID="katalix-row"
      style={{ flexDirection: "row", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </ViewHost>
  );
};

const BoxRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { View } = getRN();
  const style = useNodeStyle(node);
  const ViewHost = resolveViewHost(node, View);
  return (
    <ViewHost testID="katalix-box" style={style}>
      <RenderChildren>{node.children}</RenderChildren>
    </ViewHost>
  );
};

const TextRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { Text } = getRN();
  const style = useNodeStyle(node) as RNTextStyle;
  const TextHost = resolveTextHost(node, Text);
  const content = node.props.content as string | undefined;
  const numberOfLines = node.props.numberOfLines as number | undefined;
  const selectable = Boolean(node.props.selectable);
  return (
    <TextHost
      testID="katalix-text"
      style={style}
      numberOfLines={numberOfLines}
      selectable={selectable}
    >
      {content ?? ""}
    </TextHost>
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
  const { Pressable, Text, View } = getRN();
  const registry = useTokenRegistry();
  const baseStyle = useNodeStyle(node);
  const variant = node.props.variant as string | undefined;
  const variantStyles = resolveButtonVariantStyles(variant, registry);
  const merged = {
    ...variantStyles.pressable,
    ...baseStyle,
    ...(node.props.loading ? { opacity: 0.6 } : {}),
    ...(node.props.compact ? { alignSelf: "flex-start" as const } : {}),
  };
  const { pressable, text } = partitionButtonStyles({
    ...merged,
    ...variantStyles.text,
  });
  const label = node.props.label as string | undefined;
  const onPress = useActionHandler(node.props.onPress);
  const disabled = Boolean(node.props.disabled) || Boolean(node.props.loading);
  const animated = nodeUsesAnimatedHost(node);
  const ViewHost = resolveViewHost(node, View);
  const TextHost = resolveTextHost(node, Text);

  const labelContent =
    node.children && node.children.length > 0 ? (
      <RenderChildren>{node.children}</RenderChildren>
    ) : animated ? (
      <TextHost style={text}>{label ?? ""}</TextHost>
    ) : (
      <Text style={text}>{label ?? ""}</Text>
    );

  if (animated) {
    return (
      <Pressable
        testID="katalix-button-pressable"
        accessibilityRole="button"
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={pressableShellStyle(pressable)}
      >
        <ViewHost testID="katalix-button" style={pressable}>
          {labelContent}
        </ViewHost>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID="katalix-button"
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={pressable}
    >
      {labelContent}
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
  const registry = useTokenRegistry();
  const defaults = resolveBadgeDefaultStyles(registry);
  const nodeStyle = useNodeStyle(node);
  const { pressable: containerOverrides, text: textOverrides } = partitionButtonStyles(
    nodeStyle as RNViewStyle,
  );
  const label = node.props.label as string | undefined;
  const containerStyle = { ...defaults.container, ...containerOverrides };
  const textStyle = { ...defaults.text, ...textOverrides };
  const animated = nodeUsesAnimatedHost(node);
  const ViewHost = resolveViewHost(node, View);
  const TextHost = resolveTextHost(node, Text);

  if (animated) {
    return (
      <ViewHost testID="katalix-badge" style={containerStyle}>
        <TextHost style={textStyle}>{label ?? ""}</TextHost>
      </ViewHost>
    );
  }

  return (
    <View testID="katalix-badge" style={containerStyle}>
      <Text style={textStyle}>{label ?? ""}</Text>
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
