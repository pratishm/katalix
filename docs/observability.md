# Observability Manifests

Lattix keeps observability as a bounded area inside `@lattix/app`. There is no separate `@lattix/observability` package in the initial runtime plan.

## Authoring

```ts
import { App } from "@lattix/app";

const app = App("Shop")
  .observability((observability) =>
    observability
      .consent("analytics", { required: true })
      .analytics("checkout-started", { consent: "analytics" })
      .screenTracking("home")
      .log("cart-updated", { level: "info" })
      .crash("sentry", { provider: "sentry" })
      .span("checkout", { consent: "analytics" })
      .webVitals()
      .nativePerformance()
      .privacy({ policyUrl: "/privacy" }),
  )
  .toManifest();
```

## Scope

Observability declarations include analytics events, screen tracking, structured app logs, crash reporting providers, performance spans, web vitals, native performance, user consent, and privacy controls.

Adapters are dependency-free contract objects. Host apps bind them to Sentry, Bugsnag, analytics providers, or custom loggers.

## Diagnostics

Diagnostics cover missing consent categories, duplicate event/log IDs, unknown crash providers, and privacy-sensitive analytics events without consent.
