import React from "react";
import type { KatalixAppManifest } from "@katalix/app";
import type { KatalixTree } from "@katalix/core";
import type { KatalixI18nManifest } from "@katalix/i18n";
import type { KatalixNativeManifest } from "@katalix/native";
import type { KatalixNavigationManifest } from "@katalix/navigation";
import {
  buildThemeRegistry,
  defaultTokenRegistry,
  type TokenRegistry,
} from "@katalix/tokens";
import { KatalixRenderer } from "@katalix/react";
import {
  KatalixNativeRenderer,
  KatalixRegistryContext,
  createDefaultHostRegistry,
  mergeHostRegistries,
  type HostComponentRegistry,
  type KatalixActionHandler,
} from "@katalix/react-native";
import { resolveAppPlatform, type KatalixAppPlatformInput } from "./resolve-app-platform.js";
import type { AuthSessionRuntime } from "@katalix/runtime-auth";
import { createAuthSessionRuntime } from "@katalix/runtime-auth";
import type { DataRuntime, TanStackQueryClientAdapter } from "@katalix/runtime-data";
import { createQueryRuntime, createTanStackQueryRuntime } from "@katalix/runtime-data";
import type { I18nRuntime } from "@katalix/runtime-i18n";
import { createI18nRuntime } from "@katalix/runtime-i18n";
import { NativeLayoutProvider } from "@katalix/runtime-native-layout";
import type {
  DeepLinkRuntime,
  LocaleRoutingConfig,
  LocaleRoutingRuntime,
} from "@katalix/runtime-navigation";
import { createDeepLinkRuntime, createLocaleRoutingRuntime, tryGetReactNativeLinking } from "@katalix/runtime-navigation";
import type {
  ObservabilityProviderAdapters,
  ObservabilityRuntime,
} from "@katalix/runtime-observability";
import {
  bindObservabilityProviders,
  createConsoleObservabilityAdapter,
  createObservabilityRuntime,
} from "@katalix/runtime-observability";
import type { PushAdapter, PushRuntime } from "@katalix/runtime-push";
import { createPushRuntime, resolveDefaultPushAdapter } from "@katalix/runtime-push";
import type { PwaRuntime } from "@katalix/runtime-pwa";
import { createPwaRuntime } from "@katalix/runtime-pwa";
import type { StorageRuntime } from "@katalix/runtime-storage";
import { createStorageRuntime } from "@katalix/runtime-storage";
import type { KatalixAuthManifest } from "@katalix/auth";
import type { KatalixDataManifest } from "@katalix/data";
import type { KatalixStorageManifest } from "@katalix/storage";
import type { KatalixWebManifest } from "@katalix/web";
import {
  KatalixAppRuntimeProvider,
  type KatalixAppRuntime,
} from "./runtime-context.js";
import { ThemeModeProvider, resolveThemeMode, useThemeMode } from "./theme-mode.js";

export type { KatalixAppRuntime } from "./runtime-context.js";
export {
  KatalixAppRuntimeProvider,
  useKatalixAppRuntime,
  useQueryState,
  useI18n,
  useDeepLink,
  usePush,
  usePwa,
  useLocaleRouting,
} from "./runtime-context.js";
export { ThemeModeProvider, useThemeMode, resolveThemeMode };
export type { TanStackQueryClientAdapter, TanStackQueryV5Client } from "@katalix/runtime-data";
export { wrapTanStackQueryV5Client, resolveDataBoundScreenVariant } from "@katalix/runtime-data";
export type { LocaleRoutingConfig } from "@katalix/runtime-navigation";
export type { KatalixAppPlatform, KatalixAppPlatformInput } from "./resolve-app-platform.js";
export { resolveAppPlatform } from "./resolve-app-platform.js";

export interface KatalixAppProps {
  readonly appManifest: KatalixAppManifest;
  readonly tree: KatalixTree;
  readonly nativeManifest?: KatalixNativeManifest;
  readonly navigationManifest?: KatalixNavigationManifest;
  readonly dataManifest?: KatalixDataManifest;
  readonly storageManifest?: KatalixStorageManifest;
  readonly authManifest?: KatalixAuthManifest;
  readonly i18nManifest?: KatalixI18nManifest;
  readonly webManifest?: KatalixWebManifest;
  readonly registry?: TokenRegistry;
  readonly hostRegistry?: HostComponentRegistry;
  readonly onAction?: KatalixActionHandler;
  readonly KeyboardAvoidingView?: React.ComponentType<Record<string, unknown>>;
  readonly prefetchData?: boolean;
  readonly observabilityAdapters?: ObservabilityProviderAdapters;
  readonly pushAdapter?: PushAdapter;
  readonly getInitialDeepLink?: () => Promise<string | null>;
  readonly registerPwaWorker?: (path: string) => Promise<ServiceWorkerRegistration | null>;
  readonly queryClient?: TanStackQueryClientAdapter;
  readonly localeRouting?: LocaleRoutingConfig;
  /** `auto`: native when `nativeManifest` is set, else web when only `webManifest` is set. */
  readonly platform?: KatalixAppPlatformInput;
}

const themeProviderConfig = (
  appManifest: KatalixAppManifest,
): Readonly<Record<string, unknown>> | undefined => {
  const theme = appManifest.providers.find((provider) => provider.id === "theme");
  return theme as Readonly<Record<string, unknown>> | undefined;
};

const KatalixAppInner: React.FC<
  Omit<KatalixAppProps, "registry"> & { readonly baseRegistry: TokenRegistry }
> = ({
  appManifest,
  tree,
  nativeManifest,
  navigationManifest,
  dataManifest,
  storageManifest,
  authManifest,
  i18nManifest,
  webManifest,
  baseRegistry,
  hostRegistry,
  onAction,
  KeyboardAvoidingView,
  prefetchData = true,
  observabilityAdapters,
  pushAdapter,
  getInitialDeepLink,
  registerPwaWorker,
  queryClient,
  localeRouting,
  platform: platformInput = "auto",
}) => {
  const { registry: themedRegistry } = useThemeMode();
  const platform = resolveAppPlatform({
    platform: platformInput,
    nativeManifest,
    webManifest,
  });

  const mergedHostRegistry = React.useMemo(
    () =>
      platform === "native"
        ? mergeHostRegistries(createDefaultHostRegistry(), hostRegistry)
        : hostRegistry,
    [platform, hostRegistry],
  );

  const storage = React.useMemo(
    () => (storageManifest ? createStorageRuntime(storageManifest) : null),
    [storageManifest],
  );

  const auth = React.useMemo<AuthSessionRuntime | null>(() => {
    if (!authManifest || !storage) {
      return null;
    }
    return createAuthSessionRuntime(authManifest, { storage });
  }, [authManifest, storage]);

  const data = React.useMemo<DataRuntime | null>(() => {
    if (!dataManifest) {
      return null;
    }
    const options = { getAuthHeader: () => auth?.getAuthHeader() };
    if (queryClient) {
      return createTanStackQueryRuntime(dataManifest, queryClient, options);
    }
    return createQueryRuntime(dataManifest, options);
  }, [dataManifest, auth, queryClient]);

  const observability = React.useMemo<ObservabilityRuntime>(() => {
    const adapters =
      observabilityAdapters ??
      (appManifest.observability ? createConsoleObservabilityAdapter() : undefined);
    const sdk = adapters ? bindObservabilityProviders(appManifest, adapters) : {};
    return createObservabilityRuntime(appManifest, sdk);
  }, [appManifest, observabilityAdapters]);

  const i18n = React.useMemo<I18nRuntime | null>(
    () => (i18nManifest ? createI18nRuntime(i18nManifest) : null),
    [i18nManifest],
  );

  const push = React.useMemo<PushRuntime | null>(() => {
    if (!nativeManifest) {
      return null;
    }
    return createPushRuntime(nativeManifest, pushAdapter ?? resolveDefaultPushAdapter());
  }, [nativeManifest, pushAdapter]);

  const pwa = React.useMemo<PwaRuntime | null>(() => {
    if (!webManifest) {
      return null;
    }
    return createPwaRuntime(webManifest, { registerWorker: registerPwaWorker });
  }, [webManifest, registerPwaWorker]);

  const deepLink = React.useMemo<DeepLinkRuntime | null>(() => {
    if (!navigationManifest) {
      return null;
    }
    return createDeepLinkRuntime(navigationManifest, {
      getInitialUrl:
        getInitialDeepLink ??
        (async () => {
          if (platform !== "native") {
            return null;
          }
          return (await tryGetReactNativeLinking()?.getInitialURL()) ?? null;
        }),
    });
  }, [navigationManifest, getInitialDeepLink, platform]);

  const localeRoutingRuntime = React.useMemo<LocaleRoutingRuntime | null>(() => {
    if (localeRouting) {
      return createLocaleRoutingRuntime(localeRouting);
    }
    if (!i18nManifest) {
      return null;
    }
    return createLocaleRoutingRuntime({
      locales: i18nManifest.locales.map((entry) => entry.locale),
      defaultLocale: i18nManifest.defaultLocale,
    });
  }, [localeRouting, i18nManifest]);

  const runtime = React.useMemo<KatalixAppRuntime>(
    () => ({
      storage,
      auth,
      data,
      observability,
      i18n,
      push,
      pwa,
      deepLink,
      localeRouting: localeRoutingRuntime,
    }),
    [storage, auth, data, observability, i18n, push, pwa, deepLink, localeRoutingRuntime],
  );

  React.useEffect(() => {
    void auth?.bootstrap();
  }, [auth]);

  React.useEffect(() => {
    if (prefetchData && data) {
      void data.prefetchAll();
    }
  }, [data, prefetchData]);

  React.useEffect(() => {
    if (pwa?.enabled) {
      void pwa.registerServiceWorker();
    }
  }, [pwa]);

  React.useEffect(() => {
    if (!deepLink || platform !== "native") {
      return;
    }
    const linking = tryGetReactNativeLinking();
    if (!linking) {
      return;
    }
    const subscription = linking.addEventListener("url", ({ url }: { url: string }) => {
      deepLink.emit(url);
    });
    return () => subscription.remove();
  }, [deepLink, platform]);

  React.useEffect(() => {
    observability.trackScreen(tree.root.id ?? tree.root.kind);
  }, [tree.root.id, tree.root.kind, observability]);

  React.useEffect(() => {
    if (!deepLink) {
      return;
    }
    return deepLink.subscribe((match) => {
      observability.trackEvent("deep_link.open", {
        routeId: match.routeId,
        pattern: match.pattern,
        ...match.params,
      });
    });
  }, [deepLink, observability]);

  const handleAction: KatalixActionHandler = (action) => {
    observability.trackEvent(action.id, action.payload as Record<string, unknown>);
    onAction?.(action);
  };

  const renderer =
    platform === "web" ? (
      <KatalixRenderer
        tree={tree}
        registry={themedRegistry}
        hostRegistry={hostRegistry as never}
        onAction={handleAction}
      />
    ) : (
      <KatalixRegistryContext.Provider value={themedRegistry}>
        <KatalixNativeRenderer
          tree={tree}
          registry={themedRegistry}
          hostRegistry={mergedHostRegistry}
          onAction={handleAction}
        />
      </KatalixRegistryContext.Provider>
    );

  const body = platform === "native" && nativeManifest ? (
    <NativeLayoutProvider
      manifest={nativeManifest}
      KeyboardAvoidingView={KeyboardAvoidingView as never}
      onRefresh={() => {
        if (data) {
          void data.prefetchAll();
        }
      }}
    >
      {renderer}
    </NativeLayoutProvider>
  ) : (
    renderer
  );

  return <KatalixAppRuntimeProvider value={runtime}>{body}</KatalixAppRuntimeProvider>;
};

/** Single app shell composing Katalix runtimes (Wave 2–3 @katalix/host). */
export const KatalixApp: React.FC<KatalixAppProps> = ({
  appManifest,
  registry,
  ...rest
}) => {
  const baseRegistry = registry ?? defaultTokenRegistry;
  const initialMode = resolveThemeMode(themeProviderConfig(appManifest));

  return (
    <ThemeModeProvider initialMode={initialMode} baseRegistry={baseRegistry}>
      <KatalixAppInner appManifest={appManifest} baseRegistry={baseRegistry} {...rest} />
    </ThemeModeProvider>
  );
};

// Re-export for consumers that build registries without ThemeModeProvider
export { buildThemeRegistry };
