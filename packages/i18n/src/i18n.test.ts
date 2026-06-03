import { describe, expect, it } from "vitest";
import { I18n } from "./index.js";

describe("I18n manifest", () => {
  it("builds locales with default locale validation", () => {
    const manifest = I18n("app")
      .locale("en", (l) => l.string("home.title", "Home"))
      .locale("ar", (l) => l.string("home.title", "الرئيسية"), true)
      .toManifest();

    expect(manifest.validation.valid).toBe(true);
    expect(manifest.locales).toHaveLength(2);
    expect(manifest.locales[1]?.rtl).toBe(true);
  });
});
