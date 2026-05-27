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
}
