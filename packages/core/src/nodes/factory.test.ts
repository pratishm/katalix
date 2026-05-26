import { afterEach, describe, expect, it } from "vitest";
import {
  assignPaths,
  configureLattix,
  createNode,
  createTree,
  normalizeAction,
  printTree,
  resetLattixConfig,
  validateTree,
} from "../index.js";

afterEach(() => {
  resetLattixConfig();
});

describe("createNode", () => {
  it("creates a normalized semantic node without chain state", () => {
    const node = createNode("text", {
      props: { content: "Hello" },
      id: "greeting",
      debugLabel: "Greeting text",
    });

    expect(node.kind).toBe("text");
    expect(node.props.content).toBe("Hello");
    expect(node.id).toBe("greeting");
    expect("chain" in node).toBe(false);
  });

  it("creates a screen tree with children and built-in validation", () => {
    const tree = createTree(
      createNode("screen", {
        id: "home",
        children: [
          createNode("stack", {
            children: [
              createNode("text", { props: { content: "Welcome" } }),
              createNode("button", {
                props: { label: "Continue", onPress: normalizeAction("continue") },
              }),
            ],
          }),
        ],
      }),
    );

    expect(tree.version).toBe(1);
    expect(tree.validation.valid).toBe(true);
    expect(tree.root.kind).toBe("screen");
    expect(tree.root.children?.[0]?.kind).toBe("stack");
  });

  it("throws by default when the tree is invalid", () => {
    configureLattix({ validationMode: "strict", throwOnValidationError: true });
    expect(() =>
      createTree(
        createNode("screen", {
          children: [createNode("text", { props: {} })],
        }),
      ),
    ).toThrow();
  });

  it("attaches per-node diagnostics on invalid trees in report mode", () => {
    configureLattix({ validationMode: "report", throwOnValidationError: false });
    const tree = createTree(
      createNode("screen", {
        children: [createNode("text", { props: {} })],
      }),
    );

    expect(tree.validation.valid).toBe(false);
    const text = tree.root.children?.[0];
    expect(text?.meta?.diagnostics?.length).toBeGreaterThan(0);
    expect(text?.meta?.diagnostics?.[0]?.code).toBe("LATTIX_TEXT_MISSING_CONTENT");
  });
});

describe("assignPaths", () => {
  it("assigns dot-separated semantic paths", () => {
    const root = assignPaths(
      createNode("screen", {
        children: [createNode("text", { props: { content: "Hi" } })],
      }),
    );

    expect(root.meta?.path).toBe("screen");
    expect(root.children?.[0]?.meta?.path).toBe("screen/text[0]");
  });
});

describe("validateTree", () => {
  it("returns diagnostics for invalid text nodes", () => {
    const root = createNode("screen", {
      children: [createNode("text", { props: {} })],
    });

    const result = validateTree(root);
    expect(result.valid).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("LATTIX_TEXT_MISSING_CONTENT");
  });

  it("passes a valid screen tree", () => {
    const root = createNode("screen", {
      children: [
        createNode("stack", {
          children: [createNode("text", { props: { content: "OK" } })],
        }),
      ],
    });

    const result = validateTree(root);
    expect(result.valid).toBe(true);
  });

  it("returns diagnostics for unsupported animation configs", () => {
    const root = createNode("screen", {
      children: [
        createNode("text", {
          props: { content: "Animated" },
          animation: {
            preset: "spin" as "fade-in",
            trigger: "scroll" as "mount",
            duration: -100,
          },
        }),
      ],
    });

    const result = validateTree(root);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toEqual(
      expect.arrayContaining([
        "LATTIX_INVALID_ANIMATION_PRESET",
        "LATTIX_INVALID_ANIMATION_TRIGGER",
        "LATTIX_INVALID_ANIMATION_DURATION",
      ]),
    );
  });
});

describe("printTree / toTree", () => {
  it("prints a readable tree", () => {
    configureLattix({ validationMode: "report", throwOnValidationError: false });
    const tree = createTree(
      createNode("screen", {
        children: [createNode("text", { props: { content: "Hi" } })],
      }),
    );

    const output = printTree(tree);
    expect(output).toContain("screen");
    expect(output).toContain("text");
  });
});

describe("normalizeAction", () => {
  it("wraps string ids as action objects", () => {
    expect(normalizeAction("submit")).toEqual({ id: "submit" });
  });
});
