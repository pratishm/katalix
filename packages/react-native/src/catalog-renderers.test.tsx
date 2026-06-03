import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createNode } from "@katalix/core";
import { defaultTokenRegistry } from "@katalix/tokens";
import { createCatalogRenderers } from "./catalog-renderers.js";
import { KatalixRegistryContext } from "./registry-context.js";

const MockView: React.FC<Record<string, unknown>> = ({ children, testID, style }) => (
  <div data-testid={testID as string} data-style={style ? JSON.stringify(style) : undefined}>
    {children as React.ReactNode}
  </div>
);

const MockText: React.FC<Record<string, unknown>> = ({ children }) => (
  <span>{children as React.ReactNode}</span>
);

const MockPressable: React.FC<Record<string, unknown>> = ({
  children,
  testID,
  onPress,
}) => (
  <button type="button" data-testid={testID as string} onClick={onPress as () => void}>
    {children as React.ReactNode}
  </button>
);

const MockScrollView: React.FC<Record<string, unknown>> = ({ children, testID }) => (
  <div data-testid={testID as string}>{children as React.ReactNode}</div>
);

const getRN = () => ({
  View: MockView,
  Text: MockText,
  Pressable: MockPressable,
  ScrollView: MockScrollView,
});

describe("native catalog renderers", () => {
  const renderers = createCatalogRenderers(getRN, {
    useNodeStyle: () => ({}),
    RenderChildren: () => null,
    RenderNodeNative: () => null,
    useActionHandler: () => undefined,
    useValueChangeHandler: () => undefined,
  });

  it("renders interactive select options", () => {
    const Select = renderers.select!;
    const node = createNode("select", {
      props: { label: "Color", options: ["red", "blue"], value: "red" },
      children: [],
    });
    const html = renderToStaticMarkup(<Select node={node} />);
    expect(html).toContain("katalix-select-option-red");
    expect(html).toContain("✓ red");
  });

  it("renders fab", () => {
    const Fab = renderers.fab!;
    const node = createNode("fab", { props: { label: "+" }, children: [] });
    const html = renderToStaticMarkup(
      <KatalixRegistryContext.Provider value={defaultTokenRegistry}>
        <Fab node={node} />
      </KatalixRegistryContext.Provider>,
    );
    expect(html).toContain("katalix-fab");
    expect(html).toContain("+");
  });

  it("renders webview fallback link when source is set", () => {
    const WebView = renderers.webview!;
    const node = createNode("webview", {
      props: { source: "https://example.com" },
      children: [],
    });
    const html = renderToStaticMarkup(<WebView node={node} />);
    expect(html).toContain("katalix-webview-fallback");
    expect(html).toContain("https://example.com");
  });
});
