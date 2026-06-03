import type { KatalixDataManifest, KatalixDataUiState } from "@katalix/data";
import { createTanStackQueryContract } from "@katalix/data";

type DataRuntimeState = KatalixDataUiState;

interface QueryRuntimeEntry {
  readonly id: string;
  readonly queryKey: readonly string[];
  readonly method: string;
  readonly path: string;
  state: DataRuntimeState;
  data?: unknown;
  error?: unknown;
}

interface DataRuntime {
  readonly entries: Readonly<Record<string, QueryRuntimeEntry>>;
  readonly refetch: (operationId: string) => Promise<void>;
  readonly prefetchAll: () => Promise<void>;
  readonly invalidate: (cacheKey: string) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

interface CreateQueryRuntimeOptions {
  readonly fetcher?: (url: string, init: RequestInit) => Promise<unknown>;
  readonly getAuthHeader?: () => string | undefined;
}

export interface TanStackQueryState {
  readonly status: string;
  readonly data?: unknown;
  readonly error?: unknown;
}

/** Minimal QueryClient surface for Katalix data manifests (GAP-DATA-001). */
export interface TanStackQueryClientAdapter {
  readonly fetchQuery: <T>(options: {
    readonly queryKey: readonly unknown[];
    readonly queryFn: () => Promise<T>;
    readonly staleTime?: number;
  }) => Promise<T>;
  readonly prefetchQuery: (options: {
    readonly queryKey: readonly unknown[];
    readonly queryFn: () => Promise<unknown>;
  }) => Promise<void>;
  readonly invalidateQueries: (options: { readonly queryKey: readonly unknown[] }) => void;
  readonly getQueryState?: (queryKey: readonly unknown[]) => TanStackQueryState | undefined;
  readonly subscribe?: (queryKey: readonly unknown[], listener: () => void) => () => void;
}

const mapQueryStatus = (status: string): DataRuntimeState => {
  switch (status) {
    case "pending":
      return "loading";
    case "success":
      return "success";
    case "error":
      return "error";
    default:
      return "idle";
  }
};

const defaultFetcher = async (url: string, init: RequestInit): Promise<unknown> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<unknown>;
};

/** Bind manifest operations to a TanStack Query client. */
export const createTanStackQueryRuntime = (
  manifest: KatalixDataManifest,
  client: TanStackQueryClientAdapter,
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

  const syncFromClient = (operationId: string): void => {
    const entry = entries[operationId];
    if (!entry || !client.getQueryState) {
      return;
    }
    const state = client.getQueryState(entry.queryKey);
    if (!state) {
      return;
    }
    entry.state = mapQueryStatus(state.status);
    entry.data = state.data;
    entry.error = state.error;
  };

  for (const op of contract) {
    entries[op.id] = {
      id: op.id,
      queryKey: op.queryKey,
      method: op.method,
      path: op.path,
      state: "idle",
    };
    client.subscribe?.(op.queryKey, () => {
      syncFromClient(op.id);
      notify();
    });
  }

  const buildQueryFn = (entry: QueryRuntimeEntry) => async (): Promise<unknown> => {
    const headers: Record<string, string> = {};
    const auth = options.getAuthHeader?.();
    if (auth) {
      headers.Authorization = auth;
    }
    return fetcher(`${baseUrl}${entry.path}`, {
      method: entry.method,
      headers,
    });
  };

  const load = async (operationId: string): Promise<void> => {
    const entry = entries[operationId];
    if (!entry) {
      return;
    }
    entry.state = "loading";
    notify();
    try {
      entry.data = await client.fetchQuery({
        queryKey: entry.queryKey,
        queryFn: buildQueryFn(entry),
      });
      entry.state = "success";
      entry.error = undefined;
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
      await Promise.all(
        Object.values(entries).map((entry) =>
          client.prefetchQuery({
            queryKey: entry.queryKey,
            queryFn: buildQueryFn(entry),
          }),
        ),
      );
      for (const id of Object.keys(entries)) {
        syncFromClient(id);
      }
      notify();
    },
    invalidate: (cacheKey: string) => {
      for (const entry of Object.values(entries)) {
        if (entry.queryKey.includes(cacheKey)) {
          client.invalidateQueries({ queryKey: entry.queryKey });
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

/** Map a TanStack Query v5-style client into the Katalix adapter. */
export const createTanStackQueryAdapterFromClient = (
  client: TanStackQueryClientAdapter,
): TanStackQueryClientAdapter => client;
