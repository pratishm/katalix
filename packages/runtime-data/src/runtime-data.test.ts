import { describe, expect, it } from "vitest";
import { Data } from "@katalix/data";
import { createQueryRuntime, resolveDataUiVariant } from "./index.js";

describe("createQueryRuntime", () => {
  it("loads operations and resolves UI state", async () => {
    const manifest = Data("api")
      .resource("users", (r) =>
        r.query("list", "GET", "/users", (op) => op.state("loading").state("success")),
      )
      .toManifest({ throwOnError: false });

    const runtime = createQueryRuntime(manifest, {
      fetcher: async () => [{ id: 1 }],
    });

    expect(resolveDataUiVariant(runtime, "users.list")).toBe("idle");
    await runtime.refetch("users.list");
    expect(resolveDataUiVariant(runtime, "users.list")).toBe("success");
    expect(runtime.entries["users.list"]?.data).toEqual([{ id: 1 }]);
  });

  it("prefetches all operations and notifies subscribers", async () => {
    const manifest = Data("api")
      .resource("users", (r) => r.query("list", "GET", "/users"))
      .resource("posts", (r) => r.query("list", "GET", "/posts"))
      .toManifest({ throwOnError: false });

    let notifications = 0;
    const runtime = createQueryRuntime(manifest, {
      fetcher: async (url) => ({ url }),
    });
    runtime.subscribe(() => {
      notifications += 1;
    });

    await runtime.prefetchAll();
    expect(runtime.entries["users.list"]?.state).toBe("success");
    expect(runtime.entries["posts.list"]?.state).toBe("success");
    expect(notifications).toBeGreaterThan(0);
  });
});
