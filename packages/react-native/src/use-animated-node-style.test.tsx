import { describe, expect, it, beforeAll } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Screen } from "@katalix/dsl";
import { defaultTokenRegistry } from "@katalix/tokens";
import { KatalixNativeRenderer } from "./renderer-native.js";
import { setRNComponents } from "./render-node-native.js";

const MockView: React.FC<Record<string, unknown>> = ({ children, testID }) => (
  <div data-testid={testID as string}>{children as React.ReactNode}</div>
);

const MockText: React.FC<Record<string, unknown>> = ({ children, testID }) => (
  <span data-testid={testID as string}>{children as React.ReactNode}</span>
);

beforeAll(() => {
  setRNComponents({
    View: MockView as never,
    Text: MockText as never,
    Image: (() => null) as never,
    TextInput: (() => null) as never,
    Pressable: (() => null) as never,
    ScrollView: MockView as never,
  });
});

describe("useAnimatedNodeStyle (GAP-RN-014)", () => {
  it("renders 50+ static nodes without error", () => {
    const tree = Screen("Stress", (s) => {
      let b = s;
      for (let i = 0; i < 50; i++) {
        b = b.text(`Line ${i}`);
      }
      return b;
    }).toTree();

    expect(() =>
      renderToStaticMarkup(
        <KatalixNativeRenderer tree={tree} registry={defaultTokenRegistry} />,
      ),
    ).not.toThrow();

    const html = renderToStaticMarkup(
      <KatalixNativeRenderer tree={tree} registry={defaultTokenRegistry} />,
    );
    expect(html.match(/katalix-text/g)?.length).toBe(50);
  });
});
