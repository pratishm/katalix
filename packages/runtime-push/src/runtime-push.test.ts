import { describe, expect, it } from "vitest";
import { Native } from "@katalix/native";
import { createPushRuntime } from "./index.js";

describe("createPushRuntime", () => {
  it("detects notification capabilities from native manifest", async () => {
    const manifest = Native("app")
      .target("expo")
      .capability("push-notifications", {
        permission: "notifications",
        expoModule: "expo-notifications",
      })
      .toManifest({ throwOnError: false });

    let tokenRequested = false;
    const runtime = createPushRuntime(manifest, {
      requestPermission: async () => true,
      getToken: async () => {
        tokenRequested = true;
        return "token-1";
      },
      onMessage: () => () => undefined,
    });

    expect(runtime.capabilityIds).toContain("push-notifications");
    expect(await runtime.requestPermission()).toBe(true);
    expect(await runtime.getToken()).toBe("token-1");
    expect(tokenRequested).toBe(true);
  });
});
