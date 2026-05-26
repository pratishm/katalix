import React from "react";
import type { LattixNode, LattixAction } from "@lattix/core";
import { normalizeAction } from "@lattix/core";
import { resolveMotionToCSS } from "@lattix/motion";
import { useLattixAction } from "./action-context.js";
import { useTokenRegistry } from "./registry-context.js";
import { resolveStyleToCSS } from "./resolve-style.js";

/** Props passed to every node renderer. */
export interface LattixNodeProps {
  readonly node: LattixNode;
}

interface NodePresentation {
  readonly style: React.CSSProperties;
  readonly motionAttributes: Readonly<Record<string, string>>;
}

/** Resolve node styles and motion using renderer-local contexts. */
const useNodePresentation = (node: LattixNode): NodePresentation => {
  const registry = useTokenRegistry();
  const style = resolveStyleToCSS(node.normalizedStyle, { registry }, node.style);
  const motion = resolveMotionToCSS(node.animation);
  return {
    style: { ...style, ...motion.style },
    motionAttributes: motion.attributes,
  };
};

/** Recursively render children of a container node. */
const RenderChildren: React.FC<{ children?: readonly LattixNode[] }> = ({
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

/** Resolve an action prop (string id or LattixAction) into a click handler. */
const useActionHandler = (
  actionProp: unknown,
): (() => void) | undefined => {
  const dispatch = useLattixAction();
  if (actionProp === undefined || actionProp === null) {
    return undefined;
  }
  return () => {
    const action: LattixAction =
      typeof actionProp === "string"
        ? normalizeAction(actionProp)
        : (actionProp as LattixAction);
    dispatch(action);
  };
};

const ScreenRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-lattix-kind="screen"
      data-lattix-id={node.id}
      {...motionAttributes}
      style={{ minHeight: "100vh", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const StackRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-lattix-kind="stack"
      {...motionAttributes}
      style={{ display: "flex", flexDirection: "column", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const RowRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-lattix-kind="row"
      {...motionAttributes}
      style={{ display: "flex", flexDirection: "row", ...style }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const BoxRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div data-lattix-kind="box" {...motionAttributes} style={style}>
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );
};

const TextRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const content = node.props.content as string | undefined;
  return (
    <span data-lattix-kind="text" {...motionAttributes} style={style}>
      {content ?? ""}
    </span>
  );
};

const ImageRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const source = node.props.source as string | undefined;
  const alt = (node.props.alt as string | undefined) ?? "";
  return (
    <img
      data-lattix-kind="image"
      {...motionAttributes}
      src={source}
      alt={alt}
      style={style}
    />
  );
};

const ButtonRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const label = node.props.label as string | undefined;
  const variant = node.props.variant as string | undefined;
  const onClick = useActionHandler(node.props.onPress);
  return (
    <button
      data-lattix-kind="button"
      data-lattix-variant={variant}
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

const InputRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const dispatch = useLattixAction();
  const { style, motionAttributes } = useNodePresentation(node);
  const placeholder = node.props.placeholder as string | undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onChangeProp = node.props.onChange;
    if (onChangeProp !== undefined && onChangeProp !== null) {
      const action: LattixAction =
        typeof onChangeProp === "string"
          ? normalizeAction(onChangeProp)
          : (onChangeProp as LattixAction);
      dispatch({ ...action, payload: { ...action.payload, value: e.target.value } });
    }
  };

  return (
    <input
      data-lattix-kind="input"
      {...motionAttributes}
      placeholder={placeholder}
      onChange={handleChange}
      style={style}
    />
  );
};

const BadgeRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  const label = node.props.label as string | undefined;
  return (
    <span data-lattix-kind="badge" {...motionAttributes} style={style}>
      {label ?? ""}
    </span>
  );
};

const DividerRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return <hr data-lattix-kind="divider" {...motionAttributes} style={style} />;
};

const SpacerRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <div
      data-lattix-kind="spacer"
      {...motionAttributes}
      style={{ flex: 1, ...style }}
    />
  );
};

const ListRenderer: React.FC<LattixNodeProps> = ({ node }) => {
  const { style, motionAttributes } = useNodePresentation(node);
  return (
    <ul
      data-lattix-kind="list"
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
const NODE_RENDERERS: Readonly<Record<string, React.FC<LattixNodeProps>>> = {
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
 * Unknown kinds render a diagnostic `<div>` with a data attribute.
 */
export const RenderNode: React.FC<LattixNodeProps> = ({ node }) => {
  const Renderer = NODE_RENDERERS[node.kind];
  if (Renderer) {
    return <Renderer node={node} />;
  }
  return (
    <div data-lattix-kind={node.kind} data-lattix-unknown="true">
      {`[unsupported node kind: ${node.kind}]`}
    </div>
  );
};
