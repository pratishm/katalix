import { createNode, createTree, configureKatalix, resetKatalixConfig } from "@katalix/core";
import { Screen } from "@katalix/dsl";
import { configureKatalix as configureDiag, resetKatalixConfig as resetDiag } from "@katalix/diagnostics";
import { afterEach, describe, expect, it } from "vitest";
import {
  defaultTokenRegistry,
  isTokenReference,
  normalizeStyle,
  normalizeTreeStyles,
  resolveToken,
  setAuthoringTokenRegistry,
  validateNodeStyle,
} from "./index.js";

afterEach(() => {
  resetKatalixConfig();
  resetDiag();
});

describe("isTokenReference", () => {
  it("detects dot-notation token refs vs raw literals", () => {
    expect(isTokenReference("text.primary")).toBe(true);
    expect(isTokenReference("#101828")).toBe(false);
    expect(isTokenReference(16)).toBe(false);
  });
});

describe("normalizeStyle", () => {
  it("splits token refs and literals in normalized output", () => {
    const result = normalizeStyle({
      color: "text.primary",
      padding: 16,
      background: "surface.canvas",
    });

    expect(result.normalized.color).toEqual({ kind: "token", ref: "text.primary" });
    expect(result.normalized.padding).toEqual({ kind: "literal", value: 16 });
    expect(result.diagnostics).toHaveLength(0);
  });

  it("diagnoses unknown style properties", () => {
    const result = normalizeStyle({ notARealProp: 1 });
    expect(result.diagnostics[0]?.code).toBe("KATALIX_UNKNOWN_STYLE_PROP");
  });

  it("diagnoses unknown token references", () => {
    const result = normalizeStyle({ color: "text.unknown" });
    expect(result.diagnostics[0]?.code).toBe("KATALIX_UNKNOWN_TOKEN");
  });

  it("accepts custom tokens from setAuthoringTokenRegistry", () => {
    setAuthoringTokenRegistry({ ...defaultTokenRegistry, "brand.accent": "#ff00ff" });
    try {
      const result = normalizeStyle({ color: "brand.accent" });
      expect(result.diagnostics).toHaveLength(0);
      expect(result.normalized.color).toEqual({ kind: "token", ref: "brand.accent" });
    } finally {
      setAuthoringTokenRegistry(undefined);
    }
  });
});

describe("resolveToken", () => {
  it("resolves a known token to its literal value", () => {
    expect(resolveToken("text.primary", defaultTokenRegistry)).toBe("#111827");
  });
});

describe("normalizeTreeStyles", () => {
  it("attaches normalizedStyle on every styled node", () => {
    configureKatalix({ validationMode: "report", throwOnValidationError: false });
    configureDiag({ validationMode: "report", throwOnValidationError: false });

    const tree = createTree(
      createNode("screen", {
        children: [
          createNode("text", {
            props: { content: "Hi" },
            style: { color: "text.primary", fontSize: 18 },
          }),
        ],
      }),
    );

    const processed = normalizeTreeStyles(tree.root);
    const text = processed.children?.[0];
    expect(text?.normalizedStyle?.color).toEqual({ kind: "token", ref: "text.primary" });
    expect(text?.normalizedStyle?.fontSize).toEqual({ kind: "literal", value: 18 });
  });
});

describe("fluent DSL with tokens and raw values", () => {
  it("authors mixed styles that normalize on toTree", () => {
    configureKatalix({ validationMode: "report", throwOnValidationError: false });
    configureDiag({ validationMode: "report", throwOnValidationError: false });

    const home = Screen("Home", (s) =>
      s
        .padding(16)
        .background("surface.canvas")
        .text("Hello")
        .color("text.primary")
        .size(18),
    );

    const tree = home.toTree({ mode: "report", throwOnError: false });
    expect(tree.root.normalizedStyle?.padding?.kind).toBe("literal");
    expect(tree.root.normalizedStyle?.background?.kind).toBe("token");

    const text = tree.root.children?.[0];
    expect(text?.normalizedStyle?.color?.kind).toBe("token");
    expect(text?.normalizedStyle?.fontSize?.kind).toBe("literal");
  });

  it("includes style diagnostics in built-in tree validation", () => {
    configureKatalix({ validationMode: "report", throwOnValidationError: false });
    configureDiag({ validationMode: "report", throwOnValidationError: false });
    const home = Screen("Home", (s) => s.background("brand.unknown"));
    const tree = home.toTree({ mode: "report", throwOnError: false });
    expect(tree.validation.valid).toBe(false);
    expect(tree.validation.diagnostics.some((d) => d.code === "KATALIX_UNKNOWN_TOKEN")).toBe(
      true,
    );
  });
});

describe("validateNodeStyle", () => {
  it("returns diagnostics for invalid node style without silent failure", () => {
    configureKatalix({ validationMode: "report", throwOnValidationError: false });
    const node = createNode("box", { style: { boxShadow: 1 } });
    const result = validateNodeStyle(node);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0]?.code).toBe("KATALIX_UNKNOWN_STYLE_PROP");
  });
});
