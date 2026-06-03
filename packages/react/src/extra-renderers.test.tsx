import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { createNode, createTree } from "@katalix/core";
import { RenderNode } from "./render-node.js";
import { KatalixHostRegistryContextProvider } from "./host-registry-context.js";
import { KatalixRegistryContext } from "./registry-context.js";

const renderNode = (kind: string, props: Record<string, unknown> = {}) => {
  const node = createNode(kind as "text", { props, children: [] });
  return renderToStaticMarkup(
    <KatalixRegistryContext.Provider value={{}}>
      <RenderNode node={node} />
    </KatalixRegistryContext.Provider>,
  );
};

describe("web extra renderers", () => {
  it("renders modal overlay", () => {
    const html = renderNode("modal", { visible: true });
    expect(html).toContain('data-katalix-kind="modal"');
    expect(html).toContain('role="dialog"');
  });

  it("renders scroll and flatList layout nodes", () => {
    const scroll = renderNode("scroll", { horizontal: true });
    expect(scroll).toContain('data-katalix-kind="scroll"');

    const flatList = renderNode("flatList");
    expect(flatList).toContain('data-katalix-kind="flatList"');
    expect(flatList).toContain('role="list"');
  });

  it("renders host and errorBoundary nodes", () => {
    const Host: React.FC<{ node: { props: Record<string, unknown> } }> = ({ node }) => (
      <div data-host-id={String(node.props.componentId)} />
    );
    const hostNode = createNode("host" as "text", {
      props: { componentId: "Chart" },
      children: [],
    });
    const hostHtml = renderToStaticMarkup(
      <KatalixRegistryContext.Provider value={{}}>
        <KatalixHostRegistryContextProvider value={{ Chart: Host as never }}>
          <RenderNode node={hostNode} />
        </KatalixHostRegistryContextProvider>
      </KatalixRegistryContext.Provider>,
    );
    expect(hostHtml).toContain('data-host-id="Chart"');

    const boundary = renderNode("errorBoundary", { fallback: "Oops" });
    expect(boundary).toContain('data-katalix-kind="errorBoundary"');
  });

  it("renders toast and skeleton nodes", () => {
    const toast = renderNode("toast", { message: "Saved", variant: "success" });
    expect(toast).toContain('data-katalix-kind="toast"');
    expect(toast).toContain("Saved");

    const skeleton = renderNode("skeleton", { width: 120, height: 20 });
    expect(skeleton).toContain('data-katalix-kind="skeleton"');
  });
});
