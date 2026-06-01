import { pushTrace } from "../internal/trace.js";
import { LeafBuilder } from "./leaf.js";

export type InputType =
  | "text"
  | "password"
  | "email"
  | "phone"
  | "numeric"
  | "multiline";

export class InputBuilder extends LeafBuilder {
  value(initial: string): this {
    this.state.props.value = initial;
    this.state.trace = pushTrace(this.state.trace, `value(${JSON.stringify(initial)})`);
    return this;
  }

  onChange(actionId: string): this {
    this.state.props.onChange = actionId;
    this.state.trace = pushTrace(this.state.trace, `onChange(${JSON.stringify(actionId)})`);
    return this;
  }

  inputType(type: InputType): this {
    this.state.props.inputType = type;
    this.state.trace = pushTrace(this.state.trace, `inputType(${type})`);
    return this;
  }

  secure(enabled = true): this {
    this.state.props.secure = enabled;
    this.state.trace = pushTrace(this.state.trace, "secure");
    return this;
  }

  multiline(enabled = true): this {
    this.state.props.multiline = enabled;
    this.state.trace = pushTrace(this.state.trace, "multiline");
    return this;
  }
}
