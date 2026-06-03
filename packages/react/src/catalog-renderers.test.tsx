import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { createNode } from "@katalix/core";
import { KatalixActionContext } from "./action-context.js";
import { KatalixRegistryContext } from "./registry-context.js";
import { RenderNode } from "./render-node.js";

const renderKind = (
  kind: string,
  props: Record<string, unknown> = {},
  onAction?: (action: { id: string; payload?: Record<string, unknown> }) => void,
) => {
  const node = createNode(kind as "text", { props, children: [] });
  return renderToStaticMarkup(
    <KatalixRegistryContext.Provider value={{}}>
      <KatalixActionContext.Provider value={onAction ?? (() => undefined)}>
        <RenderNode node={node} />
      </KatalixActionContext.Provider>
    </KatalixRegistryContext.Provider>,
  );
};

describe("web catalog renderers", () => {
  it("sanitizes richText html by default", () => {
    const html = renderKind("richText", {
      content: '<b>ok</b><script>x</script>',
    });
    expect(html).toContain("data-katalix-format");
    expect(html).not.toContain("<script>");
    expect(html).toContain("ok");
  });

  it("renders plain richText without innerHTML", () => {
    const html = renderKind("richText", { content: "Hello world", format: "plain" });
    expect(html).toContain("Hello world");
    expect(html).not.toContain("dangerouslySetInnerHTML");
  });

  it("rejects invalid webview URLs", () => {
    const html = renderKind("webview", { source: "javascript:alert(1)" });
    expect(html).toContain("invalid-url");
    expect(html).not.toContain("<iframe");
  });

  it("sandboxes allowed webview iframes", () => {
    const html = renderKind("webview", { source: "https://example.com" });
    expect(html).toContain('sandbox="');
    expect(html).toContain("https://example.com");
  });

  it("dispatches select onChange with value payload", () => {
    const handler = vi.fn();
    const html = renderKind(
      "select",
      { label: "Pick", options: ["a", "b"], onChange: "select.changed" },
      handler,
    );
    expect(html).toContain('data-katalix-kind="select"');
    expect(html).toContain("<select");
  });

  it("uses token-backed fab colors", () => {
    const html = renderKind("fab", { label: "Add" });
    expect(html).toContain('data-katalix-kind="fab"');
    expect(html).toContain("#2563eb");
  });
});
