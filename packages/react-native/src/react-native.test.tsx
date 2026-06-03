import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createNode, createTree, type KatalixNode } from "@katalix/core";
import { createTokenRegistry } from "@katalix/tokens";
import { Screen } from "@katalix/dsl";
import { resolveStyleToNative } from "./resolve-style-native.js";
import { KatalixNativeRenderer } from "./renderer-native.js";
import { RenderNodeNative, setRNComponents } from "./render-node-native.js";

/**
 * Mock React Native components for testing.
 * Maps RN primitives to HTML elements so we can use renderToStaticMarkup.
 */
const MockView: React.FC<Record<string, unknown>> = ({ children, testID, style, ...rest }) => (
  <div data-testid={testID as string} data-style={style ? JSON.stringify(style) : undefined} {...rest}>
    {children as React.ReactNode}
  </div>
);

const MockText: React.FC<Record<string, unknown>> = ({ children, testID, style }) => (
  <span data-testid={testID as string} data-style={style ? JSON.stringify(style) : undefined}>
    {children as React.ReactNode}
  </span>
);

const MockImage: React.FC<Record<string, unknown>> = ({ testID, source, accessibilityLabel, style }) => (
  <img
    data-testid={testID as string}
    src={(source as { uri: string })?.uri}
    alt={accessibilityLabel as string}
    data-style={style ? JSON.stringify(style) : undefined}
  />
);

const MockTextInput: React.FC<Record<string, unknown>> = ({ testID, placeholder, style }) => (
  <input data-testid={testID as string} placeholder={placeholder as string} data-style={style ? JSON.stringify(style) : undefined} />
);

const MockPressable: React.FC<Record<string, unknown>> = ({ children, testID, onPress, style }) => (
  <button data-testid={testID as string} onClick={onPress as (() => void) | undefined} data-style={style ? JSON.stringify(style) : undefined}>
    {children as React.ReactNode}
  </button>
);

const MockScrollView: React.FC<Record<string, unknown>> = ({ children, testID, contentContainerStyle }) => (
  <div data-testid={testID as string} data-content-style={contentContainerStyle ? JSON.stringify(contentContainerStyle) : undefined}>
    {children as React.ReactNode}
  </div>
);

beforeAll(() => {
  setRNComponents({
    View: MockView as never,
    Text: MockText as never,
    Image: MockImage as never,
    TextInput: MockTextInput as never,
    Pressable: MockPressable as never,
    ScrollView: MockScrollView as never,
  });
});

describe("resolveStyleToNative", () => {
  it("resolves token refs to native style values", () => {
    const style = resolveStyleToNative({
      color: { kind: "token", ref: "text.primary" },
      padding: { kind: "literal", value: 16 },
    });
    expect(style).toEqual({
      color: "#111827",
      padding: 16,
    });
  });

  it("omits unresolvable tokens", () => {
    const style = resolveStyleToNative({
      color: { kind: "token", ref: "nonexistent.token" },
      padding: { kind: "literal", value: 8 },
    });
    expect(style).toEqual({ padding: 8 });
  });

  it("resolves with a custom registry", () => {
    const registry = createTokenRegistry({ "brand.accent": "#ff0000" });
    const style = resolveStyleToNative(
      { background: { kind: "token", ref: "brand.accent" } },
      { registry },
    );
    expect(style).toEqual({ backgroundColor: "#ff0000" });
  });

  it("returns empty object for undefined input", () => {
    expect(resolveStyleToNative(undefined)).toEqual({});
  });

  it("maps semantic property names to RN property names", () => {
    const style = resolveStyleToNative({
      background: { kind: "literal", value: "#fff" },
      fontSize: { kind: "literal", value: 18 },
      fontWeight: { kind: "literal", value: "bold" },
    });
    expect(style).toEqual({
      backgroundColor: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    });
  });

  it("expands shadow tokens to RN elevation props (GAP-RN-003)", () => {
    const style = resolveStyleToNative({
      shadow: { kind: "token", ref: "elevation.sm" },
    });
    expect(style).toMatchObject({
      shadowRadius: 2,
      elevation: 2,
      shadowOpacity: 0.05,
    });
    expect(style).not.toHaveProperty("shadow");
  });

  it("expands numeric shadow presets", () => {
    const style = resolveStyleToNative({
      shadow: { kind: "literal", value: 2 },
    });
    expect(style).toMatchObject({
      shadowRadius: 6,
      elevation: 4,
    });
  });
});

describe("KatalixNativeRenderer", () => {
  it("renders a simple text node from a fluent DSL tree", () => {
    const tree = Screen("Test", (s) => s.text("Hello world")).toTree();
    const html = renderToStaticMarkup(<KatalixNativeRenderer tree={tree} />);
    expect(html).toContain("Hello world");
    expect(html).toContain("katalix-screen");
    expect(html).toContain("katalix-text");
    expect(html).not.toContain("&quot;opacity&quot;:0");
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
    const html = renderToStaticMarkup(<KatalixNativeRenderer tree={tree} />);
    expect(html).toContain("Title");
    expect(html).toContain("Subtitle");
    expect(html).toContain("Click me");
    expect(html).toContain("katalix-stack");
    expect(html).toContain("katalix-button");
  });

  it("dispatches actions through onAction when button is pressed", () => {
    const handler = vi.fn();
    const tree = Screen("Actions", (s) =>
      s.button("Submit", (btn) => btn.onPress("submit-form")),
    ).toTree();

    const html = renderToStaticMarkup(
      <KatalixNativeRenderer tree={tree} onAction={handler} />,
    );
    expect(html).toContain("Submit");
    expect(html).toContain("katalix-button");
  });

  it("renders with a custom token registry", () => {
    const registry = createTokenRegistry({ "brand.accent": "#abcdef" });
    const root = createNode("screen", {
      style: { background: "brand.accent" },
      children: [createNode("text", { props: { content: "Styled" } })],
    });
    const tree = createTree(root, { mode: "tolerant", throwOnError: false });
    const html = renderToStaticMarkup(
      <KatalixNativeRenderer tree={tree} registry={registry} />,
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
    const html = renderToStaticMarkup(<KatalixNativeRenderer tree={tree} />);
    expect(html).toContain("katalix-text");
    expect(html).toContain("katalix-image");
    expect(html).toContain("katalix-badge");
    expect(html).toContain("katalix-divider");
    expect(html).toContain("katalix-spacer");
    expect(html).toContain("katalix-input");
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
    const html = renderToStaticMarkup(<KatalixNativeRenderer tree={tree} />);
    expect(html).toContain("katalix-row");
    expect(html).toContain("katalix-box");
    expect(html).toContain("katalix-list");
    expect(html).toContain("Row item");
    expect(html).toContain("Box item");
    expect(html).toContain("List item");
  });

  it("renders unknown node kinds with a diagnostic marker", () => {
    const root = createNode("screen", {
      children: [createNode("custom-widget" as "text", { props: {} })],
    });
    const tree = createTree(root, { mode: "tolerant", throwOnError: false });
    const html = renderToStaticMarkup(<KatalixNativeRenderer tree={tree} />);
    expect(html).toContain("katalix-unknown-custom-widget");
    expect(html).toContain("custom-widget");
  });

  it("applies resolved token styles as inline native styles", () => {
    const tree = Screen("Styled", (s) =>
      s.padding(16).background("surface.canvas").text("Styled text"),
    ).toTree();
    const html = renderToStaticMarkup(<KatalixNativeRenderer tree={tree} />);
    expect(html).toContain("#f9fafb");
    expect(html).toContain("Styled text");
  });

  it("applies native motion metadata and initial style", () => {
    const tree = Screen("Motion", (s) =>
      s.text("Animated").animate("fade-in", { trigger: "mount", duration: 300 }),
    ).toTree();
    const html = renderToStaticMarkup(<KatalixNativeRenderer tree={tree} />);
    expect(html).toContain("&quot;opacity&quot;:0");
  });
});

describe("RenderNodeNative", () => {
  it("renders a standalone node without a tree wrapper", () => {
    const node = createNode("text", { props: { content: "Standalone" } });
    const html = renderToStaticMarkup(<RenderNodeNative node={node} />);
    expect(html).toContain("Standalone");
    expect(html).toContain("katalix-text");
  });
});
