import type { KeyValueStore } from "./index.js";

/** Browser localStorage adapter (GAP-STORE-001 web). */
export const createLocalStorageAdapter =
  (namespace: string): KeyValueStore => ({
    getItem: async (key) => {
      if (typeof localStorage === "undefined") {
        return null;
      }
      return localStorage.getItem(`${namespace}:${key}`);
    },
    setItem: async (key, value) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`${namespace}:${key}`, value);
      }
    },
    removeItem: async (key) => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(`${namespace}:${key}`);
      }
    },
  });

/** React Native AsyncStorage-compatible adapter factory. */
export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const createAsyncStorageAdapter =
  (storage: AsyncStorageLike, namespace: string): KeyValueStore => ({
    getItem: (key) => storage.getItem(`${namespace}:${key}`),
    setItem: (key, value) => storage.setItem(`${namespace}:${key}`, value),
    removeItem: (key) => storage.removeItem(`${namespace}:${key}`),
  });

/** Secure store adapter for auth tokens (GAP-AUTH-004). */
export interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export const createSecureStoreAdapter =
  (secureStore: SecureStoreLike, namespace: string): KeyValueStore => ({
    getItem: (key) => secureStore.getItemAsync(`${namespace}:${key}`),
    setItem: (key, value) => secureStore.setItemAsync(`${namespace}:${key}`, value),
    removeItem: (key) => secureStore.deleteItemAsync(`${namespace}:${key}`),
  });
