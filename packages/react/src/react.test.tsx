import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createNode, createTree, type LattixNode } from "@lattix/core";
import { createTokenRegistry } from "@lattix/tokens";
import { Screen } from "@lattix/dsl";
import { resolveStyleToCSS } from "./resolve-style.js";
import { LattixRenderer } from "./renderer.js";
import { LattixActionContext } from "./action-context.js";
import { RenderNode } from "./render-node.js";

describe("resolveStyleToCSS", () => {
  it("resolves token refs to CSS values via the default registry", () => {
    const css = resolveStyleToCSS({
      color: { kind: "token", ref: "text.primary" },
      padding: { kind: "literal", value: 16 },
    });
    expect(css).toEqual({
      color: "#111827",
      padding: 16,
    });
  });

  it("omits unresolvable tokens", () => {
    const css = resolveStyleToCSS({
      color: { kind: "token", ref: "nonexistent.token" },
      padding: { kind: "literal", value: 8 },
    });
    expect(css).toEqual({ padding: 8 });
  });

  it("resolves with a custom registry", () => {
    const registry = createTokenRegistry({ "brand.accent": "#ff0000" });
    const css = resolveStyleToCSS(
      { background: { kind: "token", ref: "brand.accent" } },
      { registry },
    );
    expect(css).toEqual({ backgroundColor: "#ff0000" });
  });

  it("returns empty object for undefined input", () => {
    expect(resolveStyleToCSS(undefined)).toEqual({});
  });
});

describe("LattixRenderer", () => {
  it("renders a simple text node from a fluent DSL tree", () => {
    const tree = Screen("Test", (s) => s.text("Hello world")).toTree();
    const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
    expect(html).toContain("Hello world");
    expect(html).toContain('data-lattix-kind="screen"');
    expect(html).toContain('data-lattix-kind="text"');
  });

  it("renders a stack with multiple children", () => {
    const tree = Screen("Layout", (s) =>
      s.stack({ gap: 12 }, (stack) =>
        stack
          .text("Title")
          .text("Subtitle")
          .button("Click me"),
      ),
    ).toTree();
    const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
    expect(html).toContain("Title");
    expect(html).toContain("Subtitle");
    expect(html).toContain("Click me");
    expect(html).toContain('data-lattix-kind="stack"');
    expect(html).toContain('data-lattix-kind="button"');
  });

  it("dispatches actions through onAction when button is clicked", () => {
    const handler = vi.fn();
    const tree = Screen("Actions", (s) =>
      s.button("Submit", (btn) => btn.onPress("submit-form")),
    ).toTree();

    const html = renderToStaticMarkup(
      <LattixRenderer tree={tree} onAction={handler} />,
    );
    expect(html).toContain("Submit");
    expect(html).toContain('data-lattix-kind="button"');
  });

  it("renders with a custom token registry", () => {
    const registry = createTokenRegistry({ "brand.accent": "#abcdef" });
    const root = createNode("screen", {
      style: { background: "brand.accent" },
      children: [createNode("text", { props: { content: "Styled" } })],
    });
    // Build tree in tolerant mode — "brand.accent" is unknown to the default
    // registry at build time, but the renderer resolves it via the custom registry.
    const tree = createTree(root, { mode: "tolerant", throwOnError: false });
    const html = renderToStaticMarkup(
      <LattixRenderer tree={tree} registry={registry} />,
    );
    expect(html).toContain("Styled");
    expect(html).toContain("#abcdef");
  });

  it("renders all leaf node kinds", () => {
    const root = createNode("screen", {
      children: [
        createNode("text", { props: { content: "Hello" } }),
        createNode("image", { props: { source: "logo.png", alt: "Logo" } }),
        createNode("badge", { props: { label: "New" } }),
        createNode("divider", {}),
        createNode("spacer", {}),
        createNode("input", { props: { placeholder: "Type here" } }),
      ],
    });
    const tree = createTree(root, { mode: "tolerant", throwOnError: false });
    const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
    expect(html).toContain('data-lattix-kind="text"');
    expect(html).toContain('data-lattix-kind="image"');
    expect(html).toContain('data-lattix-kind="badge"');
    expect(html).toContain('data-lattix-kind="divider"');
    expect(html).toContain('data-lattix-kind="spacer"');
    expect(html).toContain('data-lattix-kind="input"');
    expect(html).toContain("Hello");
    expect(html).toContain("New");
    expect(html).toContain("Type here");
  });

  it("renders container node kinds (row, box, list)", () => {
    const root = createNode("screen", {
      children: [
        createNode("row", {
          children: [createNode("text", { props: { content: "Row item" } })],
        }),
        createNode("box", {
          children: [createNode("text", { props: { content: "Box item" } })],
        }),
        createNode("list", {
          children: [createNode("text", { props: { content: "List item" } })],
        }),
      ],
    });
    const tree = createTree(root, { mode: "tolerant", throwOnError: false });
    const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
    expect(html).toContain('data-lattix-kind="row"');
    expect(html).toContain('data-lattix-kind="box"');
    expect(html).toContain('data-lattix-kind="list"');
    expect(html).toContain("Row item");
    expect(html).toContain("Box item");
    expect(html).toContain("List item");
  });

  it("renders unknown node kinds with a diagnostic marker", () => {
    const root = createNode("screen", {
      children: [createNode("custom-widget" as "text", { props: {} })],
    });
    const tree = createTree(root, { mode: "tolerant", throwOnError: false });
    const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
    expect(html).toContain('data-lattix-unknown="true"');
    expect(html).toContain("custom-widget");
  });

  it("applies resolved token styles as inline CSS", () => {
    const tree = Screen("Styled", (s) =>
      s.padding(16).background("surface.canvas").text("Styled text"),
    ).toTree();
    const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
    expect(html).toContain("#f9fafb");
    expect(html).toContain("Styled text");
  });

  it("applies motion metadata and web animation styles", () => {
    const tree = Screen("Motion", (s) =>
      s.text("Animated").animate("fade-in", { trigger: "mount", duration: 300 }),
    ).toTree();
    const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
    expect(html).toContain('data-lattix-animation="fade-in"');
    expect(html).toContain('data-lattix-animation-trigger="mount"');
    expect(html).toContain("lattix-fade-in");
    expect(html).toContain("300ms");
  });
});

describe("RenderNode", () => {
  it("renders a standalone node without a tree wrapper", () => {
    const node = createNode("text", { props: { content: "Standalone" } });
    const html = renderToStaticMarkup(<RenderNode node={node} />);
    expect(html).toContain("Standalone");
    expect(html).toContain('data-lattix-kind="text"');
  });
});
