import type { KatalixAppManifest } from "@katalix/app";
import { createObservabilityAdapterPlan } from "@katalix/app";

export interface ObservabilitySdkCallbacks {
  readonly onEvent?: (eventId: string, properties?: Record<string, unknown>) => void;
  readonly onScreen?: (screenRef: string) => void;
  readonly onException?: (error: unknown) => void;
  readonly onLog?: (id: string, message: string, level: string) => void;
}

export interface ObservabilityProviderAdapters {
  readonly sentry?: {
    readonly captureException: (error: unknown) => void;
    readonly trackScreen?: (screenRef: string) => void;
  };
  readonly segment?: {
    readonly track: (eventId: string, properties?: Record<string, unknown>) => void;
  };
  readonly custom?: ObservabilitySdkCallbacks;
}

/** Map manifest provider ids to SDK callbacks (GAP-OBS-001–005). */
export const bindObservabilityProviders = (
  manifest: KatalixAppManifest,
  adapters: ObservabilityProviderAdapters,
): ObservabilitySdkCallbacks => {
  const plan = createObservabilityAdapterPlan(manifest);
  const callbacks: {
    onEvent?: (eventId: string, properties?: Record<string, unknown>) => void;
    onScreen?: (screenRef: string) => void;
    onException?: (error: unknown) => void;
    onLog?: (id: string, message: string, level: string) => void;
  } = { ...adapters.custom };

  if (plan.providers.includes("sentry") && adapters.sentry) {
    callbacks.onException = (error: unknown) => adapters.sentry?.captureException(error);
    if (adapters.sentry.trackScreen) {
      const trackScreen = adapters.sentry.trackScreen;
      callbacks.onScreen = (screenRef: string) => trackScreen(screenRef);
    }
  }

  if (plan.providers.includes("segment") && adapters.segment) {
    callbacks.onEvent = (eventId: string, properties?: Record<string, unknown>) =>
      adapters.segment?.track(eventId, properties);
  }

  return callbacks;
};
