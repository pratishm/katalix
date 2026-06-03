import { describe, expect, it } from "vitest";
import { Navigation } from "@katalix/navigation";
import { createDeepLinkRuntime } from "./deep-link.js";

describe("createDeepLinkRuntime", () => {
  it("resolves deep link patterns to route ids", () => {
    const manifest = Navigation("app")
      .routes((routes) =>
        routes
          .screen("home", "Home", (route) => route.path("/"))
          .screen("product", "Product", (route) =>
            route.path("/product/:id").deepLink("myapp://product/:id"),
          ),
      )
      .toManifest({ throwOnError: false });

    const runtime = createDeepLinkRuntime(manifest);
    const match = runtime.resolve("myapp://product/42");
    expect(match?.routeId).toBe("product");
    expect(match?.params.id).toBe("42");
  });
});
