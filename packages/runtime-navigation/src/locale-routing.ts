export interface LocaleRoutingConfig {
  readonly locales: readonly string[];
  readonly defaultLocale: string;
}

export interface LocalePathResult {
  readonly locale: string;
  readonly pathname: string;
}

export interface LocaleRoutingRuntime {
  readonly locales: readonly string[];
  readonly defaultLocale: string;
  readonly stripLocale: (pathname: string) => LocalePathResult;
  readonly localizePath: (pathname: string, locale: string) => string;
  readonly matchLocalizedDeepLink: (
    url: string,
  ) => (LocalePathResult & { readonly remainder: string }) | null;
}

const normalizePath = (pathname: string): string => {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }
  return pathname.replace(/\/+$/, "") || "/";
};

/** Locale-prefixed path helpers for web and mobile routers (GAP-I18N-003). */
export const createLocaleRoutingRuntime = (
  config: LocaleRoutingConfig,
): LocaleRoutingRuntime => {
  const localeSet = new Set(config.locales);

  const stripLocale = (pathname: string): LocalePathResult => {
    const normalized = normalizePath(pathname);
    const segments = normalized.split("/").filter(Boolean);
    const first = segments[0];
    if (first && localeSet.has(first)) {
      const rest = segments.slice(1).join("/");
      return {
        locale: first,
        pathname: rest ? `/${rest}` : "/",
      };
    }
    return { locale: config.defaultLocale, pathname: normalized };
  };

  const localizePath = (pathname: string, locale: string): string => {
    if (!localeSet.has(locale)) {
      throw new Error(`Unknown locale "${locale}"`);
    }
    const { pathname: stripped } = stripLocale(pathname);
    if (locale === config.defaultLocale) {
      return stripped;
    }
    return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
  };

  const matchLocalizedDeepLink = (
    url: string,
  ): (LocalePathResult & { readonly remainder: string }) | null => {
    const withoutScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    const slashIndex = withoutScheme.indexOf("/");
    if (slashIndex === -1) {
      return null;
    }
    const pathname = withoutScheme.slice(slashIndex);
    const { locale, pathname: stripped } = stripLocale(pathname);
    return { locale, pathname: stripped, remainder: withoutScheme.slice(0, slashIndex) };
  };

  return {
    locales: [...config.locales],
    defaultLocale: config.defaultLocale,
    stripLocale,
    localizePath,
    matchLocalizedDeepLink,
  };
};
