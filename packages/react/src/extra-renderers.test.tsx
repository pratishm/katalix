import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { createNode, createTree } from "@katalix/core";
import { RenderNode } from "./render-node.js";
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

  it("renders toast and skeleton nodes", () => {
    const toast = renderNode("toast", { message: "Saved", variant: "success" });
    expect(toast).toContain('data-katalix-kind="toast"');
    expect(toast).toContain("Saved");

    const skeleton = renderNode("skeleton", { width: 120, height: 20 });
    expect(skeleton).toContain('data-katalix-kind="skeleton"');
  });
});
