import type { LattixNode } from "@lattix/core";
import { finalizeState } from "../internal/finalize.js";
import { StyleChain } from "../internal/style.js";
import { pushTrace } from "../internal/trace.js";
import type { BuilderState } from "../internal/types.js";
import type { ButtonBuilder } from "./button.js";
import {
  type BoxBuilder,
  type ContainerBuilder,
  type ListBuilder,
  type RowBuilder,
  type StackBuilder,
  type StackOptions,
} from "./container.js";
import type { TextBuilder } from "./text.js";

/** Leaf builders delegate sibling container ops back to the parent after committing. */
export abstract class LeafBuilder extends StyleChain {
  protected readonly state: BuilderState;
  protected readonly parent: ContainerBuilder;

  constructor(state: BuilderState, parent: ContainerBuilder) {
    super();
    this.state = state;
    this.parent = parent;
  }

  debugLabel(label: string): this {
    this.state.debugLabel = label;
    this.state.trace = pushTrace(this.state.trace, `debugLabel(${label})`);
    return this;
  }

  toNode(): LattixNode {
    return finalizeState(this.state);
  }

  protected returnToParent(): ContainerBuilder {
    this.parent.flushPending();
    return this.parent;
  }

  text(content: string): TextBuilder {
    return this.returnToParent().text(content);
  }

  button(label: string, configure?: (b: ButtonBuilder) => void): ButtonBuilder {
    return this.returnToParent().button(label, configure);
  }

  stack(
    options?: StackOptions,
    configure?: (b: StackBuilder) => void,
  ): ContainerBuilder;
  stack(configure: (b: StackBuilder) => void): ContainerBuilder;
  stack(
    optionsOrConfigure?: StackOptions | ((b: StackBuilder) => void),
    maybeConfigure?: (b: StackBuilder) => void,
  ): ContainerBuilder {
    return this.returnToParent().stack(
      optionsOrConfigure as StackOptions,
      maybeConfigure as (b: StackBuilder) => void,
    );
  }

  row(configure?: (b: RowBuilder) => void): ContainerBuilder {
    return this.returnToParent().row(configure);
  }

  box(configure?: (b: BoxBuilder) => void): ContainerBuilder {
    return this.returnToParent().box(configure);
  }

  list(configure?: (b: ListBuilder) => void): ContainerBuilder {
    return this.returnToParent().list(configure);
  }
}
