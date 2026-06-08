import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createNode } from "@katalix/core";
import { Screen } from "@katalix/dsl";
import { setAnimatedDriver, type AnimatedDriver } from "./animated-driver.js";
import { setAnimatedHostComponents } from "./animated-host.js";
import { RenderNodeNative, setRNComponents } from "./render-node-native.js";
import { KatalixRegistryContext } from "./registry-context.js";
import { defaultTokenRegistry } from "@katalix/tokens";

const createMockDriver = (): AnimatedDriver => {
  class Value {
    _value: number;
    constructor(initial: number) {
      this._value = initial;
    }
  }

  return {
    Value,
    timing: (value, config) => ({
      start: (onComplete) => {
        setTimeout(() => {
          value._value = config.toValue;
          onComplete?.();
        }, (config.delay ?? 0) + config.duration);
      },
    }),
    parallel: (timings) => ({
      start: (onComplete) => {
        let remaining = timings.length;
        if (remaining === 0) {
          onComplete?.();
          return;
        }
        timings.forEach((timing) =>
          timing.start(() => {
            remaining -= 1;
            if (remaining === 0) {
              onComplete?.();
            }
          }),
        );
      },
    }),
  };
};

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
  <button
    data-testid={testID as string}
    data-pressable-style={style ? JSON.stringify(style) : undefined}
  >
    {children as React.ReactNode}
  </button>
);

const MockAnimatedView: React.FC<Record<string, unknown>> = ({ children, testID, style }) => (
  <div
    data-testid={testID as string}
    data-animated-host="view"
    data-style={style ? JSON.stringify(style) : undefined}
  >
    {children as React.ReactNode}
  </div>
);

const MockAnimatedText: React.FC<Record<string, unknown>> = ({ children, testID, style }) => (
  <span
    data-testid={testID as string}
    data-animated-host="text"
    data-style={style ? JSON.stringify(style) : undefined}
  >
    {children as React.ReactNode}
  </span>
);

const MockAnimatedScrollView: React.FC<Record<string, unknown>> = ({
  children,
  testID,
  contentContainerStyle,
}) => (
  <div
    data-testid={testID as string}
    data-animated-host="scroll"
    data-content-style={
      contentContainerStyle ? JSON.stringify(contentContainerStyle) : undefined
    }
  >
    {children as React.ReactNode}
  </div>
);

const renderNode = (node: ReturnType<typeof createNode>) =>
  renderToStaticMarkup(
    <KatalixRegistryContext.Provider value={defaultTokenRegistry}>
      <RenderNodeNative node={node} />
    </KatalixRegistryContext.Provider>,
  );

const setupAnimatedHosts = () => {
  setAnimatedDriver(createMockDriver());
  setAnimatedHostComponents({
    View: MockAnimatedView as never,
    Text: MockAnimatedText as never,
    ScrollView: MockAnimatedScrollView as never,
  });
};

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

describe("animated motion integration (GAP-RN-009/010)", () => {
  it("selects Animated.View host for animated box", () => {
    setupAnimatedHosts();
    const node = createNode("box", {
      id: "motion-fade",
      props: {},
      animation: { preset: "fade-in", trigger: "mount" },
      children: [],
    });
    const html = renderNode(node);
    expect(html).toContain("data-animated-host=\"view\"");
    expect(html).toContain("katalix-box");
    expect(html).toContain("opacity");
    expect(html).toContain("_value");
  });

  it("renders slide-up transform motion without error", () => {
    setupAnimatedHosts();
    const node = createNode("box", {
      id: "motion-slide",
      props: {},
      animation: { preset: "slide-up", trigger: "mount" },
      children: [],
    });
    expect(() => renderNode(node)).not.toThrow();
    const html = renderNode(node);
    expect(html).toContain("translateY");
    expect(html).toContain("data-animated-host=\"view\"");
  });

  it("uses Animated.ScrollView for scrollable animated screen", () => {
    setupAnimatedHosts();
    const tree = Screen("Home", (s) => s.animate("fade-in").text("Hello")).toTree();
    const html = renderNode(tree.root);
    expect(html).toContain("data-animated-host=\"scroll\"");
    expect(html).toContain("katalix-screen-");
    expect(html).toContain("_value");
  });

  it("uses Animated.View chrome inside Pressable for animated button", () => {
    setupAnimatedHosts();
    const node = createNode("button", {
      props: { label: "Tap" },
      animation: { preset: "fade-in", trigger: "mount" },
      children: [],
    });
    const html = renderNode(node);
    expect(html).toContain("katalix-button-pressable");
    expect(html).toContain("data-animated-host=\"view\"");
    expect(html).toContain("katalix-button");
    expect(html).toContain("data-animated-host=\"text\"");
    expect(html).toContain("Tap");
  });

  it("uses Animated.View and Animated.Text for animated badge", () => {
    setupAnimatedHosts();
    const tree = Screen("Home", (s) =>
      s.badge("NEW", (b) => b.animate("scale-in")),
    ).toTree();
    const badge = tree.root.children?.[0];
    expect(badge?.kind).toBe("badge");
    const html = renderNode(badge!);
    expect(html).toContain("data-animated-host=\"view\"");
    expect(html).toContain("data-animated-host=\"text\"");
    expect(html).toContain("katalix-badge");
    expect(html).toContain("NEW");
    expect(html).toContain("scale");
  });

  it("fallback driver completes fade-in without animated hosts", () => {
    vi.useFakeTimers();
    setAnimatedDriver(null);
    const node = createNode("box", {
      props: {},
      animation: { preset: "fade-in", trigger: "mount" },
      children: [],
    });
    expect(() => renderNode(node)).not.toThrow();
    const html = renderNode(node);
    expect(html).toContain("opacity");
    expect(html).not.toContain("data-animated-host=\"view\"");
  });
});
