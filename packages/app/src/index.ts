import type {
  LattixDiagnostic,
  LattixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@lattix/core";

export type LattixPlatform = "web" | "native";

export interface LattixEnvironmentVariable {
  readonly key: string;
  readonly required?: boolean;
  readonly defaultValue?: string;
}

export interface LattixEnvironmentManifest {
  readonly variables: readonly LattixEnvironmentVariable[];
}

export interface LattixProviderManifest {
  readonly id: string;
  readonly adapter?: string;
}

export interface LattixObservabilityConsent {
  readonly category: string;
  readonly required?: boolean;
}

export interface LattixAnalyticsEventManifest {
  readonly id: string;
  readonly consent?: string;
  readonly pii?: boolean;
}

export interface LattixScreenTrackingManifest {
  readonly screenRef: string;
}

export interface LattixLogManifest {
  readonly id: string;
  readonly level: "debug" | "info" | "warn" | "error";
}

export interface LattixCrashReportingManifest {
  readonly id: string;
  readonly provider: string;
}

export interface LattixPerformanceSpanManifest {
  readonly id: string;
  readonly consent?: string;
}

export interface LattixPrivacyManifest {
  readonly policyUrl: string;
}

export interface LattixObservabilityManifest {
  readonly consent: readonly LattixObservabilityConsent[];
  readonly analyticsEvents: readonly LattixAnalyticsEventManifest[];
  readonly screenTracking: readonly LattixScreenTrackingManifest[];
  readonly logs: readonly LattixLogManifest[];
  readonly crashReporting: readonly LattixCrashReportingManifest[];
  readonly performanceSpans: readonly LattixPerformanceSpanManifest[];
  readonly webVitals: boolean;
  readonly nativePerformance: boolean;
  readonly privacy?: LattixPrivacyManifest;
}

export interface ObservabilityAdapterPlan {
  readonly providers: readonly string[];
  readonly analyticsEvents: readonly string[];
  readonly performanceSpans: readonly string[];
  readonly consentCategories: readonly string[];
}

export interface LattixManifestMeta {
  readonly source?: LattixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface LattixAppManifest {
  readonly kind: "app";
  readonly name: string;
  readonly platforms: readonly string[];
  readonly environment?: LattixEnvironmentManifest;
  readonly providers: readonly LattixProviderManifest[];
  readonly observability?: LattixObservabilityManifest;
  readonly meta: LattixManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
}

interface AppBuilderState {
  readonly name: string;
  readonly platforms: readonly string[];
  readonly providers: readonly LattixProviderManifest[];
  readonly environmentVariables: readonly LattixEnvironmentVariable[];
  readonly observability?: LattixObservabilityManifest;
  readonly builderTrace: readonly string[];
}

const SUPPORTED_PLATFORMS = new Set(["web", "native"]);
const ENVIRONMENT_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const OBSERVABILITY_PROVIDERS = new Set(["sentry", "bugsnag", "custom"]);

const runtimeDiagnostic = (
  diagnostic: Omit<LattixDiagnostic, "manifestKind">,
): LattixDiagnostic => ({
  manifestKind: "app",
  ...diagnostic,
});

export class LattixAppValidationError extends Error {
  readonly diagnostics: readonly LattixDiagnostic[];

  constructor(diagnostics: readonly LattixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Lattix app manifest validation failed.");
    this.name = "LattixAppValidationError";
    this.diagnostics = diagnostics;
  }
}

export const validateManifest = (manifest: LattixAppManifest): ValidationResult => {
  const diagnostics: LattixDiagnostic[] = [];

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "LATTIX_INVALID_APP_NAME",
        message: "App name is required.",
        summary: "App name is required.",
        path: "app.name",
        field: "name",
        received: manifest.name,
        expected: "A non-empty app name.",
        suggestion: 'Pass a non-empty name to App("Name").',
      }),
    );
  }

  manifest.platforms.forEach((platform, index) => {
    if (!SUPPORTED_PLATFORMS.has(platform)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_UNSUPPORTED_PLATFORM",
          message: `Unsupported platform "${platform}".`,
          summary: `Platform "${platform}" is not supported by Lattix App Runtime.`,
          path: `app.platforms[${index}]`,
          field: "platforms",
          received: platform,
          expected: '"web" or "native".',
          suggestion: 'Use platforms(["web"]), platforms(["native"]), or platforms(["web", "native"]).',
        }),
      );
    }
  });

  const providerIds = new Set<string>();
  manifest.providers.forEach((provider, index) => {
    if (providerIds.has(provider.id)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_DUPLICATE_PROVIDER_ID",
          message: `Duplicate provider id "${provider.id}".`,
          summary: `Provider id "${provider.id}" is declared more than once.`,
          path: `app.providers[${index}]`,
          field: "providers.id",
          received: provider.id,
          expected: "A unique provider id.",
          suggestion: "Use a unique provider id or remove the duplicate provider declaration.",
        }),
      );
    }

    providerIds.add(provider.id);
  });

  manifest.environment?.variables.forEach((variable, index) => {
    if (!ENVIRONMENT_KEY_PATTERN.test(variable.key)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "LATTIX_INVALID_ENVIRONMENT_KEY",
          message: `Invalid environment key "${variable.key}".`,
          summary: `Environment key "${variable.key}" must be uppercase snake case.`,
          path: `app.environment.variables[${index}]`,
          field: "environment.variables.key",
          received: variable.key,
          expected: "Uppercase snake case, for example API_URL.",
          suggestion: "Rename the environment key to uppercase snake case.",
        }),
      );
    }
  });

  const observability = manifest.observability;
  if (observability) {
    const consentCategories = new Set(observability.consent.map((item) => item.category));
    const eventIds = new Set<string>();
    observability.analyticsEvents.forEach((event, index) => {
      if (eventIds.has(event.id)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_DUPLICATE_OBSERVABILITY_EVENT_ID",
            message: `Duplicate observability event id "${event.id}".`,
            summary: "Observability event IDs must be unique.",
            path: `app.observability.analyticsEvents[${index}]`,
            field: "observability.analyticsEvents.id",
            received: event.id,
            expected: "A unique analytics event id.",
            suggestion: "Use a unique event id or remove the duplicate event.",
          }),
        );
      }
      eventIds.add(event.id);

      if (!event.consent || !consentCategories.has(event.consent)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_OBSERVABILITY_MISSING_CONSENT",
            message: `Analytics event "${event.id}" is missing a declared consent category.`,
            summary: "Analytics events should reference declared consent categories.",
            path: `app.observability.analyticsEvents[${index}].consent`,
            field: "observability.analyticsEvents.consent",
            received: event.consent,
            expected: "A declared consent category.",
            suggestion: "Declare consent() and reference it from analytics().",
          }),
        );
      }

      if (event.pii && !event.consent) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_OBSERVABILITY_PRIVACY_CONSENT_REQUIRED",
            message: `Analytics event "${event.id}" is marked PII without consent.`,
            summary: "Privacy-sensitive analytics must reference a consent category.",
            path: `app.observability.analyticsEvents[${index}].consent`,
            field: "observability.analyticsEvents.consent",
            received: event.consent,
            expected: "A consent category for PII events.",
            suggestion: "Add a consent category to privacy-sensitive analytics events.",
          }),
        );
      }
    });

    const logIds = new Set<string>();
    observability.logs.forEach((log, index) => {
      if (logIds.has(log.id)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_DUPLICATE_OBSERVABILITY_LOG_ID",
            message: `Duplicate observability log id "${log.id}".`,
            summary: "Structured log IDs must be unique.",
            path: `app.observability.logs[${index}]`,
            field: "observability.logs.id",
            received: log.id,
            expected: "A unique log id.",
            suggestion: "Use a unique log id or remove the duplicate log declaration.",
          }),
        );
      }
      logIds.add(log.id);
    });

    observability.crashReporting.forEach((crash, index) => {
      if (!OBSERVABILITY_PROVIDERS.has(crash.provider)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_UNKNOWN_OBSERVABILITY_PROVIDER",
            message: `Unknown observability provider "${crash.provider}".`,
            summary: "Crash reporting providers must be known adapter targets.",
            path: `app.observability.crashReporting[${index}].provider`,
            field: "observability.crashReporting.provider",
            received: crash.provider,
            expected: "sentry, bugsnag, or custom.",
            suggestion: 'Use "custom" for host-defined observability providers.',
          }),
        );
      }
    });

    const spanIds = new Set<string>();
    observability.performanceSpans.forEach((span, index) => {
      if (spanIds.has(span.id)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_DUPLICATE_OBSERVABILITY_SPAN_ID",
            message: `Duplicate observability span id "${span.id}".`,
            summary: "Performance span IDs must be unique.",
            path: `app.observability.performanceSpans[${index}]`,
            field: "observability.performanceSpans.id",
            received: span.id,
            expected: "A unique performance span id.",
            suggestion: "Use a unique span id or remove the duplicate span declaration.",
          }),
        );
      }
      spanIds.add(span.id);

      if (!span.consent || !consentCategories.has(span.consent)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "LATTIX_OBSERVABILITY_MISSING_CONSENT",
            message: `Performance span "${span.id}" is missing a declared consent category.`,
            summary: "Performance spans should reference declared consent categories.",
            path: `app.observability.performanceSpans[${index}].consent`,
            field: "observability.performanceSpans.consent",
            received: span.consent,
            expected: "A declared consent category.",
            suggestion: "Declare consent() and reference it from span().",
          }),
        );
      }
    });
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

const withValidation = (
  manifest: Omit<LattixAppManifest, "validation">,
  options: ToManifestOptions = {},
): LattixAppManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies LattixAppManifest;
  const validation = validateManifest(completeManifest);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new LattixAppValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

export class LattixEnvironmentBuilder {
  private readonly variables: LattixEnvironmentVariable[] = [];

  variable(
    key: string,
    options: Omit<LattixEnvironmentVariable, "key"> = {},
  ): this {
    this.variables.push({ key, ...options });
    return this;
  }

  toManifest(): LattixEnvironmentManifest {
    return { variables: [...this.variables] };
  }
}

export class LattixProvidersBuilder {
  private readonly providers: LattixProviderManifest[] = [];

  provider(id: string, options: Omit<LattixProviderManifest, "id"> = {}): this {
    this.providers.push({ id, ...options });
    return this;
  }

  toManifest(): readonly LattixProviderManifest[] {
    return [...this.providers];
  }
}

export class LattixObservabilityBuilder {
  private readonly consentItems: LattixObservabilityConsent[] = [];
  private readonly analyticsEvents: LattixAnalyticsEventManifest[] = [];
  private readonly screenTrackingItems: LattixScreenTrackingManifest[] = [];
  private readonly logItems: LattixLogManifest[] = [];
  private readonly crashItems: LattixCrashReportingManifest[] = [];
  private readonly spanItems: LattixPerformanceSpanManifest[] = [];
  private webVitalsEnabled = false;
  private nativePerformanceEnabled = false;
  private privacyManifest: LattixPrivacyManifest | undefined;

  consent(category: string, options: Omit<LattixObservabilityConsent, "category"> = {}): this {
    this.consentItems.push({ category, ...options });
    return this;
  }

  analytics(id: string, options: Omit<LattixAnalyticsEventManifest, "id"> = {}): this {
    this.analyticsEvents.push({ id, ...options });
    return this;
  }

  screenTracking(screenRef: string): this {
    this.screenTrackingItems.push({ screenRef });
    return this;
  }

  log(id: string, options: Omit<LattixLogManifest, "id">): this {
    this.logItems.push({ id, ...options });
    return this;
  }

  crash(id: string, options: Omit<LattixCrashReportingManifest, "id">): this {
    this.crashItems.push({ id, ...options });
    return this;
  }

  span(id: string, options: Omit<LattixPerformanceSpanManifest, "id"> = {}): this {
    this.spanItems.push({ id, ...options });
    return this;
  }

  webVitals(): this {
    this.webVitalsEnabled = true;
    return this;
  }

  nativePerformance(): this {
    this.nativePerformanceEnabled = true;
    return this;
  }

  privacy(privacy: LattixPrivacyManifest): this {
    this.privacyManifest = privacy;
    return this;
  }

  toManifest(): LattixObservabilityManifest {
    return {
      consent: [...this.consentItems],
      analyticsEvents: [...this.analyticsEvents],
      screenTracking: [...this.screenTrackingItems],
      logs: [...this.logItems],
      crashReporting: [...this.crashItems],
      performanceSpans: [...this.spanItems],
      webVitals: this.webVitalsEnabled,
      nativePerformance: this.nativePerformanceEnabled,
      ...(this.privacyManifest ? { privacy: this.privacyManifest } : {}),
    };
  }
}

export class LattixAppBuilder {
  private state: AppBuilderState;

  constructor(name: string) {
    this.state = {
      name,
      platforms: [],
      providers: [],
      environmentVariables: [],
      builderTrace: [`App("${name}")`],
    };
  }

  platforms(platforms: readonly string[]): this {
    this.state = {
      ...this.state,
      platforms: [...platforms],
      builderTrace: [...this.state.builderTrace, "platforms"],
    };
    return this;
  }

  providers(author: (providers: LattixProvidersBuilder) => LattixProvidersBuilder): this {
    const builder = author(new LattixProvidersBuilder());
    this.state = {
      ...this.state,
      providers: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "providers"],
    };
    return this;
  }

  environment(
    author: (environment: LattixEnvironmentBuilder) => LattixEnvironmentBuilder,
  ): this {
    const builder = author(new LattixEnvironmentBuilder());
    this.state = {
      ...this.state,
      environmentVariables: builder.toManifest().variables,
      builderTrace: [...this.state.builderTrace, "environment"],
    };
    return this;
  }

  observability(
    author: (observability: LattixObservabilityBuilder) => LattixObservabilityBuilder,
  ): this {
    const builder = author(new LattixObservabilityBuilder());
    this.state = {
      ...this.state,
      observability: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "observability"],
    };
    return this;
  }

  toManifest(options?: ToManifestOptions): LattixAppManifest {
    const environment =
      this.state.environmentVariables.length > 0
        ? { variables: [...this.state.environmentVariables] }
        : undefined;

    return withValidation(
      {
        kind: "app",
        name: this.state.name,
        platforms: this.state.platforms.length > 0 ? [...this.state.platforms] : ["web"],
        providers: [...this.state.providers],
        ...(environment ? { environment } : {}),
        ...(this.state.observability ? { observability: this.state.observability } : {}),
        meta: {
          path: "app",
          builderTrace: [...this.state.builderTrace],
        },
      },
      options,
    );
  }

  validate(options?: ToManifestOptions): ValidationResult {
    return this.toManifest({ ...options, throwOnError: false }).validation;
  }

  debug(options?: ToManifestOptions) {
    const manifest = this.toManifest({ ...options, throwOnError: false });
    return {
      manifest,
      validation: manifest.validation,
      printed: printManifest(manifest),
    };
  }
}

export const App = (name: string) => new LattixAppBuilder(name);

export const printManifest = (manifest: LattixAppManifest) => {
  const lines = [
    `app name=${manifest.name} platforms=${manifest.platforms.join(",")}`,
  ];

  if (manifest.environment) {
    lines.push("  environment");
    for (const variable of manifest.environment.variables) {
      lines.push(`    variable key=${variable.key}`);
    }
  }

  if (manifest.providers.length > 0) {
    lines.push("  providers");
    for (const provider of manifest.providers) {
      lines.push(`    provider id=${provider.id}`);
    }
  }

  if (manifest.observability) {
    lines.push("  observability");
    for (const event of manifest.observability.analyticsEvents) {
      lines.push(`    analytics id=${event.id}`);
    }
  }

  return lines.join("\n");
};

export const createObservabilityAdapterPlan = (
  manifest: LattixAppManifest,
): ObservabilityAdapterPlan => ({
  providers: manifest.observability?.crashReporting.map((crash) => crash.provider) ?? [],
  analyticsEvents: manifest.observability?.analyticsEvents.map((event) => event.id) ?? [],
  performanceSpans: manifest.observability?.performanceSpans.map((span) => span.id) ?? [],
  consentCategories: manifest.observability?.consent.map((item) => item.category) ?? [],
});
