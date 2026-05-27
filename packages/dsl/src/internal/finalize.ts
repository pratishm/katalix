import { createNode, validateNodeShallow } from "@katalix/core";
import type { KatalixNode } from "@katalix/core";
import { validateNodeStyle } from "@katalix/tokens";
import type { BuilderState } from "./types.js";

/** Convert builder state into a normalized semantic node with built-in validation and styles. */
export const finalizeState = (state: BuilderState): KatalixNode => {
  const style =
    Object.keys(state.style).length > 0
      ? (state.style as KatalixNode["style"])
      : undefined;

  const node = createNode(state.kind, {
    id: state.id,
    debugLabel: state.debugLabel,
    props: { ...state.props },
    style,
    animation: state.animation,
    children: state.children.length > 0 ? [...state.children] : undefined,
    builderTrace: state.trace.length > 0 ? [...state.trace] : undefined,
  });

  const withStyle = validateNodeStyle(node);
  return validateNodeShallow(withStyle.node).node;
};
