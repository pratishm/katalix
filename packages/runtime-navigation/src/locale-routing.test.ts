import { describe, expect, it } from "vitest";
import { createLocaleRoutingRuntime } from "./locale-routing.js";

describe("createLocaleRoutingRuntime", () => {
  it("strips and adds locale path prefixes", () => {
    const runtime = createLocaleRoutingRuntime({
      locales: ["en", "fr"],
      defaultLocale: "en",
    });

    expect(runtime.stripLocale("/fr/products/1")).toEqual({
      locale: "fr",
      pathname: "/products/1",
    });
    expect(runtime.localizePath("/products/1", "fr")).toBe("/fr/products/1");
    expect(runtime.localizePath("/products/1", "en")).toBe("/products/1");
  });
});
