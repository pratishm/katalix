import React from "react";
import type { LattixTree } from "@lattix/core";
import type { TokenRegistry } from "@lattix/tokens";
import {
  LattixActionContext,
  type LattixActionHandler,
} from "./action-context.js";
import { LattixRegistryContext } from "./registry-context.js";
import { RenderNode } from "./render-node.js";

/** Props for the top-level Lattix web renderer. */
export interface LattixRendererProps {
  /** The validated semantic tree to render. */
  readonly tree: LattixTree;
  /** Handler invoked when a semantic action fires (e.g. button onPress). */
  readonly onAction?: LattixActionHandler;
  /** Custom token registry for style resolution. Defaults to `defaultTokenRegistry`. */
  readonly registry?: TokenRegistry;
}

/**
 * Top-level React component that renders a Lattix semantic tree.
 *
 * Wraps the tree in action and registry context providers so that all
 * descendant node renderers can resolve tokens and dispatch actions.
 *
 * ```tsx
 * import { LattixRenderer } from "@lattix/react";
 * import { Screen } from "@lattix/dsl";
 *
 * const tree = Screen("Home", s => s.text("Hello")).toTree();
 *
 * function App() {
 *   return (
 *     <LattixRenderer
 *       tree={tree}
 *       onAction={(action) => console.log("action:", action)}
 *     />
 *   );
 * }
 * ```
 */
export const LattixRenderer: React.FC<LattixRendererProps> = ({
  tree,
  onAction,
  registry,
}) => {
  const content = <RenderNode node={tree.root} />;

  const withAction = onAction ? (
    <LattixActionContext.Provider value={onAction}>
      {content}
    </LattixActionContext.Provider>
  ) : (
    content
  );

  if (registry) {
    return (
      <LattixRegistryContext.Provider value={registry}>
        {withAction}
      </LattixRegistryContext.Provider>
    );
  }

  return withAction;
};
