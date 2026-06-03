import React from "react";
import type { KatalixNode } from "@katalix/core";
import type { KatalixNodeProps } from "./render-node.js";
import { resolveWebSafeAreaStyle } from "./safe-area-style.js";

type RenderNodeComponent = React.FC<KatalixNodeProps>;

/** Web parity for layout nodes registered on native (GAP-WEB-001). */
export const createWebLayoutRenderers = (
  RenderNode: RenderNodeComponent,
): Readonly<Record<string, React.FC<KatalixNodeProps>>> => {
  const RenderChildren: React.FC<{ children?: readonly KatalixNode[] }> = ({
    children,
  }) => {
    if (!children || children.length === 0) {
      return null;
    }
    return (
      <>
        {children.map((child, i) => (
          <RenderNode key={child.id ?? `${child.kind}-${i}`} node={child} />
        ))}
      </>
    );
  };

  const SafeAreaRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const edges = node.props.edges as string | undefined;
    return (
      <div data-katalix-kind="safeArea" style={resolveWebSafeAreaStyle(edges)}>
        <RenderChildren>{node.children}</RenderChildren>
      </div>
    );
  };

  const ScrollRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const horizontal = Boolean(node.props.horizontal);
    return (
      <div
        data-katalix-kind="scroll"
        style={{
          overflow: "auto",
          ...(horizontal ? { display: "flex", flexDirection: "row" } : {}),
        }}
      >
        <RenderChildren>{node.children}</RenderChildren>
      </div>
    );
  };

  const FlatListRenderer: React.FC<KatalixNodeProps> = ({ node }) => (
    <div
      data-katalix-kind="flatList"
      role="list"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {node.children?.map((child, i) => (
        <div key={child.id ?? `${child.kind}-${i}`} role="listitem">
          <RenderNode node={child} />
        </div>
      ))}
    </div>
  );

  const TabsRenderer: React.FC<KatalixNodeProps> = ({ node }) => (
    <div data-katalix-kind="tabs" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );

  const GridRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const columns = (node.props.columns as number | undefined) ?? 2;
    return (
      <div
        data-katalix-kind="grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        <RenderChildren>{node.children}</RenderChildren>
      </div>
    );
  };

  const WrapRenderer: React.FC<KatalixNodeProps> = ({ node }) => (
    <div data-katalix-kind="wrap" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );

  const SwitchRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const label = node.props.label as string | undefined;
    const checked = Boolean(node.props.value);
    return (
      <label data-katalix-kind="switchControl" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" defaultChecked={checked} readOnly aria-label={label} />
        {label ?? null}
      </label>
    );
  };

  const CheckboxRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const label = node.props.label as string | undefined;
    const checked = Boolean(node.props.value);
    return (
      <label data-katalix-kind="checkbox" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" defaultChecked={checked} readOnly aria-label={label} />
        {label ?? null}
      </label>
    );
  };

  return {
    safeArea: SafeAreaRenderer,
    scroll: ScrollRenderer,
    flatList: FlatListRenderer,
    tabs: TabsRenderer,
    grid: GridRenderer,
    wrap: WrapRenderer,
    switchControl: SwitchRenderer,
    checkbox: CheckboxRenderer,
  };
};
