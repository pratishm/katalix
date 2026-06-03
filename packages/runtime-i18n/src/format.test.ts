import { describe, expect, it } from "vitest";
import type { KatalixLocaleManifest } from "@katalix/i18n";
import { formatPlural, selectPluralCategory } from "./format.js";

describe("selectPluralCategory", () => {
  it("uses Intl.PluralRules for English", () => {
    expect(selectPluralCategory("en", 1)).toBe("one");
    expect(selectPluralCategory("en", 2)).toBe("other");
  });
});

describe("formatPlural", () => {
  it("picks the correct plural form", () => {
    const entry: KatalixLocaleManifest = {
      locale: "en",
      strings: {},
      plurals: {
        items: { one: "{count} item", other: "{count} items" },
      },
    };
    expect(formatPlural("en", entry, "items", 1)).toBe("1 item");
    expect(formatPlural("en", entry, "items", 4)).toBe("4 items");
  });
});
