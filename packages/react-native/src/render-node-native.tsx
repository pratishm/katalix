import React from "react";
import type { KatalixNode, KatalixAction } from "@katalix/core";
import { normalizeAction } from "@katalix/core";
import { resolveMotionToNative } from "@katalix/motion";
import { useKatalixAction } from "./action-context.js";
import { useTokenRegistry } from "./registry-context.js";
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
  const { ScrollView } = getRN();
  const style = useNodeStyle(node);
  return (
    <ScrollView
      testID={`katalix-screen-${node.id ?? "root"}`}
      contentContainerStyle={{ flexGrow: 1, ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </ScrollView>
  );
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
  return (
    <Text testID="katalix-text" style={style}>
      {content ?? ""}
    </Text>
  );
};

const ImageRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { Image } = getRN();
  const style = useNodeStyle(node) as RNImageStyle;
  const source = node.props.source as string | undefined;
  const alt = (node.props.alt as string | undefined) ?? "";
  return (
    <Image
      testID="katalix-image"
      source={{ uri: source ?? "" }}
      accessibilityLabel={alt}
      style={style}
    />
  );
};

const ButtonRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { Pressable, Text } = getRN();
  const style = useNodeStyle(node);
  const label = node.props.label as string | undefined;
  const onPress = useActionHandler(node.props.onPress);
  return (
    <Pressable
      testID="katalix-button"
      accessibilityRole="button"
      onPress={onPress}
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

const InputRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { TextInput } = getRN();
  const dispatch = useKatalixAction();
  const style = useNodeStyle(node) as RNTextStyle;
  const placeholder = node.props.placeholder as string | undefined;

  const handleChangeText = (text: string) => {
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
      onChangeText={handleChangeText}
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
  const { View } = getRN();
  const style = useNodeStyle(node);
  return (
    <View
      testID="katalix-list"
      accessibilityRole="list"
      style={{ flexDirection: "column", ...style }}
    >
      {node.children?.map((child, i) => (
        <View key={child.id ?? `${child.kind}-${i}`}>
          <RenderNodeNative node={child} />
        </View>
      ))}
    </View>
  );
};

/** Built-in node kind → renderer mapping. */
const NODE_RENDERERS: Readonly<Record<string, React.FC<KatalixNodeProps>>> = {
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
