import { describe, expect, it } from "vitest";
import { createNode, createTree } from "@katalix/core";
import { card, emptyState, section } from "./index.js";

describe("card", () => {
  it("creates a generic card composite without adding a new node kind", () => {
    const node = card({
      title: "Account",
      body: "Review your profile details.",
      action: { label: "Open", onPress: "open-account" },
      animation: { preset: "fade-in", trigger: "mount" },
    });

    expect(node.kind).toBe("box");
    expect(node.children?.map((child) => child.kind)).toEqual(["stack"]);
    const stack = node.children?.[0];
    expect(stack?.children?.map((child) => child.kind)).toEqual([
      "text",
      "text",
      "button",
    ]);
    expect(stack?.children?.[2]?.props.onPress).toEqual({ id: "open-account" });
    expect(node.animation).toEqual({ preset: "fade-in", trigger: "mount" });
  });
});

describe("emptyState", () => {
  it("creates a reusable empty state from primitives", () => {
    const node = emptyState({
      title: "No projects yet",
      description: "Create one to get started.",
      action: { label: "Create project", onPress: "create-project" },
    });

    expect(node.kind).toBe("stack");
    expect(node.children?.map((child) => child.kind)).toEqual([
      "text",
      "text",
      "button",
    ]);
  });
});

describe("section", () => {
  it("wraps supplied primitive children in a generic section stack", () => {
    const content = emptyState({
      title: "Nothing here",
      description: "Try adjusting filters.",
    });
    const tree = createTree(
      createNode("screen", {
        children: [
          section({
            title: "Results",
            children: [content],
          }),
        ],
      }),
      { mode: "report", throwOnError: false },
    );

    expect(tree.root.kind).toBe("screen");
    expect(tree.validation.valid).toBe(true);
    expect(tree.root.children?.[0]?.kind).toBe("stack");
    expect(tree.root.children?.[0]?.children?.[1]?.kind).toBe("stack");
  });
});
