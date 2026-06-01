import React from "react";
import type { KatalixTree } from "@katalix/core";
import type { TokenRegistry } from "@katalix/tokens";
import {
  KatalixActionContext,
  type KatalixActionHandler,
} from "./action-context.js";
import { KatalixHostRegistryContext, type HostComponentRegistry } from "./host-registry-context.js";
import { KatalixRegistryContext } from "./registry-context.js";
import { RenderNodeNative } from "./render-node-native.js";

/** Props for the top-level Katalix React Native renderer. */
export interface KatalixNativeRendererProps {
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
 * Top-level React Native component that renders a Katalix semantic tree.
 *
 * Wraps the tree in action and registry context providers so that all
 * descendant node renderers can resolve tokens and dispatch actions.
 *
 * ```tsx
 * import { KatalixNativeRenderer } from "@katalix/react-native";
 * import { Screen } from "@katalix/dsl";
 *
 * const tree = Screen("Home", s => s.text("Hello")).toTree();
 *
 * function App() {
 *   return (
 *     <KatalixNativeRenderer
 *       tree={tree}
 *       onAction={(action) => console.log("action:", action)}
 *     />
 *   );
 * }
 * ```
 */
export const KatalixNativeRenderer: React.FC<KatalixNativeRendererProps> = ({
  tree,
  onAction,
  registry,
  hostRegistry,
}) => {
  let content = <RenderNodeNative node={tree.root} />;

  if (onAction) {
    content = (
      <KatalixActionContext.Provider value={onAction}>{content}</KatalixActionContext.Provider>
    );
  }

  if (registry) {
    content = (
      <KatalixRegistryContext.Provider value={registry}>{content}</KatalixRegistryContext.Provider>
    );
  }

  if (hostRegistry) {
    content = (
      <KatalixHostRegistryContext.Provider value={hostRegistry}>
        {content}
      </KatalixHostRegistryContext.Provider>
    );
  }

  return content;
};
