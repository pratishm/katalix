import { describe, expect, it } from "vitest";
import {
  createAsyncStorageAdapter,
  createLocalStorageAdapter,
  createSecureStoreAdapter,
} from "./adapters.js";

describe("storage adapters", () => {
  it("stores values in async storage with namespace", async () => {
    const backing = new Map<string, string>();
    const store = createAsyncStorageAdapter(
      {
        getItem: async (key) => backing.get(key) ?? null,
        setItem: async (key, value) => {
          backing.set(key, value);
        },
        removeItem: async (key) => {
          backing.delete(key);
        },
      },
      "profile",
    );

    await store.setItem("name", "Ada");
    expect(await store.getItem("name")).toBe("Ada");
    expect(backing.get("profile:name")).toBe("Ada");
  });

  it("stores values in secure store with namespace", async () => {
    const backing = new Map<string, string>();
    const store = createSecureStoreAdapter(
      {
        getItemAsync: async (key) => backing.get(key) ?? null,
        setItemAsync: async (key, value) => {
          backing.set(key, value);
        },
        deleteItemAsync: async (key) => {
          backing.delete(key);
        },
      },
      "auth",
    );

    await store.setItem("token", "secret");
    expect(await store.getItem("token")).toBe("secret");
  });

  it("uses localStorage when available", async () => {
    const original = globalThis.localStorage;
    const backing = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => backing.get(key) ?? null,
        setItem: (key: string, value: string) => {
          backing.set(key, value);
        },
        removeItem: (key: string) => {
          backing.delete(key);
        },
      },
    });

    const store = createLocalStorageAdapter("settings");
    await store.setItem("theme", "dark");
    expect(await store.getItem("theme")).toBe("dark");

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original,
    });
  });
});
