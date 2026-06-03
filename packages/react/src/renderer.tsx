import React from "react";
import type { KatalixTree } from "@katalix/core";
import type { TokenRegistry } from "@katalix/tokens";
import {
  KatalixActionContext,
  type KatalixActionHandler,
} from "./action-context.js";
import { KatalixHostRegistryContextProvider } from "./host-registry-context.js";
import type { HostComponentRegistry } from "./host-registry-context.js";
import { KatalixRegistryContext } from "./registry-context.js";
import { RenderNode } from "./render-node.js";

/** Props for the top-level Katalix web renderer. */
export interface KatalixRendererProps {
  /** The validated semantic tree to render. */
  readonly tree: KatalixTree;
  /** Handler invoked when a semantic action fires (e.g. button onPress). */
  readonly onAction?: KatalixActionHandler;
  /** Custom token registry for style resolution. Defaults to `defaultTokenRegistry`. */
  readonly registry?: TokenRegistry;
  /** Host components for `host` nodes (GAP-CORE-004). */
  readonly hostRegistry?: HostComponentRegistry;
}

/**
 * Top-level React component that renders a Katalix semantic tree.
 *
 * Wraps the tree in action and registry context providers so that all
 * descendant node renderers can resolve tokens and dispatch actions.
 *
 * ```tsx
 * import { KatalixRenderer } from "@katalix/react";
 * import { Screen } from "@katalix/dsl";
 *
 * const tree = Screen("Home", s => s.text("Hello")).toTree();
 *
 * function App() {
 *   return (
 *     <KatalixRenderer
 *       tree={tree}
 *       onAction={(action) => console.log("action:", action)}
 *     />
 *   );
 * }
 * ```
 */
export const KatalixRenderer: React.FC<KatalixRendererProps> = ({
  tree,
  onAction,
  registry,
  hostRegistry,
}) => {
  let content = <RenderNode node={tree.root} />;

  if (onAction) {
    content = (
      <KatalixActionContext.Provider value={onAction}>{content}</KatalixActionContext.Provider>
    );
  }

  if (hostRegistry) {
    content = (
      <KatalixHostRegistryContextProvider value={hostRegistry}>
        {content}
      </KatalixHostRegistryContextProvider>
    );
  }

  if (registry) {
    return (
      <KatalixRegistryContext.Provider value={registry}>{content}</KatalixRegistryContext.Provider>
    );
  }

  return content;
};
