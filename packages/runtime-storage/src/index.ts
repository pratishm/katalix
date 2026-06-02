import type { KatalixStorageManifest } from "@katalix/storage";
import { createStorageAdapterPlan } from "@katalix/storage";
import {
  createAsyncStorageAdapter,
  createLocalStorageAdapter,
  createSecureStoreAdapter,
  type AsyncStorageLike,
  type SecureStoreLike,
} from "./adapters.js";

export type {
  AsyncStorageLike,
  SecureStoreLike,
} from "./adapters.js";
export {
  createAsyncStorageAdapter,
  createLocalStorageAdapter,
  createSecureStoreAdapter,
} from "./adapters.js";

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
  readonly platform?: "web" | "native";
  readonly asyncStorage?: AsyncStorageLike;
  readonly secureStore?: SecureStoreLike;
}

const defaultAdapters = (
  options: CreateStorageRuntimeOptions,
): Record<string, (storeId: string, _adapter: string) => KeyValueStore> => {
  const adapters: Record<string, (storeId: string, _adapter: string) => KeyValueStore> = {
    memory: (storeId) => createMemoryStore(storeId),
  };

  if (options.platform === "web" || typeof localStorage !== "undefined") {
    adapters.localStorage = (storeId) => createLocalStorageAdapter(storeId);
  }

  if (options.asyncStorage) {
    const storage = options.asyncStorage;
    adapters.asyncStorage = (storeId) => createAsyncStorageAdapter(storage, storeId);
    adapters["async-storage"] = adapters.asyncStorage;
  }

  if (options.secureStore) {
    const secure = options.secureStore;
    adapters.secureStore = (storeId) => createSecureStoreAdapter(secure, storeId);
    adapters["secure-store"] = adapters.secureStore;
  }

  return adapters;
};

/** Storage runtime with platform adapters (GAP-STORE-001). */
export const createStorageRuntime = (
  manifest: KatalixStorageManifest,
  options: CreateStorageRuntimeOptions = {},
): StorageRuntime => {
  const plan = createStorageAdapterPlan(manifest, {
    platform: options.platform ?? "native",
  });
  const stores = new Map<string, KeyValueStore>();
  const adapterFactories = {
    ...defaultAdapters(options),
    ...options.adapters,
  };

  for (const entry of plan) {
    const factory =
      adapterFactories[entry.adapter] ??
      adapterFactories.memory ??
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
