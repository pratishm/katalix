import { describe, expect, it } from "vitest";
import { isAllowedWebViewUrl } from "./webview-url.js";

describe("isAllowedWebViewUrl", () => {
  it("allows http and https", () => {
    expect(isAllowedWebViewUrl("https://example.com/page")).toBe(true);
    expect(isAllowedWebViewUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects javascript and file URLs", () => {
    expect(isAllowedWebViewUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedWebViewUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedWebViewUrl("not-a-url")).toBe(false);
  });
});
