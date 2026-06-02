import React from "react";
import type { AuthSessionRuntime } from "@katalix/runtime-auth";
import type { DataRuntime } from "@katalix/runtime-data";
import type { ObservabilityRuntime } from "@katalix/runtime-observability";
import type { StorageRuntime } from "@katalix/runtime-storage";

export interface KatalixAppRuntime {
  readonly storage: StorageRuntime | null;
  readonly auth: AuthSessionRuntime | null;
  readonly data: DataRuntime | null;
  readonly observability: ObservabilityRuntime;
}

const KatalixAppRuntimeContext = React.createContext<KatalixAppRuntime | null>(null);

export const KatalixAppRuntimeProvider: React.FC<{
  readonly value: KatalixAppRuntime;
  readonly children: React.ReactNode;
}> = ({ value, children }) => (
  <KatalixAppRuntimeContext.Provider value={value}>{children}</KatalixAppRuntimeContext.Provider>
);

export const useKatalixAppRuntime = (): KatalixAppRuntime => {
  const runtime = React.useContext(KatalixAppRuntimeContext);
  if (!runtime) {
    throw new Error("useKatalixAppRuntime must be used within KatalixApp");
  }
  return runtime;
};

/** Subscribe to data runtime query state changes (GAP-DATA-002). */
export const useQueryState = (
  operationId: string,
): { readonly state: string; readonly data?: unknown; readonly error?: unknown } => {
  const { data } = useKatalixAppRuntime();
  const [, bump] = React.useReducer((count: number) => count + 1, 0);

  React.useEffect(() => {
    if (!data) {
      return;
    }
    return data.subscribe(() => bump());
  }, [data]);

  const entry = data?.entries[operationId];
  return {
    state: entry?.state ?? "idle",
    data: entry?.data,
    error: entry?.error,
  };
};
