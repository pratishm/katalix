import { createNode, type KatalixNode } from "@katalix/core";
import { finalizeState } from "../internal/finalize.js";
import { StyleChain } from "../internal/style.js";
import { pushTrace } from "../internal/trace.js";
import type { BuilderState } from "../internal/types.js";
import { ButtonBuilder } from "./button.js";
import { TextBuilder } from "./text.js";

export type ContainerChildCallback<T extends ContainerBuilder> = (builder: T) => void;

export interface StackOptions {
  readonly gap?: number | string;
}

/** Base container builder — accumulates children, never leaks chain state to nodes. */
export class ContainerBuilder extends StyleChain {
  readonly state: BuilderState;
  protected pending: { finalize: () => KatalixNode } | null = null;

  constructor(state: BuilderState) {
    super();
    this.state = state;
  }

  debugLabel(label: string): this {
    this.state.debugLabel = label;
    this.state.trace = pushTrace(this.state.trace, `debugLabel(${label})`);
    return this;
  }

  /** Finalize any in-progress leaf builder into children. */
  flushPending(): void {
    if (this.pending) {
      this.state.children.push(this.pending.finalize());
      this.pending = null;
    }
  }

  protected nest<T extends ContainerBuilder>(
    Builder: new (state: BuilderState, parent: ContainerBuilder) => T,
    kind: BuilderState["kind"],
    options: StackOptions | undefined,
    configure: ContainerChildCallback<T> | undefined,
    op: string,
  ): this {
    this.flushPending();
    const childState: BuilderState = {
      kind,
      props: {},
      style: {},
      children: [],
      trace: [...this.state.trace, op],
    };
    if (options?.gap !== undefined) {
      childState.style.gap = options.gap;
    }
    const child = new Builder(childState, this);
    configure?.(child);
    child.flushPending();
    this.state.children.push(finalizeState(child.state));
    this.state.trace = pushTrace(this.state.trace, op);
    return this;
  }

  stack(
    options?: StackOptions,
    configure?: ContainerChildCallback<StackBuilder>,
  ): this;
  stack(configure: ContainerChildCallback<StackBuilder>): this;
  stack(
    optionsOrConfigure?: StackOptions | ContainerChildCallback<StackBuilder>,
    maybeConfigure?: ContainerChildCallback<StackBuilder>,
  ): this {
    const options =
      typeof optionsOrConfigure === "function" ? undefined : optionsOrConfigure;
    const configure =
      typeof optionsOrConfigure === "function" ? optionsOrConfigure : maybeConfigure;
    return this.nest(StackBuilder, "stack", options, configure, "stack");
  }

  row(configure?: ContainerChildCallback<RowBuilder>): this {
    return this.nest(RowBuilder, "row", undefined, configure, "row");
  }

  box(configure?: ContainerChildCallback<BoxBuilder>): this {
    return this.nest(BoxBuilder, "box", undefined, configure, "box");
  }

  list(configure?: ContainerChildCallback<ListBuilder>): this {
    return this.nest(ListBuilder, "list", undefined, configure, "list");
  }

  protected appendLeaf(
    kind: BuilderState["kind"],
    props: Record<string, unknown>,
    op: string,
  ): this {
    this.flushPending();
    this.state.children.push(
      createNode(kind, {
        props,
        builderTrace: pushTrace(this.state.trace, op),
      }),
    );
    this.state.trace = pushTrace(this.state.trace, op);
    return this;
  }

  image(source: string): this {
    return this.appendLeaf("image", { source }, `image(${JSON.stringify(source)})`);
  }

  input(placeholder?: string): this {
    return this.appendLeaf(
      "input",
      { ...(placeholder !== undefined ? { placeholder } : {}) },
      "input",
    );
  }

  badge(label: string): this {
    return this.appendLeaf("badge", { label }, `badge(${JSON.stringify(label)})`);
  }

  divider(): this {
    return this.appendLeaf("divider", {}, "divider");
  }

  spacer(): this {
    return this.appendLeaf("spacer", {}, "spacer");
  }

  text(content: string): TextBuilder {
    this.flushPending();
    const builder = new TextBuilder(
      {
        kind: "text",
        props: { content },
        style: {},
        children: [],
        trace: [...this.state.trace, `text(${JSON.stringify(content)})`],
      },
      this,
    );
    this.pending = { finalize: () => builder.toNode() };
    return builder;
  }

  button(label: string, configure?: (btn: ButtonBuilder) => void): ButtonBuilder {
    this.flushPending();
    const builder = new ButtonBuilder(
      {
        kind: "button",
        props: { label },
        style: {},
        children: [],
        trace: [...this.state.trace, `button(${JSON.stringify(label)})`],
      },
      this,
    );
    configure?.(builder);
    this.pending = { finalize: () => builder.toNode() };
    return builder;
  }

  toNode(): KatalixNode {
    this.flushPending();
    return finalizeState(this.state);
  }
}

export class StackBuilder extends ContainerBuilder {
  constructor(state: BuilderState, _parent: ContainerBuilder) {
    super(state);
  }
}

export class RowBuilder extends ContainerBuilder {
  constructor(state: BuilderState, _parent: ContainerBuilder) {
    super(state);
  }
}

export class BoxBuilder extends ContainerBuilder {
  constructor(state: BuilderState, _parent: ContainerBuilder) {
    super(state);
  }
}

export class ListBuilder extends ContainerBuilder {
  constructor(state: BuilderState, _parent: ContainerBuilder) {
    super(state);
  }
}
