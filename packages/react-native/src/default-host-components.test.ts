import { describe, expect, it } from "vitest";
import { mergeHostRegistries } from "./default-host-components.js";

describe("mergeHostRegistries", () => {
  it("merges override entries over defaults", () => {
    const base = { WebView: () => null };
    const override = { Chart: () => null };
    const merged = mergeHostRegistries(base, override);
    expect(Object.keys(merged).sort()).toEqual(["Chart", "WebView"]);
  });
});
