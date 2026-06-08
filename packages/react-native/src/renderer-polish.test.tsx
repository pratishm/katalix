import { describe, expect, it, beforeAll, afterEach, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createNode } from "@katalix/core";
import { Screen } from "@katalix/dsl";
import { defaultTokenRegistry } from "@katalix/tokens";
import { RenderNodeNative, setRNComponents } from "./render-node-native.js";
import { KatalixRegistryContext } from "./registry-context.js";
import { setAnimatedDriver } from "./animated-driver.js";
import { setAnimatedHostComponents } from "./animated-host.js";

const MockView: React.FC<Record<string, unknown>> = ({ children, testID, style }) => (
  <div data-testid={testID as string} data-style={style ? JSON.stringify(style) : undefined}>
    {children as React.ReactNode}
  </div>
);

const MockText: React.FC<Record<string, unknown>> = ({ children, testID, style }) => (
  <span data-testid={testID as string} data-style={style ? JSON.stringify(style) : undefined}>
    {children as React.ReactNode}
  </span>
);

const MockPressable: React.FC<Record<string, unknown>> = ({ children, testID, style }) => (
  <button data-testid={testID as string} data-style={style ? JSON.stringify(style) : undefined}>
    {children as React.ReactNode}
  </button>
);

beforeAll(() => {
  setRNComponents({
    View: MockView as never,
    Text: MockText as never,
    Image: (() => null) as never,
    TextInput: (() => null) as never,
    Pressable: MockPressable as never,
    ScrollView: MockView as never,
  });
});

afterEach(() => {
  setAnimatedDriver(undefined);
  setAnimatedHostComponents(undefined);
  vi.useRealTimers();
});

describe("renderer polish (1.3.1 / 1.4.0)", () => {
  it("GAP-RN-011: styles button label Text with color", () => {
    const node = createNode("button", {
      props: { label: "Go" },
      style: { color: "#EC4899" },
      children: [],
    });
    const html = renderToStaticMarkup(
      <KatalixRegistryContext.Provider value={defaultTokenRegistry}>
        <RenderNodeNative node={node} />
      </KatalixRegistryContext.Provider>,
    );
    expect(html).toContain("#EC4899");
    expect(html).toContain("katalix-button");
  });

  it("GAP-RN-012: badge renders default pill chrome", () => {
    const tree = Screen("Home", (s) => s.badge("TODAY")).toTree();
    const badge = tree.root.children?.[0];
    expect(badge?.kind).toBe("badge");
    const html = renderToStaticMarkup(
      <KatalixRegistryContext.Provider value={defaultTokenRegistry}>
        <RenderNodeNative node={badge!} />
      </KatalixRegistryContext.Provider>,
    );
    expect(html).toContain("katalix-badge");
    expect(html).toContain("#f1f5f9");
    expect(html).toContain("TODAY");
  });

  it("GAP-RN-013: compact button uses alignSelf flex-start", () => {
    const node = createNode("button", {
      props: { label: "‹", compact: true },
      children: [],
    });
    const html = renderToStaticMarkup(
      <KatalixRegistryContext.Provider value={defaultTokenRegistry}>
        <RenderNodeNative node={node} />
      </KatalixRegistryContext.Provider>,
    );
    expect(html).toContain("flex-start");
  });

  it("GAP-RN-009/010: animated box uses setTimeout fallback without driver", () => {
    vi.useFakeTimers();
    setAnimatedDriver(null);
    const node = createNode("box", {
      props: {},
      animation: { preset: "fade-in", trigger: "mount" },
      children: [],
    });
    const html = renderToStaticMarkup(
      <KatalixRegistryContext.Provider value={defaultTokenRegistry}>
        <RenderNodeNative node={node} />
      </KatalixRegistryContext.Provider>,
    );
    expect(html).toContain("katalix-box");
    expect(html).toContain("opacity");
  });
});
