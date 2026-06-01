import type { KatalixStorageManifest } from "@katalix/storage";
import { createStorageAdapterPlan } from "@katalix/storage";

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface StorageRuntime {
  readonly store: (storeId: string) => KeyValueStore;
}

const memoryBacking = new Map<string, Map<string, string>>();

const createMemoryStore = (namespace: string): KeyValueStore => {
  if (!memoryBacking.has(namespace)) {
    memoryBacking.set(namespace, new Map());
  }
  const map = memoryBacking.get(namespace)!;
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
};

export interface CreateStorageRuntimeOptions {
  readonly adapters?: Readonly<
    Record<string, (storeId: string, adapter: string) => KeyValueStore>
  >;
}

/** Storage runtime with in-memory default adapters (GAP-STORE-001). */
export const createStorageRuntime = (
  manifest: KatalixStorageManifest,
  options: CreateStorageRuntimeOptions = {},
): StorageRuntime => {
  const plan = createStorageAdapterPlan(manifest, { platform: "native" });
  const stores = new Map<string, KeyValueStore>();

  for (const entry of plan) {
    const factory =
      options.adapters?.[entry.adapter] ??
      ((_id: string, _adapter: string) => createMemoryStore(entry.id));
    stores.set(entry.id, factory(entry.id, entry.adapter));
  }

  return {
    store: (storeId: string) => {
      const store = stores.get(storeId);
      if (!store) {
        throw new Error(`Unknown storage store "${storeId}"`);
      }
      return store;
    },
  };
};
