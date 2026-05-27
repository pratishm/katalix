import type {
  KatalixAnimation,
  KatalixAnimationPreset,
} from "@katalix/core";
import { pushTrace } from "./trace.js";
import type { BuilderState, StyleInput } from "./types.js";

/** Shared style chaining for container and leaf builders. */
export abstract class StyleChain {
  protected abstract readonly state: BuilderState;

  protected setStyle(key: string, value: StyleInput, op: string): this {
    this.state.style[key] = value;
    this.state.trace = pushTrace(this.state.trace, op);
    return this;
  }

  animate(
    preset: KatalixAnimationPreset,
    options: Omit<KatalixAnimation, "preset"> = {},
  ): this {
    this.state.animation = { preset, ...options };
    this.state.trace = pushTrace(this.state.trace, `animate(${preset})`);
    return this;
  }

  padding(value: StyleInput): this {
    return this.setStyle("padding", value, "padding");
  }

  margin(value: StyleInput): this {
    return this.setStyle("margin", value, "margin");
  }

  marginTop(value: StyleInput): this {
    return this.setStyle("marginTop", value, "marginTop");
  }

  background(value: StyleInput): this {
    return this.setStyle("background", value, "background");
  }

  color(value: StyleInput): this {
    return this.setStyle("color", value, "color");
  }

  gap(value: StyleInput): this {
    return this.setStyle("gap", value, "gap");
  }

  radius(value: StyleInput): this {
    return this.setStyle("borderRadius", value, "radius");
  }

  fontSize(value: StyleInput): this {
    return this.setStyle("fontSize", value, "fontSize");
  }

  weight(value: StyleInput): this {
    return this.setStyle("fontWeight", value, "weight");
  }

  size(value: StyleInput): this {
    return this.fontSize(value);
  }

  width(value: StyleInput): this {
    return this.setStyle("width", value, "width");
  }

  height(value: StyleInput): this {
    return this.setStyle("height", value, "height");
  }
}
