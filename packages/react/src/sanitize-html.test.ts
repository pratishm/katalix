import { describe, expect, it } from "vitest";
import { containsHtmlMarkup, sanitizeHtml } from "./sanitize-html.js";

describe("sanitizeHtml", () => {
  it("removes script tags and event handlers", () => {
    const raw = '<p onclick="alert(1)">Hi</p><script>evil()</script>';
    expect(sanitizeHtml(raw)).toBe("<p>Hi</p>");
  });

  it("blocks javascript: URLs", () => {
    const raw = '<a href="javascript:alert(1)">x</a>';
    expect(sanitizeHtml(raw)).not.toContain("javascript:");
  });
});

describe("containsHtmlMarkup", () => {
  it("detects tags vs plain text", () => {
    expect(containsHtmlMarkup("plain")).toBe(false);
    expect(containsHtmlMarkup("<b>bold</b>")).toBe(true);
  });
});
