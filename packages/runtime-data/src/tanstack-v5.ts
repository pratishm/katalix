import type { TanStackQueryClientAdapter } from "./tanstack-query.js";

/** Minimal TanStack Query v5 client shape. */
export interface TanStackQueryV5Client {
  fetchQuery<T>(options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<T>;
    staleTime?: number;
  }): Promise<T>;
  prefetchQuery(options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
  }): Promise<void>;
  invalidateQueries(options: { queryKey: readonly unknown[] }): void;
  getQueryState?(queryKey: readonly unknown[]): {
    status: string;
    data?: unknown;
    error?: unknown;
  };
}

/** Wrap `@tanstack/react-query` QueryClient for Katalix (GAP-DATA-001 full). */
export const wrapTanStackQueryV5Client = (
  client: TanStackQueryV5Client,
): TanStackQueryClientAdapter => ({
  fetchQuery: (options) => client.fetchQuery(options),
  prefetchQuery: (options) => client.prefetchQuery(options),
  invalidateQueries: (options) => client.invalidateQueries(options),
  getQueryState: client.getQueryState
    ? (queryKey) => {
        const state = client.getQueryState!(queryKey);
        if (!state) {
          return undefined;
        }
        return {
          status: state.status,
          data: state.data,
          error: state.error,
        };
      }
    : undefined,
});
