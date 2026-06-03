import type { KatalixI18nManifest } from "@katalix/i18n";
import { formatDate, formatNumber, formatPlural } from "./format.js";

export interface I18nRuntime {
  readonly locale: string;
  readonly isRtl: boolean;
  readonly setLocale: (locale: string) => void;
  readonly t: (key: string, fallback?: string) => string;
  readonly tp: (key: string, count: number, fallback?: string) => string;
  readonly formatDate: (
    value: Date | number | string,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  readonly formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  readonly subscribe: (listener: () => void) => () => void;
}

/** I18n runtime with in-memory catalogs (GAP-I18N-001, GAP-I18N-002). */
export const createI18nRuntime = (manifest: KatalixI18nManifest): I18nRuntime => {
  const catalogs = new Map(
    manifest.locales.map((entry) => [entry.locale, entry] as const),
  );
  let locale = manifest.defaultLocale;
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const currentEntry = (): KatalixI18nManifest["locales"][number] | undefined =>
    catalogs.get(locale);

  return {
    get locale() {
      return locale;
    },
    get isRtl() {
      return catalogs.get(locale)?.rtl === true;
    },
    setLocale: (next) => {
      if (!catalogs.has(next)) {
        throw new Error(`Unknown locale "${next}"`);
      }
      locale = next;
      notify();
    },
    t: (key, fallback) => {
      const strings = catalogs.get(locale)?.strings;
      return strings?.[key] ?? fallback ?? key;
    },
    tp: (key, count, fallback) => {
      const entry = currentEntry();
      if (!entry) {
        return fallback ?? key;
      }
      return formatPlural(locale, entry, key, count, fallback);
    },
    formatDate: (value, options) => formatDate(locale, value, options),
    formatNumber: (value, options) => formatNumber(locale, value, options),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export { formatDate, formatNumber, formatPlural } from "./format.js";
