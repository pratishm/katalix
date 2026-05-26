import { describe, expect, it } from "vitest";
import {
  Storage,
  createStorageAdapterPlan,
  printStorageManifest,
  validateStorageManifest,
} from "./index.js";

describe("Storage runtime DSL", () => {
  it("resolves storage authoring into a normalized storage manifest", () => {
    const manifest = Storage("Shop Storage")
      .keyValue("settings", { adapter: "localStorage" })
      .secureKeyValue("session", { adapter: "secure-store" })
      .documentStore("products", { adapter: "indexeddb" }, (store) =>
        store.migration(1, "initial-products"),
      )
      .offlineQueue("mutations", { adapter: "indexeddb" }, (queue) =>
        queue.conflictStrategy("client-wins").optimisticMetadata("pendingWrites"),
      )
      .toManifest();

    expect(manifest.kind).toBe("storage");
    expect(manifest.name).toBe("Shop Storage");
    expect(manifest.stores).toEqual([
      {
        id: "settings",
        kind: "key-value",
        adapter: "localStorage",
        migrations: [],
      },
      {
        id: "session",
        kind: "secure-key-value",
        adapter: "secure-store",
        migrations: [],
      },
      {
        id: "products",
        kind: "document-store",
        adapter: "indexeddb",
        migrations: [{ version: 1, id: "initial-products" }],
      },
      {
        id: "mutations",
        kind: "offline-queue",
        adapter: "indexeddb",
        migrations: [],
        optimisticMetadata: "pendingWrites",
        conflictStrategy: "client-wins",
      },
    ]);
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.meta.builderTrace).toContain('Storage("Shop Storage")');
  });

  it("projects manifests into dependency-free adapter plans", () => {
    const manifest = Storage("Shop Storage")
      .keyValue("settings", { adapter: "localStorage" })
      .cacheStorage("assets", { adapter: "cache-storage" })
      .toManifest();

    expect(createStorageAdapterPlan(manifest, { platform: "web" })).toEqual([
      {
        id: "settings",
        kind: "key-value",
        adapter: "localStorage",
        platform: "web",
      },
      {
        id: "assets",
        kind: "cache-storage",
        adapter: "cache-storage",
        platform: "web",
      },
    ]);
  });

  it("reports unsupported adapters, unsafe secure storage, missing migrations, and offline conflict gaps", () => {
    const manifest = Storage("Shop Storage")
      .keyValue("settings", { adapter: "localStorage" })
      .secureKeyValue("session", { adapter: "localStorage" })
      .documentStore("products", { adapter: "indexeddb" })
      .offlineQueue("mutations", { adapter: "async-storage" })
      .toManifest({
        mode: "report",
        throwOnError: false,
        platform: "native",
      });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LATTIX_UNAVAILABLE_STORAGE_ADAPTER",
          path: "storage.stores[0].adapter",
          received: "localStorage",
        }),
        expect.objectContaining({
          code: "LATTIX_INSECURE_STORAGE_ADAPTER",
          path: "storage.stores[1].adapter",
          received: "localStorage",
        }),
        expect.objectContaining({
          code: "LATTIX_MISSING_STORAGE_MIGRATION",
          path: "storage.stores[2].migrations",
        }),
        expect.objectContaining({
          code: "LATTIX_MISSING_OFFLINE_CONFLICT_STRATEGY",
          path: "storage.stores[3].conflictStrategy",
        }),
      ]),
    );
  });

  it("reports duplicate IDs, unknown adapters, and invalid kind adapter pairings", () => {
    const manifest = Storage("Shop Storage")
      .localSql("database", { adapter: "localStorage" }, (store) =>
        store.migration(1, "initial"),
      )
      .cacheStorage("assets", { adapter: "indexeddb" })
      .keyValue("settings", { adapter: "custom-browser-store" })
      .keyValue("settings", { adapter: "localStorage" })
      .toManifest({
        mode: "report",
        throwOnError: false,
        platform: "web",
      });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LATTIX_UNSUPPORTED_STORAGE_KIND_ADAPTER",
          path: "storage.stores[0].adapter",
          received: { kind: "local-sql", adapter: "localStorage" },
        }),
        expect.objectContaining({
          code: "LATTIX_UNSUPPORTED_STORAGE_KIND_ADAPTER",
          path: "storage.stores[1].adapter",
          received: { kind: "cache-storage", adapter: "indexeddb" },
        }),
        expect.objectContaining({
          code: "LATTIX_UNKNOWN_STORAGE_ADAPTER",
          path: "storage.stores[2].adapter",
          received: "custom-browser-store",
        }),
        expect.objectContaining({
          code: "LATTIX_DUPLICATE_STORAGE_ID",
          path: "storage.stores[3]",
          received: "settings",
        }),
      ]),
    );
  });
});

describe("storage manifest utilities", () => {
  it("validates and prints storage manifests without fluent builder state", () => {
    const manifest = Storage("Shop Storage")
      .keyValue("settings", { adapter: "localStorage" })
      .toManifest();

    expect(validateStorageManifest(manifest).valid).toBe(true);
    expect(printStorageManifest(manifest)).toContain("storage name=Shop Storage");
    expect("state" in manifest).toBe(false);
  });
});
