import { normalizeAction } from "@katalix/core";
import { pushTrace } from "../internal/trace.js";
import { LeafBuilder } from "./leaf.js";

export class ButtonBuilder extends LeafBuilder {
  onPress(actionId: string): this {
    this.state.props.onPress = normalizeAction(actionId);
    this.state.trace = pushTrace(this.state.trace, `onPress(${JSON.stringify(actionId)})`);
    return this;
  }

  variant(value: string): this {
    this.state.props.variant = value;
    this.state.trace = pushTrace(this.state.trace, `variant(${JSON.stringify(value)})`);
    return this;
  }

  loading(value = true): this {
    this.state.props.loading = value;
    this.state.trace = pushTrace(this.state.trace, `loading(${value})`);
    return this;
  }

  disabled(value = true): this {
    this.state.props.disabled = value;
    this.state.trace = pushTrace(this.state.trace, `disabled(${value})`);
    return this;
  }

  compact(value = true): this {
    this.state.props.compact = value;
    this.state.trace = pushTrace(this.state.trace, `compact(${value})`);
    return this;
  }
}
