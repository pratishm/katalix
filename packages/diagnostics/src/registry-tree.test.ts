import { describe, expect, it } from "vitest";
import { Screen } from "@katalix/dsl";
import { createTokenRegistry, setAuthoringTokenRegistry } from "@katalix/tokens";

describe("toTree registry", () => {
  it("uses custom registry when normalizing styles", () => {
    const registry = createTokenRegistry({ "brand.accent": "#ff00ff" });
    setAuthoringTokenRegistry(registry);
    const tree = Screen("Home", (s) =>
      s.text("Hi").color("brand.accent"),
    ).toTree({ registry, mode: "report", throwOnError: false });
    setAuthoringTokenRegistry(undefined);

    const text = tree.root.children?.[0];
    expect(text?.normalizedStyle?.color).toEqual({
      kind: "token",
      ref: "brand.accent",
    });
    expect(tree.validation.valid).toBe(true);
    expect(registry["brand.accent"]).toBe("#ff00ff");
  });

  it("uses setAuthoringTokenRegistry without explicit toTree({ registry })", () => {
    const registry = createTokenRegistry({ "brand.accent": "#ff00ff" });
    setAuthoringTokenRegistry(registry);
    try {
      const tree = Screen("Home", (s) =>
        s.text("Hi").color("brand.accent"),
      ).toTree({ mode: "report", throwOnError: false });

      expect(tree.validation.valid).toBe(true);
      expect(tree.validation.diagnostics.some((d) => d.code === "KATALIX_UNKNOWN_TOKEN")).toBe(
        false,
      );
    } finally {
      setAuthoringTokenRegistry(undefined);
    }
  });
});
