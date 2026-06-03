import { describe, expect, it } from "vitest";
import { resolveAppPlatform } from "./resolve-app-platform.js";

describe("resolveAppPlatform", () => {
  it("prefers explicit platform", () => {
    expect(resolveAppPlatform({ platform: "web" })).toBe("web");
    expect(resolveAppPlatform({ platform: "native", webManifest: {} as never })).toBe(
      "native",
    );
  });

  it("auto-selects native when nativeManifest is present", () => {
    expect(
      resolveAppPlatform({
        nativeManifest: { capabilities: [] } as never,
        webManifest: {} as never,
      }),
    ).toBe("native");
  });

  it("auto-selects web when only webManifest is present", () => {
    expect(resolveAppPlatform({ webManifest: { pwa: { enabled: false } } as never })).toBe(
      "web",
    );
  });

  it("defaults to native", () => {
    expect(resolveAppPlatform({})).toBe("native");
  });
});
