import React from "react";
import type { KatalixAppManifest } from "@katalix/app";
import type { KatalixTree } from "@katalix/core";
import type { KatalixNativeManifest } from "@katalix/native";
import {
  buildThemeRegistry,
  defaultTokenRegistry,
  resolveThemeMode,
  type TokenRegistry,
} from "@katalix/tokens";
import {
  KatalixNativeRenderer,
  KatalixRegistryContext,
  type HostComponentRegistry,
  type KatalixActionHandler,
} from "@katalix/react-native";
import type { AuthSessionRuntime } from "@katalix/runtime-auth";
import { createAuthSessionRuntime } from "@katalix/runtime-auth";
import type { DataRuntime } from "@katalix/runtime-data";
import { createQueryRuntime } from "@katalix/runtime-data";
import { NativeLayoutProvider } from "@katalix/runtime-native-layout";
import type { ObservabilityRuntime } from "@katalix/runtime-observability";
import { createObservabilityRuntime } from "@katalix/runtime-observability";
import type { StorageRuntime } from "@katalix/runtime-storage";
import { createStorageRuntime } from "@katalix/runtime-storage";
import type { KatalixAuthManifest } from "@katalix/auth";
import type { KatalixDataManifest } from "@katalix/data";
import type { KatalixStorageManifest } from "@katalix/storage";
import {
  KatalixAppRuntimeProvider,
  type KatalixAppRuntime,
} from "./runtime-context.js";

export type { KatalixAppRuntime } from "./runtime-context.js";
export {
  KatalixAppRuntimeProvider,
  useKatalixAppRuntime,
  useQueryState,
} from "./runtime-context.js";

export interface KatalixAppProps {
  readonly appManifest: KatalixAppManifest;
  readonly tree: KatalixTree;
  readonly nativeManifest?: KatalixNativeManifest;
  readonly dataManifest?: KatalixDataManifest;
  readonly storageManifest?: KatalixStorageManifest;
  readonly authManifest?: KatalixAuthManifest;
  readonly registry?: TokenRegistry;
  readonly hostRegistry?: HostComponentRegistry;
  readonly onAction?: KatalixActionHandler;
  readonly KeyboardAvoidingView?: React.ComponentType<Record<string, unknown>>;
  readonly prefetchData?: boolean;
}

const themeProviderConfig = (
  appManifest: KatalixAppManifest,
): Readonly<Record<string, unknown>> | undefined => {
  const theme = appManifest.providers.find((provider) => provider.id === "theme");
  return theme as Readonly<Record<string, unknown>> | undefined;
};

/** Single app shell composing Katalix runtimes (Wave 2 @katalix/host). */
export const KatalixApp: React.FC<KatalixAppProps> = ({
  appManifest,
  tree,
  nativeManifest,
  dataManifest,
  storageManifest,
  authManifest,
  registry,
  hostRegistry,
  onAction,
  KeyboardAvoidingView,
  prefetchData = true,
}) => {
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
    return createQueryRuntime(dataManifest, {
      getAuthHeader: () => auth?.getAuthHeader(),
    });
  }, [dataManifest, auth]);

  const observability = React.useMemo(
    () => createObservabilityRuntime(appManifest),
    [appManifest],
  );

  const runtime = React.useMemo<KatalixAppRuntime>(
    () => ({
      storage,
      auth,
      data,
      observability,
    }),
    [storage, auth, data, observability],
  );

  const themedRegistry = React.useMemo(
    () => buildThemeRegistry(resolveThemeMode(themeProviderConfig(appManifest)), registry ?? defaultTokenRegistry),
    [appManifest, registry],
  );

  React.useEffect(() => {
    void auth?.bootstrap();
  }, [auth]);

  React.useEffect(() => {
    if (prefetchData && data) {
      void data.prefetchAll();
    }
  }, [data, prefetchData]);

  const renderer = (
    <KatalixRegistryContext.Provider value={themedRegistry}>
      <KatalixNativeRenderer
        tree={tree}
        registry={themedRegistry}
        hostRegistry={hostRegistry}
        onAction={(action) => {
          observability.trackEvent(action.id, action.payload as Record<string, unknown>);
          onAction?.(action);
        }}
      />
    </KatalixRegistryContext.Provider>
  );

  const body = nativeManifest ? (
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
