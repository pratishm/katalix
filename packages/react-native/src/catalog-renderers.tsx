import React from "react";
import type { KatalixNode } from "@katalix/core";
import { normalizeAction } from "@katalix/core";
import { resolveToken } from "@katalix/tokens";
import { useHostComponent } from "./host-registry-context.js";
import type { KatalixNodeProps } from "./render-node-native.js";
import { useTokenRegistry } from "./registry-context.js";

type RenderNodeComponent = React.FC<KatalixNodeProps>;

type GetRN = () => {
  View: React.ComponentType<Record<string, unknown>>;
  Text: React.ComponentType<Record<string, unknown>>;
  ScrollView: React.ComponentType<Record<string, unknown>>;
  Pressable: React.ComponentType<Record<string, unknown>>;
};

/** Extended catalog renderers (GAP-WEB-001 / node catalog). */
export const createCatalogRenderers = (
  getRN: GetRN,
  deps: {
    readonly useNodeStyle: (node: KatalixNode) => object;
    readonly RenderChildren: React.FC<{ children?: readonly KatalixNode[] }>;
    readonly RenderNodeNative: RenderNodeComponent;
    readonly useActionHandler: (actionProp: unknown) => (() => void) | undefined;
    readonly useValueChangeHandler: (
      actionProp: unknown,
    ) => ((value: string) => void) | undefined;
  },
): Readonly<Record<string, React.FC<KatalixNodeProps>>> => {
  const { useNodeStyle, RenderChildren, useActionHandler, useValueChangeHandler } = deps;

  const FabRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { Pressable, Text } = getRN();
    const registry = useTokenRegistry();
    const style = useNodeStyle(node);
    const label = node.props.label as string | undefined;
    const onPress = useActionHandler(node.props.onPress);
    const backgroundColor =
      resolveToken("brand.primary", registry) ?? "#2563eb";
    const color = resolveToken("button.primary.color", registry) ?? "#ffffff";
    return (
      <Pressable
        testID="katalix-fab"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ?? "Action"}
        style={{
          position: "absolute",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
      >
        <Text style={{ color, fontWeight: "600" }}>{label ?? "+"}</Text>
      </Pressable>
    );
  };

  const LoaderRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text } = getRN();
    const message = node.props.message as string | undefined;
    const blocking = node.props.blocking !== false;
    return (
      <View
        testID="katalix-loader"
        accessibilityRole="progressbar"
        style={{
          ...(blocking
            ? {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.35)",
                justifyContent: "center",
                alignItems: "center",
              }
            : { padding: 16, alignItems: "center" }),
        }}
      >
        <Text>{message ?? "Loading…"}</Text>
      </View>
    );
  };

  const RichTextRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { Text } = getRN();
    const content = node.props.content as string | undefined;
    return <Text testID="katalix-rich-text">{content ?? ""}</Text>;
  };

  const CarouselRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { ScrollView } = getRN();
    const style = useNodeStyle(node);
    return (
      <ScrollView testID="katalix-carousel" horizontal style={style}>
        <RenderChildren>{node.children}</RenderChildren>
      </ScrollView>
    );
  };

  const WebViewRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text, Pressable } = getRN();
    const source = node.props.source as string | undefined;
    const hostComponentId =
      (node.props.hostComponentId as string | undefined) ?? "WebView";
    const HostWebView = useHostComponent(hostComponentId);

    if (HostWebView) {
      return (
        <View testID="katalix-webview">
          <HostWebView node={node} />
        </View>
      );
    }

    if (source) {
      return (
        <Pressable
          testID="katalix-webview-fallback"
          accessibilityRole="link"
          onPress={() => {
            const linking = (
              globalThis as { Linking?: { openURL?: (url: string) => void } }
            ).Linking;
            linking?.openURL?.(source);
          }}
          style={{ minHeight: 200, padding: 16, backgroundColor: "#f1f5f9" }}
        >
          <Text>{`Open: ${source}`}</Text>
        </Pressable>
      );
    }

    return (
      <View testID="katalix-webview" style={{ minHeight: 200, backgroundColor: "#f1f5f9" }}>
        <Text>
          [webview — register host component &quot;{hostComponentId}&quot; or set source URL]
        </Text>
      </View>
    );
  };

  const SelectRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text, Pressable } = getRN();
    const label = node.props.label as string | undefined;
    const options = (node.props.options as readonly string[] | undefined) ?? [];
    const initialValue = (node.props.value as string | undefined) ?? options[0] ?? "";
    const [value, setValue] = React.useState(initialValue);
    const onChange = useValueChangeHandler(node.props.onChange);

    return (
      <View testID="katalix-select" accessibilityRole="menu">
        {label ? <Text>{label}</Text> : null}
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              testID={`katalix-select-option-${option}`}
              accessibilityRole="menuitem"
              accessibilityState={{ selected }}
              onPress={() => {
                setValue(option);
                onChange?.(option);
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: selected ? "#e0e7ff" : "transparent",
              }}
            >
              <Text>{selected ? `✓ ${option}` : option}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const RadioRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text, Pressable } = getRN();
    const label = node.props.label as string | undefined;
    const selected = Boolean(node.props.selected);
    const onPress = useActionHandler(node.props.onPress);
    return (
      <Pressable
        testID="katalix-radio"
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      >
        <Text>{selected ? "◉" : "○"}</Text>
        <Text>{label ?? ""}</Text>
      </Pressable>
    );
  };

  return {
    fab: FabRenderer,
    loader: LoaderRenderer,
    richText: RichTextRenderer,
    carousel: CarouselRenderer,
    webview: WebViewRenderer,
    select: SelectRenderer,
    radio: RadioRenderer,
  };
};
