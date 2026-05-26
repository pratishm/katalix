import React from "react";
import type { LattixTree } from "@lattix/core";
import type { TokenRegistry } from "@lattix/tokens";
import {
  LattixActionContext,
  type LattixActionHandler,
} from "./action-context.js";
import { LattixRegistryContext } from "./registry-context.js";
import { RenderNodeNative } from "./render-node-native.js";

/** Props for the top-level Lattix React Native renderer. */
export interface LattixNativeRendererProps {
  /** The validated semantic tree to render. */
  readonly tree: LattixTree;
  /** Handler invoked when a semantic action fires (e.g. button onPress). */
  readonly onAction?: LattixActionHandler;
  /** Custom token registry for style resolution. Defaults to `defaultTokenRegistry`. */
  readonly registry?: TokenRegistry;
}

/**
 * Top-level React Native component that renders a Lattix semantic tree.
 *
 * Wraps the tree in action and registry context providers so that all
 * descendant node renderers can resolve tokens and dispatch actions.
 *
 * ```tsx
 * import { LattixNativeRenderer } from "@lattix/react-native";
 * import { Screen } from "@lattix/dsl";
 *
 * const tree = Screen("Home", s => s.text("Hello")).toTree();
 *
 * function App() {
 *   return (
 *     <LattixNativeRenderer
 *       tree={tree}
 *       onAction={(action) => console.log("action:", action)}
 *     />
 *   );
 * }
 * ```
 */
export const LattixNativeRenderer: React.FC<LattixNativeRendererProps> = ({
  tree,
  onAction,
  registry,
}) => {
  const content = <RenderNodeNative node={tree.root} />;

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
