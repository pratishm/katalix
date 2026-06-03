import type { KatalixLocaleManifest, PluralCategory } from "@katalix/i18n";

const fallbackPluralCategory = (count: number): PluralCategory => {
  if (count === 0) {
    return "zero";
  }
  if (count === 1) {
    return "one";
  }
  if (count === 2) {
    return "two";
  }
  return "other";
};

/** CLDR plural category via Intl.PluralRules (GAP-I18N-002). */
export const selectPluralCategory = (locale: string, count: number): PluralCategory => {
  if (typeof Intl === "undefined" || !("PluralRules" in Intl)) {
    return fallbackPluralCategory(count);
  }
  try {
    const rules = new Intl.PluralRules(locale);
    return rules.select(count) as PluralCategory;
  } catch {
    return fallbackPluralCategory(count);
  }
};

const interpolate = (template: string, count: number): string =>
  template.replace(/\{count\}/g, String(count));

/** Resolve plural form for a locale entry (GAP-I18N-002). */
export const formatPlural = (
  locale: string,
  entry: KatalixLocaleManifest,
  key: string,
  count: number,
  fallback?: string,
): string => {
  const forms = entry.plurals?.[key];
  if (!forms) {
    return fallback ?? key;
  }
  const category = selectPluralCategory(locale, count);
  const template =
    forms[category] ?? forms.other ?? forms.one ?? Object.values(forms)[0];
  if (!template) {
    return fallback ?? key;
  }
  return interpolate(template, count);
};

export const formatDate = (
  locale: string,
  value: Date | number | string,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatNumber = (
  locale: string,
  value: number,
  options: Intl.NumberFormatOptions = {},
): string => new Intl.NumberFormat(locale, options).format(value);
