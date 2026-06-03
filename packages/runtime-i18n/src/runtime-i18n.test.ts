import { describe, expect, it } from "vitest";
import { I18n } from "@katalix/i18n";
import { createI18nRuntime } from "./index.js";

describe("createI18nRuntime", () => {
  it("translates keys and switches locale", () => {
    const manifest = I18n("app")
      .locale("en", (l) => l.string("greet", "Hello"))
      .locale("ar", (l) => l.string("greet", "مرحبا"), true)
      .toManifest();

    const runtime = createI18nRuntime(manifest);
    expect(runtime.t("greet")).toBe("Hello");
    runtime.setLocale("ar");
    expect(runtime.t("greet")).toBe("مرحبا");
    expect(runtime.isRtl).toBe(true);
  });
});
