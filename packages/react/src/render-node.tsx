import React from "react";
import type { KatalixNode, KatalixAction } from "@katalix/core";
import { normalizeAction } from "@katalix/core";
import { resolveMotionToCSS } from "@katalix/motion";
import { useKatalixAction } from "./action-context.js";
import { useTokenRegistry } from "./registry-context.js";
import { resolveStyleToCSS } from "./resolve-style.js";
import { createWebExtraRenderers } from "./extra-renderers.js";
import { createWebCatalogRenderers } from "./catalog-renderers.js";
import { createWebLayoutRenderers } from "./web-layout-renderers.js";

/** Props passed to every node renderer. */
export interface KatalixNodeProps {
  readonly node: KatalixNode;
}

interface NodePresentation {
  readonly style: React.CSSProperties;
  readonly motionAttributes: Readonly<Record<string, string>>;
}

/** Resolve node styles and motion using renderer-local contexts. */
const useNodePresentation = (node: KatalixNode): NodePresentation => {
  const registry = useTokenRegistry();
  const style = resolveStyleToCSS(node.normalizedStyle, { registry }, node.style);
  const motion = resolveMotionToCSS(node.animation);
  return {
    style: { ...style, ...motion.style },
    motionAttributes: motion.attributes,
  };
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
        <RenderNode key={child.id ?? `${child.kind}-${i}`} node={child} />
      ))}
    </>
  );
};

/** Resolve an action prop (string id or KatalixAction) into a click handler. */
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
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-katalix-kind="screen"
      data-katalix-id={node.id}
      {...motionAttributes}
      style={{ minHeight: "100vh", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const StackRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-katalix-kind="stack"
      {...motionAttributes}
      style={{ display: "flex", flexDirection: "column", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const RowRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-katalix-kind="row"
      {...motionAttributes}
      style={{ display: "flex", flexDirection: "row", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const BoxRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div data-katalix-kind="box" {...motionAttributes} style={style}>
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const TextRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const content = node.props.content as string | undefined;
  const numberOfLines = node.props.numberOfLines as number | undefined;
  const selectable = Boolean(node.props.selectable);
  return (
    <span
      data-katalix-kind="text"
      {...motionAttributes}
      style={{
        ...style,
        ...(selectable ? { userSelect: "text", WebkitUserSelect: "text" } : {}),
        ...(numberOfLines
          ? {
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: numberOfLines,
              WebkitBoxOrient: "vertical",
            }
          : {}),
      }}
    >
      {content ?? ""}
    </span>
  );
};

const ImageRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const source = node.props.source as string | undefined;
  const alt = (node.props.alt as string | undefined) ?? "";
  return (
    <img
      data-katalix-kind="image"
      {...motionAttributes}
      src={source}
      alt={alt}
      style={style}
    />
  );
};

const ButtonRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const label = node.props.label as string | undefined;
  const variant = node.props.variant as string | undefined;
  const onClick = useActionHandler(node.props.onPress);
  return (
    <button
      data-katalix-kind="button"
      data-katalix-variant={variant}
      {...motionAttributes}
      onClick={onClick}
      style={style}
    >
      {node.children && node.children.length > 0 ? (
        <RenderChildren>{node.children}</RenderChildren>
      ) : (
        label ?? ""
      )}
    </button>
  );
};

const InputRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const dispatch = useKatalixAction();
  const { style, motionAttributes } = useNodePresentation(node);
  const placeholder = node.props.placeholder as string | undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onChangeProp = node.props.onChange;
    if (onChangeProp !== undefined && onChangeProp !== null) {
      const action: KatalixAction =
        typeof onChangeProp === "string"
          ? normalizeAction(onChangeProp)
          : (onChangeProp as KatalixAction);
      dispatch({ ...action, payload: { ...action.payload, value: e.target.value } });
    }
  };

  return (
    <input
      data-katalix-kind="input"
      {...motionAttributes}
      placeholder={placeholder}
      onChange={handleChange}
      style={style}
    />
  );
};

const BadgeRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const label = node.props.label as string | undefined;
  return (
    <span data-katalix-kind="badge" {...motionAttributes} style={style}>
      {label ?? ""}
    </span>
  );
};

const DividerRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return <hr data-katalix-kind="divider" {...motionAttributes} style={style} />;
};

const SpacerRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-katalix-kind="spacer"
      {...motionAttributes}
      style={{ flex: 1, ...style }}
    />
  );
};

const ListRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <ul
      data-katalix-kind="list"
      {...motionAttributes}
      style={{ display: "flex", flexDirection: "column", ...style }}
    >
      {node.children?.map((child, i) => (
        <li key={child.id ?? `${child.kind}-${i}`}>
          <RenderNode node={child} />
        </li>
      ))}
    </ul>
  );
};

/** Built-in node kind → renderer mapping. */
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
  ...createWebLayoutRenderers((props) => renderNodeRef.current(props)),
  ...createWebExtraRenderers((props) => renderNodeRef.current(props)),
  ...createWebCatalogRenderers((props) => renderNodeRef.current(props)),
};

/**
 * Render a single semantic node by dispatching to the appropriate kind renderer.
 * Unknown kinds render a diagnostic `<div>` with a data attribute.
 */
export const RenderNode: React.FC<KatalixNodeProps> = ({ node }) => {
  const Renderer = NODE_RENDERERS[node.kind];
  if (Renderer) {
    return <Renderer node={node} />;
  }
  return (
    <div data-katalix-kind={node.kind} data-katalix-unknown="true">
      {`[unsupported node kind: ${node.kind}]`}
    </div>
  );
};

renderNodeRef.current = RenderNode;
