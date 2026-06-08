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

  paddingTop(value: StyleInput): this {
    return this.setStyle("paddingTop", value, "paddingTop");
  }

  paddingBottom(value: StyleInput): this {
    return this.setStyle("paddingBottom", value, "paddingBottom");
  }

  margin(value: StyleInput): this {
    return this.setStyle("margin", value, "margin");
  }

  marginTop(value: StyleInput): this {
    return this.setStyle("marginTop", value, "marginTop");
  }

  marginBottom(value: StyleInput): this {
    return this.setStyle("marginBottom", value, "marginBottom");
  }

  marginLeft(value: StyleInput): this {
    return this.setStyle("marginLeft", value, "marginLeft");
  }

  marginRight(value: StyleInput): this {
    return this.setStyle("marginRight", value, "marginRight");
  }

  alignItems(value: StyleInput): this {
    return this.setStyle("alignItems", value, "alignItems");
  }

  alignSelf(value: StyleInput): this {
    return this.setStyle("alignSelf", value, "alignSelf");
  }

  justifyContent(value: StyleInput): this {
    return this.setStyle("justifyContent", value, "justifyContent");
  }

  borderWidth(value: StyleInput): this {
    return this.setStyle("borderWidth", value, "borderWidth");
  }

  borderColor(value: StyleInput): this {
    return this.setStyle("borderColor", value, "borderColor");
  }

  shadow(value: StyleInput): this {
    return this.setStyle("shadow", value, "shadow");
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

  fontFamily(value: StyleInput): this {
    return this.setStyle("fontFamily", value, "fontFamily");
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
