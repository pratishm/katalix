import { describe, expect, it } from "vitest";
import { applyNativeTransformStyle } from "./motion-style.js";

describe("applyNativeTransformStyle", () => {
  it("maps scale and translateY to transform array", () => {
    const style = applyNativeTransformStyle({
      opacity: 0,
      scale: 0.96,
      translateY: 12,
      padding: 8,
    });
    expect(style).toEqual({
      opacity: 0,
      padding: 8,
      transform: [{ scale: 0.96 }, { translateY: 12 }],
    });
  });
});
