import React from "react";
import type { KatalixAppManifest } from "@katalix/app";
import type { KatalixTree } from "@katalix/core";
import type { KatalixNativeManifest } from "@katalix/native";
import type { TokenRegistry } from "@katalix/tokens";
import {
  KatalixNativeRenderer,
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
}

export interface KatalixAppRuntime {
  readonly storage: StorageRuntime;
  readonly auth: AuthSessionRuntime;
  readonly data: DataRuntime;
  readonly observability: ObservabilityRuntime;
}

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
}) => {
  const storage = React.useMemo(
    () => (storageManifest ? createStorageRuntime(storageManifest) : undefined),
    [storageManifest],
  );

  const auth = React.useMemo(() => {
    if (!authManifest || !storage) {
      return null;
    }
    return createAuthSessionRuntime(authManifest, { storage });
  }, [authManifest, storage]);

  const data = React.useMemo(
    () =>
      dataManifest
        ? createQueryRuntime(dataManifest, {
            getAuthHeader: () => auth?.getAuthHeader(),
          })
        : null,
    [dataManifest, auth],
  );

  const observability = React.useMemo(
    () => createObservabilityRuntime(appManifest),
    [appManifest],
  );

  React.useEffect(() => {
    void auth?.bootstrap();
  }, [auth]);

  const renderer = (
    <KatalixNativeRenderer
      tree={tree}
      registry={registry}
      hostRegistry={hostRegistry}
      onAction={(action) => {
        observability.trackEvent(action.id, action.payload as Record<string, unknown>);
        onAction?.(action);
      }}
    />
  );

  if (nativeManifest) {
    return (
      <NativeLayoutProvider
        manifest={nativeManifest}
        KeyboardAvoidingView={KeyboardAvoidingView as never}
        onRefresh={() => {
          if (data) {
            for (const id of Object.keys(data.entries)) {
              void data.refetch(id);
            }
          }
        }}
      >
        {renderer}
      </NativeLayoutProvider>
    );
  }

  return renderer;
};

