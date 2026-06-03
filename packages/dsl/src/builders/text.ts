import { pushTrace } from "../internal/trace.js";
import { LeafBuilder } from "./leaf.js";

export class TextBuilder extends LeafBuilder {
  numberOfLines(count: number): this {
    this.state.props.numberOfLines = count;
    this.state.trace = pushTrace(this.state.trace, `numberOfLines(${count})`);
    return this;
  }

  selectable(enabled = true): this {
    this.state.props.selectable = enabled;
    this.state.trace = pushTrace(this.state.trace, "selectable");
    return this;
  }
}
