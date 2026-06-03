import React from "react";
import type { KatalixNode, KatalixAction } from "@katalix/core";
import { normalizeAction } from "@katalix/core";
import { createCatalogRenderers } from "./catalog-renderers.js";
import { useHostComponent } from "./host-registry-context.js";
import { useKatalixAction } from "./action-context.js";
export interface KatalixNodeProps {
  readonly node: KatalixNode;
}
import { useTokenRegistry } from "./registry-context.js";

type GetRN = () => {
  View: React.ComponentType<Record<string, unknown>>;
  Text: React.ComponentType<Record<string, unknown>>;
  Image: React.ComponentType<Record<string, unknown>>;
  TextInput: React.ComponentType<Record<string, unknown>>;
  Pressable: React.ComponentType<Record<string, unknown>>;
  ScrollView: React.ComponentType<Record<string, unknown>>;
  SafeAreaView?: React.ComponentType<Record<string, unknown>>;
  FlatList?: React.ComponentType<Record<string, unknown>>;
  Modal?: React.ComponentType<Record<string, unknown>>;
  Switch?: React.ComponentType<Record<string, unknown>>;
};

export const createExtraRenderers = (
  getRN: GetRN,
  deps: {
    readonly useNodeStyle: (node: KatalixNode) => object;
    readonly RenderChildren: React.FC<{ children?: readonly KatalixNode[] }>;
    readonly RenderNodeNative: React.FC<KatalixNodeProps>;
  },
): Readonly<Record<string, React.FC<KatalixNodeProps>>> => {
  const { useNodeStyle, RenderChildren, RenderNodeNative } = deps;

  const SafeAreaRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, SafeAreaView } = getRN();
    const style = useNodeStyle(node);
    const Wrapper = SafeAreaView ?? View;
    const edges = node.props.edges as string | undefined;
    return (
      <Wrapper
        testID="katalix-safe-area"
        style={style}
        {...(edges ? { edges: edges === "all" ? ["top", "bottom", "left", "right"] : [edges] } : {})}
      >
        <RenderChildren>{node.children}</RenderChildren>
      </Wrapper>
    );
  };

  const ScrollRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { ScrollView } = getRN() as ReturnType<GetRN> & {
      ScrollView: React.ComponentType<Record<string, unknown>>;
    };
    const style = useNodeStyle(node);
    const horizontal = Boolean(node.props.horizontal);
    return (
      <ScrollView
        testID="katalix-scroll"
        horizontal={horizontal}
        contentContainerStyle={{ flexGrow: 1, ...style }}
      >
        <RenderChildren>{node.children}</RenderChildren>
      </ScrollView>
    );
  };

  const FlatListRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, FlatList } = getRN();
    const style = useNodeStyle(node);
    const children = node.children ?? [];
    if (FlatList) {
      return (
        <FlatList
          testID="katalix-flat-list"
          data={children}
          style={style}
          keyExtractor={(item: KatalixNode, index: number) => item.id ?? `${item.kind}-${index}`}
          renderItem={({ item }: { item: KatalixNode }) => <RenderNodeNative node={item} />}
        />
      );
    }
    return (
      <View testID="katalix-flat-list" style={{ flexDirection: "column", ...style }}>
        {children.map((child, i) => (
          <View key={child.id ?? `${child.kind}-${i}`}>
            <RenderNodeNative node={child} />
          </View>
        ))}
      </View>
    );
  };

  const ModalRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Modal } = getRN();
    const visible = node.props.visible !== false;
    if (Modal) {
      return (
        <Modal testID="katalix-modal" visible={visible} transparent animationType="fade">
          <View
            testID="katalix-modal-backdrop"
            style={{
              flex: 1,
              backgroundColor: "rgba(15, 23, 42, 0.45)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View testID="katalix-modal-content" style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24 }}>
              <RenderChildren>{node.children}</RenderChildren>
            </View>
          </View>
        </Modal>
      );
    }
    return visible ? (
      <View testID="katalix-modal">
        <RenderChildren>{node.children}</RenderChildren>
      </View>
    ) : null;
  };

  const HostRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const componentId = node.props.componentId as string;
    const Host = useHostComponent(componentId);
    if (!Host) {
      const { View, Text } = getRN();
      return (
        <View testID={`katalix-host-missing-${componentId}`}>
          <Text>{`[HostComponent not registered: ${componentId}]`}</Text>
        </View>
      );
    }
    return <Host node={node} />;
  };

  const FieldRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text } = getRN();
    const style = useNodeStyle(node);
    const label = node.props.label as string | undefined;
    return (
      <View testID="katalix-field" style={style}>
        {label ? <Text testID="katalix-field-label">{label}</Text> : null}
        <RenderChildren>{node.children}</RenderChildren>
      </View>
    );
  };

  const SwitchRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text, Switch } = getRN();
    const label = node.props.label as string | undefined;
    const value = Boolean(node.props.value);
    return (
      <View testID="katalix-switch" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {Switch ? <Switch testID="katalix-switch-control" value={value} /> : null}
        <Text>{label ?? ""}</Text>
      </View>
    );
  };

  const CheckboxRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text } = getRN();
    const label = node.props.label as string | undefined;
    const checked = Boolean(node.props.checked);
    return (
      <View testID="katalix-checkbox">
        <Text>{`${checked ? "☑" : "☐"} ${label ?? ""}`}</Text>
      </View>
    );
  };

  const SearchBarRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { TextInput } = getRN() as ReturnType<GetRN> & {
      TextInput: React.ComponentType<Record<string, unknown>>;
    };
    const style = useNodeStyle(node);
    const placeholder = node.props.placeholder as string | undefined;
    return (
      <TextInput testID="katalix-search-bar" placeholder={placeholder} style={style} />
    );
  };

  const AvatarRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text, Image } = getRN();
    const style = useNodeStyle(node);
    const source = node.props.source as string | undefined;
    const initials = node.props.initials as string | undefined;
    if (source) {
      return (
        <Image
          testID="katalix-avatar"
          source={{ uri: source }}
          style={{ width: 40, height: 40, borderRadius: 20, ...style }}
        />
      );
    }
    return (
      <View
        testID="katalix-avatar"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#94a3b8",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
      >
        <Text>{initials ?? "?"}</Text>
      </View>
    );
  };

  const SkeletonRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View } = getRN();
    const registry = useTokenRegistry();
    const width = node.props.width ?? "100%";
    const height = node.props.height ?? 16;
    const background = registry["border.subtle"] ?? "#e5e7eb";
    return (
      <View
        testID="katalix-skeleton"
        style={{
          width,
          height,
          backgroundColor: String(background),
          borderRadius: 4,
          opacity: 0.7,
        }}
      />
    );
  };

  const ToastRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View, Text } = getRN();
    const registry = useTokenRegistry();
    const message = node.props.message as string | undefined;
    const variant = node.props.variant as string | undefined;
    const background =
      variant === "error"
        ? "#fee2e2"
        : String(registry["surface.elevated"] ?? "#ecfdf5");
    return (
      <View
        testID="katalix-toast"
        style={{
          position: "absolute",
          bottom: 24,
          alignSelf: "center",
          padding: 12,
          borderRadius: 8,
          backgroundColor: background,
        }}
      >
        <Text>{message ?? ""}</Text>
      </View>
    );
  };

  const TabsRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View } = getRN();
    const style = useNodeStyle(node);
    return (
      <View testID="katalix-tabs" style={style}>
        <RenderChildren>{node.children}</RenderChildren>
      </View>
    );
  };

  const GridRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View } = getRN();
    const style = useNodeStyle(node);
    return (
      <View
        testID="katalix-grid"
        style={{ flexDirection: "row", flexWrap: "wrap", ...style }}
      >
        <RenderChildren>{node.children}</RenderChildren>
      </View>
    );
  };

  const WrapRenderer: React.FC<KatalixNodeProps> = GridRenderer;

  const ErrorBoundaryRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const { View } = getRN();
    return (
      <View testID="katalix-error-boundary">
        <RenderChildren>{node.children}</RenderChildren>
      </View>
    );
  };

  const useActionHandler = (actionProp: unknown): (() => void) | undefined => {
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

  const useValueChangeHandler = (
    actionProp: unknown,
  ): ((value: string) => void) | undefined => {
    const dispatch = useKatalixAction();
    if (actionProp === undefined || actionProp === null) {
      return undefined;
    }
    return (value: string) => {
      const base: KatalixAction =
        typeof actionProp === "string"
          ? normalizeAction(actionProp)
          : (actionProp as KatalixAction);
      dispatch({
        ...base,
        payload: { ...(base.payload ?? {}), value },
      });
    };
  };

  return {
    safeArea: SafeAreaRenderer,
    scroll: ScrollRenderer,
    flatList: FlatListRenderer,
    modal: ModalRenderer,
    host: HostRenderer,
    field: FieldRenderer,
    switch: SwitchRenderer,
    checkbox: CheckboxRenderer,
    searchBar: SearchBarRenderer,
    avatar: AvatarRenderer,
    skeleton: SkeletonRenderer,
    toast: ToastRenderer,
    tabs: TabsRenderer,
    grid: GridRenderer,
    wrap: WrapRenderer,
    errorBoundary: ErrorBoundaryRenderer,
    ...createCatalogRenderers(getRN, {
      useNodeStyle,
      RenderChildren,
      RenderNodeNative,
      useActionHandler,
      useValueChangeHandler,
    }),
  };
};
