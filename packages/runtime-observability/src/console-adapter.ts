import type { ObservabilityProviderAdapters } from "./providers.js";

/** Development fallback when no Sentry/Segment adapters are bound (GAP-OBS-001–006). */
export const createConsoleObservabilityAdapter = (): ObservabilityProviderAdapters => ({
  custom: {
    onEvent: (eventId, properties) => {
      console.info("[katalix:event]", eventId, properties ?? {});
    },
    onScreen: (screenRef) => {
      console.info("[katalix:screen]", screenRef);
    },
    onException: (error) => {
      console.error("[katalix:exception]", error);
    },
    onLog: (id, message, level) => {
      const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
      fn(`[katalix:${level}]`, id, message);
    },
  },
});
