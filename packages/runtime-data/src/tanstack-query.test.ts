import { describe, expect, it } from "vitest";
import { Data } from "@katalix/data";
import { createTanStackQueryRuntime, type TanStackQueryClientAdapter } from "./tanstack-query.js";

const createMockClient = (
  fetchImpl: (key: readonly unknown[]) => Promise<unknown>,
): TanStackQueryClientAdapter => {
  const cache = new Map<string, { status: string; data?: unknown; error?: unknown }>();
  const subs = new Map<string, Set<() => void>>();

  const keyStr = (key: readonly unknown[]) => JSON.stringify(key);

  return {
    fetchQuery: async <T>({
      queryKey,
    }: {
      queryKey: readonly unknown[];
      queryFn: () => Promise<T>;
    }) => {
      const k = keyStr(queryKey);
      cache.set(k, { status: "pending" });
      try {
        const data = (await fetchImpl(queryKey)) as T;
        cache.set(k, { status: "success", data });
        subs.get(k)?.forEach((fn) => fn());
        return data;
      } catch (error) {
        cache.set(k, { status: "error", error });
        subs.get(k)?.forEach((fn) => fn());
        throw error;
      }
    },
    prefetchQuery: async ({ queryKey, queryFn }) => {
      await fetchImpl(queryKey);
      cache.set(keyStr(queryKey), { status: "success", data: await queryFn() });
    },
    invalidateQueries: ({ queryKey }) => {
      cache.set(keyStr(queryKey), { status: "stale" });
      subs.get(keyStr(queryKey))?.forEach((fn) => fn());
    },
    getQueryState: (queryKey) => cache.get(keyStr(queryKey)),
    subscribe: (queryKey, listener) => {
      const k = keyStr(queryKey);
      const set = subs.get(k) ?? new Set();
      set.add(listener);
      subs.set(k, set);
      return () => set.delete(listener);
    },
  };
};

describe("createTanStackQueryRuntime", () => {
  it("fetches via TanStack Query client adapter", async () => {
    const manifest = Data("api")
      .resource("users", (r) => r.query("list", "GET", "/users"))
      .toManifest({ throwOnError: false });

    const client = createMockClient(async () => [{ id: 1 }]);
    const runtime = createTanStackQueryRuntime(manifest, client);

    await runtime.refetch("users.list");
    expect(runtime.entries["users.list"]?.state).toBe("success");
    expect(runtime.entries["users.list"]?.data).toEqual([{ id: 1 }]);
  });
});
