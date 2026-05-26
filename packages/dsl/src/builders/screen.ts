import type { LattixNode } from "@lattix/core";
import {
  createTree,
  explainNode,
  printTree,
  type CreateTreeOptions,
  type LattixValidatedTree,
} from "@lattix/diagnostics";
import { ContainerBuilder } from "./container.js";
import type { BuilderState } from "../internal/types.js";

export type ScreenCallback = (screen: ScreenBuilder) => void;

/** @deprecated Use tree.validation — validation is always attached on toTree(). */
export type LattixDebugInfo = LattixValidatedTree & {
  readonly printed: string;
};

/** Root screen builder — entry point for fluent UI definitions. */
export class ScreenBuilder extends ContainerBuilder {
  constructor(id: string, configure?: ScreenCallback) {
    const state: BuilderState = {
      kind: "screen",
      id,
      props: {},
      style: {},
      children: [],
      trace: [`Screen(${JSON.stringify(id)})`],
    };
    super(state);
    configure?.(this);
    this.flushPending();
  }

  override toNode(): LattixNode {
    return super.toNode();
  }

  /**
   * Build the semantic tree. Validation and per-node diagnostics are automatic.
   * Throws in strict mode when the tree is invalid (default).
   */
  toTree(options?: CreateTreeOptions): LattixValidatedTree {
    return createTree(this.toNode(), options);
  }

  /**
   * Explain a node at a semantic path using diagnostics already on the tree.
   */
  explain(path: string, options?: CreateTreeOptions): ReturnType<typeof explainNode> {
    const tree = this.toTree(options);
    return explainNode(tree, path, { diagnostics: tree.validation.diagnostics });
  }

  /** Pretty-print the tree with builder traces and validation summary. */
  debug(options?: CreateTreeOptions): LattixDebugInfo {
    const tree = this.toTree(options);
    return {
      ...tree,
      printed: printTree(tree, { showBuilderTrace: true }),
    };
  }
}
