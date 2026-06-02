import type { KatalixDataManifest, KatalixDataUiState } from "@katalix/data";
import { createTanStackQueryContract } from "@katalix/data";

export type DataRuntimeState = KatalixDataUiState;

export interface QueryRuntimeEntry {
  readonly id: string;
  readonly queryKey: readonly string[];
  readonly method: string;
  readonly path: string;
  state: DataRuntimeState;
  data?: unknown;
  error?: unknown;
}

export interface DataRuntime {
  readonly entries: Readonly<Record<string, QueryRuntimeEntry>>;
  readonly refetch: (operationId: string) => Promise<void>;
  readonly prefetchAll: () => Promise<void>;
  readonly invalidate: (cacheKey: string) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export interface CreateQueryRuntimeOptions {
  readonly fetcher?: (url: string, init: RequestInit) => Promise<unknown>;
  readonly getAuthHeader?: () => string | undefined;
}

const defaultFetcher = async (url: string, init: RequestInit): Promise<unknown> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<unknown>;
};

/** In-memory query runtime binding manifest operations (GAP-DATA-001). */
export const createQueryRuntime = (
  manifest: KatalixDataManifest,
  options: CreateQueryRuntimeOptions = {},
): DataRuntime => {
  const fetcher = options.fetcher ?? defaultFetcher;
  const baseUrl = manifest.baseUrl ?? "";
  const contract = createTanStackQueryContract(manifest);
  const entries: Record<string, QueryRuntimeEntry> = {};
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  for (const op of contract) {
    entries[op.id] = {
      id: op.id,
      queryKey: op.queryKey,
      method: op.method,
      path: op.path,
      state: "idle",
    };
  }

  const load = async (operationId: string): Promise<void> => {
    const entry = entries[operationId];
    if (!entry) {
      return;
    }
    entry.state = "loading";
    try {
      const headers: Record<string, string> = {};
      const auth = options.getAuthHeader?.();
      if (auth) {
        headers.Authorization = auth;
      }
      entry.data = await fetcher(`${baseUrl}${entry.path}`, {
        method: entry.method,
        headers,
      });
      entry.state = "success";
    } catch (error) {
      entry.error = error;
      entry.state = "error";
    }
    notify();
  };

  return {
    entries,
    refetch: load,
    prefetchAll: async () => {
      await Promise.all(Object.keys(entries).map((id) => load(id)));
    },
    invalidate: (cacheKey: string) => {
      for (const entry of Object.values(entries)) {
        if (entry.queryKey.includes(cacheKey)) {
          entry.state = "stale";
        }
      }
      notify();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

/** Map data UI state to a screen variant id (GAP-DATA-002). */
export const resolveDataUiVariant = (
  runtime: DataRuntime,
  operationId: string,
): DataRuntimeState => runtime.entries[operationId]?.state ?? "idle";
