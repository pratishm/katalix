import type { KatalixDiagnostic, ValidationMode, ValidationResult } from "@katalix/core";

export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

export interface KatalixLocaleManifest {
  readonly locale: string;
  readonly rtl?: boolean;
  readonly strings: Readonly<Record<string, string>>;
  readonly plurals?: Readonly<Record<string, Readonly<Partial<Record<PluralCategory, string>>>>>;
}

export interface KatalixI18nManifest {
  readonly kind: "i18n";
  readonly name: string;
  readonly defaultLocale: string;
  readonly locales: readonly KatalixLocaleManifest[];
  readonly validation: ValidationResult;
}

export interface ToI18nManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
}

interface I18nBuilderState {
  readonly name: string;
  readonly defaultLocale: string;
  readonly locales: readonly KatalixLocaleManifest[];
  readonly builderTrace: readonly string[];
}

const runtimeDiagnostic = (
  diagnostic: Omit<KatalixDiagnostic, "manifestKind">,
): KatalixDiagnostic => ({
  manifestKind: "i18n",
  ...diagnostic,
});

export const validateI18nManifest = (manifest: KatalixI18nManifest): ValidationResult => {
  const diagnostics: KatalixDiagnostic[] = [];
  const localeIds = new Set<string>();

  if (manifest.locales.length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_I18N_NO_LOCALES",
        summary: "No locales declared",
        message: "I18n manifest must declare at least one locale.",
        path: "i18n.locales",
        field: "locales",
        received: [],
        expected: "one or more locale entries",
        suggestion: 'Call .locale("en", (l) => l.string("key", "value")).',
      }),
    );
  }

  for (const entry of manifest.locales) {
    if (localeIds.has(entry.locale)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_I18N_DUPLICATE_LOCALE",
          summary: "Duplicate locale",
          message: `Locale "${entry.locale}" is declared more than once.`,
          path: "i18n.locales",
          field: "locale",
          received: entry.locale,
          expected: "unique locale code",
          suggestion: "Remove duplicate locale declarations.",
        }),
      );
    }
    localeIds.add(entry.locale);
  }

  if (!localeIds.has(manifest.defaultLocale)) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_I18N_MISSING_DEFAULT",
        summary: "Default locale not defined",
        message: `Default locale "${manifest.defaultLocale}" is not in locales.`,
        path: "i18n.defaultLocale",
        field: "defaultLocale",
        received: manifest.defaultLocale,
        expected: "a declared locale code",
        suggestion: "Add the default locale or change defaultLocale().",
      }),
    );
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

class LocaleBuilder {
  private strings: Record<string, string> = {};
  private plurals: Record<string, Partial<Record<PluralCategory, string>>> = {};

  constructor(
    private readonly locale: string,
    private readonly rtl = false,
  ) {}

  string(key: string, value: string): this {
    this.strings[key] = value;
    return this;
  }

  plural(key: string, forms: Partial<Record<PluralCategory, string>>): this {
    this.plurals[key] = { ...forms };
    return this;
  }

  toEntry(): KatalixLocaleManifest {
    const entry: KatalixLocaleManifest = {
      locale: this.locale,
      ...(this.rtl ? { rtl: true } : {}),
      strings: { ...this.strings },
    };
    if (Object.keys(this.plurals).length > 0) {
      return { ...entry, plurals: { ...this.plurals } };
    }
    return entry;
  }
}

export class I18nBuilder {
  private state: I18nBuilderState;

  private constructor(name: string, defaultLocale: string) {
    this.state = {
      name,
      defaultLocale,
      locales: [],
      builderTrace: [`I18n(${JSON.stringify(name)})`],
    };
  }

  static create(name: string, defaultLocale = "en"): I18nBuilder {
    return new I18nBuilder(name, defaultLocale);
  }

  defaultLocale(locale: string): this {
    this.state = {
      ...this.state,
      defaultLocale: locale,
      builderTrace: [...this.state.builderTrace, `defaultLocale(${locale})`],
    };
    return this;
  }

  locale(locale: string, configure: (builder: LocaleBuilder) => void, rtl = false): this {
    const builder = new LocaleBuilder(locale, rtl);
    configure(builder);
    this.state = {
      ...this.state,
      locales: [...this.state.locales, builder.toEntry()],
      builderTrace: [...this.state.builderTrace, `locale(${locale})`],
    };
    return this;
  }

  toManifest(options: ToI18nManifestOptions = {}): KatalixI18nManifest {
    const manifest: KatalixI18nManifest = {
      kind: "i18n",
      name: this.state.name,
      defaultLocale: this.state.defaultLocale,
      locales: this.state.locales,
      validation: { valid: true, diagnostics: [] },
    };
    const validation = validateI18nManifest(manifest);
    if (options.throwOnError !== false && !validation.valid) {
      throw new Error(validation.diagnostics[0]?.summary ?? "I18n manifest invalid");
    }
    return { ...manifest, validation };
  }
}

/** Fluent entry for i18n manifests (GAP-I18N-001). */
export const I18n = (name: string, defaultLocale = "en"): I18nBuilder =>
  I18nBuilder.create(name, defaultLocale);
