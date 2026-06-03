import { describe, expect, it } from "vitest";
import { defaultTokenRegistry } from "./registry.js";
import {
  parseCssBoxShadow,
  resolveCssBoxShadow,
  resolveNativeShadowStyle,
} from "./shadow.js";

describe("shadow resolution", () => {
  it("maps elevation tokens to RN shadow props", () => {
    const style = resolveNativeShadowStyle("elevation.sm", defaultTokenRegistry);
    expect(style?.shadowRadius).toBe(2);
    expect(style?.elevation).toBe(2);
  });

  it("maps numeric shadow presets", () => {
    const style = resolveNativeShadowStyle(2, defaultTokenRegistry);
    expect(style?.shadowRadius).toBe(6);
  });

  it("parses CSS box-shadow strings", () => {
    const style = parseCssBoxShadow("0 4px 6px rgba(0,0,0,0.1)");
    expect(style?.shadowOffset.height).toBe(4);
    expect(style?.shadowOpacity).toBeCloseTo(0.1);
  });

  it("resolves CSS box-shadow for web", () => {
    expect(resolveCssBoxShadow("elevation.md", defaultTokenRegistry)).toContain("4px");
  });
});
