import type { KatalixNavigationManifest, KatalixRouteManifest } from "@katalix/navigation";

export interface DeepLinkMatch {
  readonly routeId: string;
  readonly pattern: string;
  readonly params: Readonly<Record<string, string>>;
}

export interface DeepLinkRuntime {
  readonly patterns: readonly { readonly routeId: string; readonly pattern: string }[];
  readonly resolve: (url: string) => DeepLinkMatch | null;
  readonly subscribe: (handler: (match: DeepLinkMatch) => void) => () => void;
  readonly emit: (url: string) => DeepLinkMatch | null;
}

export interface CreateDeepLinkRuntimeOptions {
  readonly getInitialUrl?: () => Promise<string | null>;
}

const collectRoutes = (
  routes: readonly KatalixRouteManifest[],
): readonly { readonly routeId: string; readonly pattern: string }[] =>
  routes.flatMap((route) => {
    const own = route.deepLinks.map((pattern) => ({ routeId: route.id, pattern }));
    const nested = collectRoutes(route.children);
    return [...own, ...nested];
  });

const matchPattern = (
  pattern: string,
  url: string,
): Readonly<Record<string, string>> | null => {
  if (pattern === url) {
    return {};
  }
  const patternParts = pattern.replace(/:\//g, "://").split("/").filter(Boolean);
  const urlParts = url.replace(/:\//g, "://").split("/").filter(Boolean);
  if (patternParts.length !== urlParts.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const segment = patternParts[i]!;
    const value = urlParts[i]!;
    if (segment.startsWith(":")) {
      params[segment.slice(1)] = value;
      continue;
    }
    if (segment !== value) {
      return null;
    }
  }
  return params;
};

/** Deep link resolver runtime (GAP-NAV-005). */
export const createDeepLinkRuntime = (
  manifest: KatalixNavigationManifest,
  options: CreateDeepLinkRuntimeOptions = {},
): DeepLinkRuntime => {
  const patterns = collectRoutes(manifest.routes);
  const listeners = new Set<(match: DeepLinkMatch) => void>();

  const resolve = (url: string): DeepLinkMatch | null => {
    for (const entry of patterns) {
      const params = matchPattern(entry.pattern, url);
      if (params !== null) {
        return { routeId: entry.routeId, pattern: entry.pattern, params };
      }
    }
    return null;
  };

  const emit = (url: string): DeepLinkMatch | null => {
    const match = resolve(url);
    if (match) {
      for (const listener of listeners) {
        listener(match);
      }
    }
    return match;
  };

  if (options.getInitialUrl) {
    void options.getInitialUrl().then((url) => {
      if (url) {
        emit(url);
      }
    });
  }

  return {
    patterns,
    resolve,
    subscribe: (handler) => {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
    emit,
  };
};
