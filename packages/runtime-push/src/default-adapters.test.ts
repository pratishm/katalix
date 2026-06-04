import { describe, expect, it } from "vitest";
import { createWebNotificationPushAdapter } from "./default-adapters.js";

describe("resolveDefaultPushAdapter", () => {
  it("creates web notification adapter", async () => {
    const adapter = createWebNotificationPushAdapter();
    expect(typeof adapter.requestPermission).toBe("function");
    expect(typeof adapter.getToken).toBe("function");
    expect(typeof adapter.onMessage).toBe("function");
  });
});
