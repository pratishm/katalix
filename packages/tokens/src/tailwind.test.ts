import { describe, expect, it } from "vitest";
import { resolveTailwindClass, tailwindClassesToStyle } from "./tailwind.js";

describe("tailwind bridge", () => {
  it("resolves bg/text utilities to registry values", () => {
    const value = resolveTailwindClass("text-slate-900");
    expect(value).toBeDefined();
  });

  it("maps class lists to style token refs", () => {
    const style = tailwindClassesToStyle("bg-white text-slate-900");
    expect(style.backgroundColor).toBe("surface.canvas");
    expect(style.color).toBe("text.primary");
  });
});
