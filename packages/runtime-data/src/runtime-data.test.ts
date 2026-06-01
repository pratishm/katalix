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
});
