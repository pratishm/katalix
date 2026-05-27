import { createNode } from "@katalix/core";
import { Screen } from "@katalix/dsl";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureKatalix,
  createTree,
  explainNode,
  formatDiagnostic,
  printDiagnostics,
  printTree,
  resetKatalixConfig,
} from "./index.js";

afterEach(() => {
  resetKatalixConfig();
});

describe("formatDiagnostic", () => {
  it("formats a diagnostic with path, field, and suggestion", () => {
    const text = formatDiagnostic({
      code: "KATALIX_TEXT_MISSING_CONTENT",
      summary: "Text node is missing content",
      message: 'Text node at "screen/text[0]" is missing required prop "content".',
      nodeKind: "text",
      path: "screen/text[0]",
      field: "content",
      received: undefined,
      expected: "non-empty string",
      suggestion: 'Set props.content, e.g. props: { content: "Hello" }.',
      severity: "error",
    });

    expect(text).toContain("KATALIX_TEXT_MISSING_CONTENT");
    expect(text).toContain("screen/text[0]");
    expect(text).toContain("Suggestion:");
  });
});

describe("createTree (built-in validation)", () => {
  it("enriches diagnostics with authoring context on every node by default", () => {
    configureKatalix({ validationMode: "report", throwOnValidationError: false });

    const tree = createTree(
      createNode("screen", {
        children: [
          createNode("text", {
            props: {},
            debugLabel: "greeting",
            meta: {
              builderTrace: ['Screen("Home")', 'text("Hello")'],
            },
          }),
        ],
      }),
    );

    expect(tree.validation.valid).toBe(false);
    const text = tree.root.children?.[0];
    expect(text?.meta?.diagnostics?.[0]?.authoring?.debugLabel).toBe("greeting");
    expect(text?.meta?.diagnostics?.[0]?.authoring?.builderTrace).toContain('text("Hello")');
  });

  it("treats empty containers as warnings in tolerant mode", () => {
    const tree = createTree(
      createNode("screen", {
        children: [createNode("stack", { children: [] })],
      }),
      { mode: "tolerant", throwOnError: false },
    );

    expect(tree.validation.valid).toBe(true);
    expect(tree.validation.warnings.length).toBeGreaterThan(0);
    expect(tree.validation.errors).toHaveLength(0);
  });

  it("throws in strict mode by default", () => {
    configureKatalix({ validationMode: "strict", throwOnValidationError: true });
    expect(() =>
      createTree(
        createNode("screen", {
          children: [createNode("text", { props: {} })],
        }),
      ),
    ).toThrow();
  });
});

describe("explainNode", () => {
  it("reads diagnostics from the node by default", () => {
    configureKatalix({ validationMode: "report", throwOnValidationError: false });
    const broken = Screen("Home", (s) => s.text(""));
    const tree = broken.toTree({ mode: "report", throwOnError: false });
    const textPath = tree.root.children?.[0]?.meta?.path!;

    const explanation = explainNode(tree, textPath);
    expect(explanation.found).toBe(true);
    expect(explanation.relatedDiagnostics.length).toBeGreaterThan(0);
    expect(explanation.formatted).toContain("nodeDiagnostics:");
  });
});

describe("printTree", () => {
  it("includes builder trace when requested", () => {
    const home = Screen("Home", (s) =>
      s.stack(undefined, (stack) => stack.text("Hello")),
    );
    const output = printTree(home.toTree(), { showBuilderTrace: true });
    expect(output).toContain("screen");
    expect(output).toContain("trace:");
  });
});

describe("fluent DSL automatic errors", () => {
  it("throws while authoring invalid nodes without a separate validate() call", () => {
    configureKatalix({ validationMode: "strict" });
    expect(() => Screen("Home", (s) => s.text(""))).toThrow();
  });

  it("exposes validation on the tree after toTree in report mode", () => {
    const home = Screen("Home", (s) =>
      s.stack({ gap: 8 }, (stack) => stack.text("Hi")),
    );
    const tree = home.toTree({ mode: "report", throwOnError: false });
    expect(tree.validation.valid).toBe(true);
    expect(tree.root.meta?.diagnostics ?? []).toHaveLength(0);
  });
});
