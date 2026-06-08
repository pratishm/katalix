import { createNode, type KatalixNode } from "@katalix/core";
import { finalizeState } from "../internal/finalize.js";
import { StyleChain } from "../internal/style.js";
import { pushTrace } from "../internal/trace.js";
import type { BuilderState } from "../internal/types.js";
import { ButtonBuilder } from "./button.js";
import { BadgeBuilder } from "./badge.js";
import { InputBuilder } from "./input.js";
import { TextBuilder } from "./text.js";

export type ContainerChildCallback<T extends ContainerBuilder> = (builder: T) => void;

export interface StackOptions {
  readonly gap?: number | string;
}

export interface RowOptions {
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
    options: StackOptions | RowOptions | undefined,
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

  row(
    options?: RowOptions,
    configure?: ContainerChildCallback<RowBuilder>,
  ): this;
  row(configure: ContainerChildCallback<RowBuilder>): this;
  row(
    optionsOrConfigure?: RowOptions | ContainerChildCallback<RowBuilder>,
    maybeConfigure?: ContainerChildCallback<RowBuilder>,
  ): this {
    const options =
      typeof optionsOrConfigure === "function" ? undefined : optionsOrConfigure;
    const configure =
      typeof optionsOrConfigure === "function" ? optionsOrConfigure : maybeConfigure;
    return this.nest(RowBuilder, "row", options, configure, "row");
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

  input(placeholder?: string, configure?: (input: InputBuilder) => void): InputBuilder {
    this.flushPending();
    const builder = new InputBuilder(
      {
        kind: "input",
        props: { ...(placeholder !== undefined ? { placeholder } : {}) },
        style: {},
        children: [],
        trace: [...this.state.trace, "input"],
      },
      this,
    );
    configure?.(builder);
    this.pending = { finalize: () => builder.toNode() };
    return builder;
  }

  badge(label: string, configure?: (builder: BadgeBuilder) => void): BadgeBuilder {
    this.flushPending();
    const builder = new BadgeBuilder(
      {
        kind: "badge",
        props: { label },
        style: {},
        children: [],
        trace: [...this.state.trace, `badge(${JSON.stringify(label)})`],
      },
      this,
    );
    configure?.(builder);
    this.pending = { finalize: () => builder.toNode() };
    return builder;
  }

  divider(): this {
    return this.appendLeaf("divider", {}, "divider");
  }

  spacer(options?: { readonly height?: number | string }): this {
    return this.appendLeaf(
      "spacer",
      { ...(options?.height !== undefined ? { height: options.height } : {}) },
      "spacer",
    );
  }

  safeArea(
    edges: "top" | "bottom" | "all" = "all",
    configure?: ContainerChildCallback<ContainerBuilder>,
  ): this {
    return this.nest(
      ContainerBuilder,
      "safeArea",
      undefined,
      (builder) => {
        builder.state.props.edges = edges;
        configure?.(builder);
      },
      `safeArea(${JSON.stringify(edges)})`,
    );
  }

  scroll(
    options?: { readonly horizontal?: boolean },
    configure?: ContainerChildCallback<ContainerBuilder>,
  ): this {
    return this.nest(
      ContainerBuilder,
      "scroll",
      undefined,
      (builder) => {
        if (options?.horizontal) {
          builder.state.props.horizontal = true;
        }
        configure?.(builder);
      },
      "scroll",
    );
  }

  flatList(configure?: ContainerChildCallback<ListBuilder>): this {
    return this.nest(ListBuilder, "flatList", undefined, configure, "flatList");
  }

  modal(configure?: ContainerChildCallback<ContainerBuilder>): this {
    return this.nest(ContainerBuilder, "modal", undefined, configure, "modal");
  }

  host(componentId: string, props?: Record<string, unknown>): this {
    return this.appendLeaf(
      "host",
      { componentId, ...(props ?? {}) },
      `host(${JSON.stringify(componentId)})`,
    );
  }

  field(label: string, configure?: (input: InputBuilder) => void): this {
    this.flushPending();
    const inputBuilder = new InputBuilder(
      {
        kind: "input",
        props: {},
        style: {},
        children: [],
        trace: [...this.state.trace, "field.input"],
      },
      this,
    );
    configure?.(inputBuilder);
    const inputNode = inputBuilder.toNode();
    this.state.children.push(
      createNode("field", {
        props: { label },
        children: [inputNode],
        builderTrace: [...this.state.trace, `field(${JSON.stringify(label)})`],
      }),
    );
    this.state.trace = pushTrace(this.state.trace, `field(${JSON.stringify(label)})`);
    return this;
  }

  checkbox(label: string, checked?: boolean): this {
    return this.appendLeaf(
      "checkbox",
      { label, ...(checked !== undefined ? { checked } : {}) },
      `checkbox(${JSON.stringify(label)})`,
    );
  }

  switchControl(label: string, value?: boolean): this {
    return this.appendLeaf(
      "switch",
      { label, ...(value !== undefined ? { value } : {}) },
      `switch(${JSON.stringify(label)})`,
    );
  }

  searchBar(placeholder?: string): this {
    return this.appendLeaf(
      "searchBar",
      { ...(placeholder !== undefined ? { placeholder } : {}) },
      "searchBar",
    );
  }

  tabs(configure?: ContainerChildCallback<ContainerBuilder>): this {
    return this.nest(ContainerBuilder, "tabs", undefined, configure, "tabs");
  }

  grid(configure?: ContainerChildCallback<ContainerBuilder>): this {
    return this.nest(ContainerBuilder, "grid", undefined, configure, "grid");
  }

  wrap(configure?: ContainerChildCallback<ContainerBuilder>): this {
    return this.nest(ContainerBuilder, "wrap", undefined, configure, "wrap");
  }

  avatar(options: {
    readonly source?: string;
    readonly initials?: string;
    readonly label?: string;
  }): this {
    return this.appendLeaf("avatar", options, "avatar");
  }

  skeleton(options?: { readonly width?: number | string; readonly height?: number | string }): this {
    return this.appendLeaf("skeleton", options ?? {}, "skeleton");
  }

  toast(message: string, variant?: string): this {
    return this.appendLeaf(
      "toast",
      { message, ...(variant !== undefined ? { variant } : {}) },
      `toast(${JSON.stringify(message)})`,
    );
  }

  errorBoundary(configure?: ContainerChildCallback<ContainerBuilder>): this {
    return this.nest(ContainerBuilder, "errorBoundary", undefined, configure, "errorBoundary");
  }

  fab(label: string, onPress?: string): this {
    return this.appendLeaf(
      "fab",
      { label, ...(onPress ? { onPress } : {}) },
      `fab(${JSON.stringify(label)})`,
    );
  }

  loader(message?: string): this {
    return this.appendLeaf(
      "loader",
      { ...(message !== undefined ? { message } : {}) },
      "loader",
    );
  }

  richText(content: string): this {
    return this.appendLeaf("richText", { content }, `richText`);
  }

  carousel(configure?: ContainerChildCallback<ContainerBuilder>): this {
    return this.nest(ContainerBuilder, "carousel", undefined, configure, "carousel");
  }

  webview(source: string): this {
    return this.appendLeaf("webview", { source }, "webview");
  }

  select(
    label: string,
    options?: readonly string[],
    onChange?: string,
    value?: string,
  ): this {
    return this.appendLeaf(
      "select",
      {
        label,
        options: options ?? [],
        ...(onChange ? { onChange } : {}),
        ...(value !== undefined ? { value } : {}),
      },
      `select(${JSON.stringify(label)})`,
    );
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
