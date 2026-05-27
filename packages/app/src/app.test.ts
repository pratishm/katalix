import { describe, expect, it } from "vitest";
import {
  App,
  createObservabilityAdapterPlan,
  printManifest,
  validateManifest,
} from "./index.js";

describe("App runtime DSL", () => {
  it("resolves readable app authoring into a normalized manifest", () => {
    const manifest = App("Shop")
      .platforms(["web", "native"])
      .environment((env) =>
        env
          .variable("API_URL", { required: true })
          .variable("APP_ENV", { defaultValue: "development" }),
      )
      .providers((providers) =>
        providers
          .provider("query-client", { adapter: "tanstack-query" })
          .provider("theme", { adapter: "katalix-tokens" }),
      )
      .toManifest();

    expect(manifest.kind).toBe("app");
    expect(manifest.name).toBe("Shop");
    expect(manifest.platforms).toEqual(["web", "native"]);
    expect(manifest.environment?.variables).toEqual([
      { key: "API_URL", required: true },
      { key: "APP_ENV", defaultValue: "development" },
    ]);
    expect(manifest.providers).toEqual([
      { id: "query-client", adapter: "tanstack-query" },
      { id: "theme", adapter: "katalix-tokens" },
    ]);
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.meta.builderTrace).toContain('App("Shop")');
  });

  it("reports duplicate provider IDs with a manifest path", () => {
    const manifest = App("Shop")
      .providers((providers) =>
        providers.provider("query-client").provider("query-client"),
      )
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.valid).toBe(false);
    expect(manifest.validation.diagnostics[0]).toMatchObject({
      code: "KATALIX_DUPLICATE_PROVIDER_ID",
      manifestKind: "app",
      path: "app.providers[1]",
      field: "providers.id",
      received: "query-client",
    });
  });

  it("reports invalid environment keys", () => {
    const manifest = App("Shop")
      .environment((env) => env.variable("api-url"))
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.diagnostics[0]).toMatchObject({
      code: "KATALIX_INVALID_ENVIRONMENT_KEY",
      path: "app.environment.variables[0]",
      field: "environment.variables.key",
      received: "api-url",
    });
  });

  it("reports unsupported platforms", () => {
    const manifest = App("Shop")
      .platforms(["desktop"])
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.diagnostics[0]).toMatchObject({
      code: "KATALIX_UNSUPPORTED_PLATFORM",
      path: "app.platforms[0]",
      field: "platforms",
      received: "desktop",
    });
  });

  it("throws in strict mode for an invalid app name", () => {
    expect(() => App("").toManifest()).toThrow("App name is required");
  });

  it("declares bounded observability manifests under app runtime", () => {
    const manifest = App("Shop")
      .observability((observability) =>
        observability
          .consent("analytics", { required: true })
          .analytics("checkout-started", { consent: "analytics", pii: false })
          .screenTracking("home")
          .log("cart-updated", { level: "info" })
          .crash("sentry", { provider: "sentry" })
          .span("checkout", { consent: "analytics" })
          .webVitals()
          .nativePerformance()
          .privacy({ policyUrl: "/privacy" }),
      )
      .toManifest();

    expect(manifest.observability).toEqual({
      consent: [{ category: "analytics", required: true }],
      analyticsEvents: [{ id: "checkout-started", consent: "analytics", pii: false }],
      screenTracking: [{ screenRef: "home" }],
      logs: [{ id: "cart-updated", level: "info" }],
      crashReporting: [{ id: "sentry", provider: "sentry" }],
      performanceSpans: [{ id: "checkout", consent: "analytics" }],
      webVitals: true,
      nativePerformance: true,
      privacy: { policyUrl: "/privacy" },
    });
    expect(manifest.validation.valid).toBe(true);
  });

  it("projects observability declarations into dependency-free adapter plans", () => {
    const manifest = App("Shop")
      .observability((observability) =>
        observability
          .consent("analytics")
          .analytics("checkout-started", { consent: "analytics" })
          .crash("sentry", { provider: "sentry" })
          .span("checkout", { consent: "analytics" }),
      )
      .toManifest();

    expect(createObservabilityAdapterPlan(manifest)).toEqual({
      providers: ["sentry"],
      analyticsEvents: ["checkout-started"],
      performanceSpans: ["checkout"],
      consentCategories: ["analytics"],
    });
  });

  it("reports observability consent gaps, duplicates, unknown providers, and privacy-sensitive events", () => {
    const manifest = App("Shop")
      .observability((observability) =>
        observability
          .analytics("checkout-started", { pii: true })
          .analytics("checkout-started")
          .log("cart-updated", { level: "info" })
          .log("cart-updated", { level: "debug" })
          .crash("rollbar", { provider: "rollbar" })
          .span("checkout")
          .span("checkout"),
      )
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "KATALIX_OBSERVABILITY_MISSING_CONSENT",
          path: "app.observability.analyticsEvents[0].consent",
        }),
        expect.objectContaining({
          code: "KATALIX_OBSERVABILITY_PRIVACY_CONSENT_REQUIRED",
          path: "app.observability.analyticsEvents[0].consent",
        }),
        expect.objectContaining({
          code: "KATALIX_DUPLICATE_OBSERVABILITY_EVENT_ID",
          path: "app.observability.analyticsEvents[1]",
          received: "checkout-started",
        }),
        expect.objectContaining({
          code: "KATALIX_DUPLICATE_OBSERVABILITY_LOG_ID",
          path: "app.observability.logs[1]",
          received: "cart-updated",
        }),
        expect.objectContaining({
          code: "KATALIX_UNKNOWN_OBSERVABILITY_PROVIDER",
          path: "app.observability.crashReporting[0].provider",
          received: "rollbar",
        }),
        expect.objectContaining({
          code: "KATALIX_OBSERVABILITY_MISSING_CONSENT",
          path: "app.observability.performanceSpans[0].consent",
        }),
        expect.objectContaining({
          code: "KATALIX_DUPLICATE_OBSERVABILITY_SPAN_ID",
          path: "app.observability.performanceSpans[1]",
          received: "checkout",
        }),
      ]),
    );
  });
});

describe("manifest utilities", () => {
  it("validates and prints manifests without fluent builder state", () => {
    const manifest = App("Shop").platforms(["web"]).toManifest();

    expect(validateManifest(manifest).valid).toBe(true);
    expect(printManifest(manifest)).toContain("app name=Shop");
    expect("state" in manifest).toBe(false);
  });
});
