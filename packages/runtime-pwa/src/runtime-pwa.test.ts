import { describe, expect, it } from "vitest";
import { Web } from "@katalix/web";
import { createPwaRuntime } from "./index.js";

describe("createPwaRuntime", () => {
  it("exposes manifest paths and custom registration", async () => {
    const manifest = Web("site")
      .pwa({ manifestPath: "/manifest.webmanifest", serviceWorker: "/sw.js" })
      .toManifest({ throwOnError: false });

    let registered: string | undefined;
    const runtime = createPwaRuntime(manifest, {
      registerWorker: async (path) => {
        registered = path;
        return null;
      },
    });

    expect(runtime.enabled).toBe(true);
    expect(runtime.manifestPath).toBe("/manifest.webmanifest");
    await runtime.registerServiceWorker();
    expect(registered).toBe("/sw.js");
  });
});
