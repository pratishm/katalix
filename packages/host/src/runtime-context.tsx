import React from "react";
import type { AuthSessionRuntime } from "@katalix/runtime-auth";
import type { DataRuntime } from "@katalix/runtime-data";
import type { I18nRuntime } from "@katalix/runtime-i18n";
import type { DeepLinkRuntime, LocaleRoutingRuntime } from "@katalix/runtime-navigation";
import type { ObservabilityRuntime } from "@katalix/runtime-observability";
import type { PushRuntime } from "@katalix/runtime-push";
import type { PwaRuntime } from "@katalix/runtime-pwa";
import type { StorageRuntime } from "@katalix/runtime-storage";

export interface KatalixAppRuntime {
  readonly storage: StorageRuntime | null;
  readonly auth: AuthSessionRuntime | null;
  readonly data: DataRuntime | null;
  readonly observability: ObservabilityRuntime;
  readonly i18n: I18nRuntime | null;
  readonly push: PushRuntime | null;
  readonly pwa: PwaRuntime | null;
  readonly deepLink: DeepLinkRuntime | null;
  readonly localeRouting: LocaleRoutingRuntime | null;
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

export const useI18n = (): I18nRuntime => {
  const { i18n } = useKatalixAppRuntime();
  if (!i18n) {
    throw new Error("useI18n requires i18nManifest on KatalixApp");
  }
  return i18n;
};

export const useDeepLink = (): DeepLinkRuntime => {
  const { deepLink } = useKatalixAppRuntime();
  if (!deepLink) {
    throw new Error("useDeepLink requires navigationManifest on KatalixApp");
  }
  return deepLink;
};

export const usePush = (): PushRuntime => {
  const { push } = useKatalixAppRuntime();
  if (!push) {
    throw new Error("usePush requires nativeManifest on KatalixApp");
  }
  return push;
};

export const usePwa = (): PwaRuntime => {
  const { pwa } = useKatalixAppRuntime();
  if (!pwa) {
    throw new Error("usePwa requires webManifest on KatalixApp");
  }
  return pwa;
};

export const useLocaleRouting = (): LocaleRoutingRuntime => {
  const { localeRouting } = useKatalixAppRuntime();
  if (!localeRouting) {
    throw new Error("useLocaleRouting requires i18nManifest or localeRouting config on KatalixApp");
  }
  return localeRouting;
};

/** Re-render when locale catalog changes. */
export const useI18nText = (key: string, fallback?: string): string => {
  const i18n = useI18n();
  const [, bump] = React.useReducer((count: number) => count + 1, 0);
  React.useEffect(() => i18n.subscribe(() => bump()), [i18n]);
  return i18n.t(key, fallback);
};
