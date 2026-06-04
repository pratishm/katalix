import { describe, expect, it } from "vitest";
import { Navigation } from "@katalix/navigation";
import { createDeepLinkRuntime } from "./deep-link.js";
import { attachDeepLinkListener } from "./linking-bridge.js";

describe("attachDeepLinkListener", () => {
  it("emits initial and subsequent URLs", async () => {
    const manifest = Navigation("app")
      .routes((routes) =>
        routes.screen("article", "Article", (route) =>
          route.deepLink("app://articles/:id"),
        ),
      )
      .toManifest({ throwOnError: false });

    const runtime = createDeepLinkRuntime(manifest);
    const matches: string[] = [];
    runtime.subscribe((match) => matches.push(match.routeId));

    const handlers: Array<(event: { url: string }) => void> = [];
    const linking = {
      getInitialURL: async () => "app://articles/42",
      addEventListener: (_event: "url", handler: (event: { url: string }) => void) => {
        handlers.push(handler);
        return { remove: () => undefined };
      },
    };

    attachDeepLinkListener(runtime, linking);
    await Promise.resolve();
    expect(matches).toEqual(["article"]);

    handlers[0]?.({ url: "app://articles/99" });
    expect(matches).toEqual(["article", "article"]);
  });
});
