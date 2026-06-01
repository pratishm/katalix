import type { KatalixNode } from "@katalix/core";
import { pushTrace } from "../internal/trace.js";
import {
  createTree,
  explainNode,
  printTree,
  type CreateTreeOptions,
  type KatalixValidatedTree,
} from "@katalix/diagnostics";
import { setAuthoringTokenRegistry } from "@katalix/tokens";
import { ContainerBuilder } from "./container.js";
import type { BuilderState } from "../internal/types.js";

export type ScreenCallback = (screen: ScreenBuilder) => void;

/** @deprecated Use tree.validation — validation is always attached on toTree(). */
export type KatalixDebugInfo = KatalixValidatedTree & {
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

  override toNode(): KatalixNode {
    return super.toNode();
  }

  /** Append a pre-built semantic node (patterns, HostComponent, SDUI). */
  append(node: KatalixNode): this {
    this.flushPending();
    this.state.children.push(node);
    this.state.trace = pushTrace(this.state.trace, `append(${node.kind})`);
    return this;
  }

  safeArea(edges: "top" | "bottom" | "all" = "all"): this {
    this.state.props.safeArea = edges;
    this.state.trace = pushTrace(this.state.trace, `safeArea(${edges})`);
    return this;
  }

  /**
   * Build the semantic tree. Validation and per-node diagnostics are automatic.
   * Throws in strict mode when the tree is invalid (default).
   */
  toTree(options?: CreateTreeOptions): KatalixValidatedTree {
    if (options?.registry) {
      setAuthoringTokenRegistry(options.registry);
      try {
        return createTree(this.toNode(), options);
      } finally {
        setAuthoringTokenRegistry(undefined);
      }
    }
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
  debug(options?: CreateTreeOptions): KatalixDebugInfo {
    const tree = this.toTree(options);
    return {
      ...tree,
      printed: printTree(tree, { showBuilderTrace: true }),
    };
  }
}
