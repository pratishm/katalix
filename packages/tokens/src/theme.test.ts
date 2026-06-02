import { describe, expect, it } from "vitest";
import { buildThemeRegistry, resolveThemeMode } from "./theme.js";

describe("buildThemeRegistry", () => {
  it("maps semantic tokens to dark variants", () => {
    const dark = buildThemeRegistry("dark");
    expect(dark["surface.canvas"]).toBe("#0f172a");
    expect(dark["text.primary"]).toBe("#f8fafc");
  });

  it("returns base registry for light mode", () => {
    const light = buildThemeRegistry("light");
    expect(light["surface.canvas"]).toBe("#f9fafb");
  });
});

describe("resolveThemeMode", () => {
  it("reads mode from provider config", () => {
    expect(resolveThemeMode({ mode: "dark" })).toBe("dark");
    expect(resolveThemeMode({ adapter: "katalix-tokens" })).toBe("light");
  });
});
