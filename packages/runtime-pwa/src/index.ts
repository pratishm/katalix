import type { KatalixWebManifest } from "@katalix/web";

export interface PwaRuntime {
  readonly enabled: boolean;
  readonly manifestPath?: string;
  readonly serviceWorkerPath?: string;
  readonly registerServiceWorker: () => Promise<ServiceWorkerRegistration | null>;
}

export interface CreatePwaRuntimeOptions {
  readonly registerWorker?: (path: string) => Promise<ServiceWorkerRegistration | null>;
}

/** PWA registration runtime from web manifest (GAP-WEB-003). */
export const createPwaRuntime = (
  manifest: KatalixWebManifest,
  options: CreatePwaRuntimeOptions = {},
): PwaRuntime => {
  const pwa = manifest.pwa;
  const enabled = Boolean(pwa);
  const serviceWorkerPath = pwa?.serviceWorker;

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!enabled || !serviceWorkerPath) {
      return null;
    }
    if (options.registerWorker) {
      return options.registerWorker(serviceWorkerPath);
    }
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      return navigator.serviceWorker.register(serviceWorkerPath);
    }
    return null;
  };

  return {
    enabled,
    manifestPath: pwa?.manifestPath,
    serviceWorkerPath,
    registerServiceWorker,
  };
};
