import type { KatalixAppManifest, KatalixObservabilityManifest } from "@katalix/app";
import { createObservabilityAdapterPlan } from "@katalix/app";

export interface ConsentState {
  readonly categories: Readonly<Record<string, boolean>>;
}

export interface ObservabilityRuntime {
  readonly consent: ConsentState;
  readonly setConsent: (category: string, allowed: boolean) => void;
  readonly trackEvent: (eventId: string, properties?: Record<string, unknown>) => void;
  readonly trackScreen: (screenRef: string) => void;
  readonly captureException: (error: unknown) => void;
  readonly log: (id: string, message: string, level?: string) => void;
}

export interface CreateObservabilityRuntimeOptions {
  readonly onEvent?: (eventId: string, properties?: Record<string, unknown>) => void;
  readonly onScreen?: (screenRef: string) => void;
  readonly onException?: (error: unknown) => void;
  readonly onLog?: (id: string, message: string, level: string) => void;
}

/** Consent-gated observability runtime (GAP-OBS-004, GAP-ADAPTER-006). */
export const createObservabilityRuntime = (
  manifest: KatalixAppManifest,
  options: CreateObservabilityRuntimeOptions = {},
): ObservabilityRuntime => {
  const obs: KatalixObservabilityManifest | undefined = manifest.observability;
  const plan = obs ? createObservabilityAdapterPlan(manifest) : { providers: [], analyticsEvents: [], performanceSpans: [], consentCategories: [] };
  const categories: Record<string, boolean> = {};
  for (const c of obs?.consent ?? []) {
    categories[c.category] = c.required === true;
  }

  const canTrack = (consentCategory?: string): boolean => {
    if (!consentCategory) {
      return true;
    }
    return categories[consentCategory] === true;
  };

  return {
    consent: { categories },
    setConsent: (category, allowed) => {
      categories[category] = allowed;
    },
    trackEvent: (eventId, properties) => {
      const event = obs?.analyticsEvents.find((e) => e.id === eventId);
      if (event && !canTrack(event.consent)) {
        return;
      }
      if (plan.analyticsEvents.includes(eventId) || !obs) {
        options.onEvent?.(eventId, properties);
      }
    },
    trackScreen: (screenRef) => {
      if (obs?.screenTracking.some((s) => s.screenRef === screenRef)) {
        options.onScreen?.(screenRef);
      }
    },
    captureException: (error) => {
      if (obs?.crashReporting.length) {
        options.onException?.(error);
      }
    },
    log: (id, message, level = "info") => {
      if (obs?.logs.some((l) => l.id === id)) {
        options.onLog?.(id, message, level);
      }
    },
  };
};
