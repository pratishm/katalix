# App Runtime

Katalix App Runtime is optional. Katalix Core remains independently usable as a UI definition system with fluent authoring, semantic trees, diagnostics, styling, motion, and React/React Native renderers.

## Current reality

Today, Katalix apps still run as normal React or React Native applications.

Katalix currently handles:

- UI authoring
- semantic UI tree validation
- style normalization
- motion declarations
- diagnostics
- React and React Native rendering

Host apps still supply:

- concrete router bindings
- concrete data fetching clients
- concrete storage implementations
- concrete identity providers
- concrete observability providers
- concrete browser/native modules
- deployment

The optional runtime layer standardizes these app concerns through manifests and adapters without replacing existing ecosystems.

## Architecture

The runtime mirrors the Core architecture:

1. **App/Runtime Authoring DSL** — readable, typed, statement-like APIs.
2. **Normalized Runtime Manifests** — plain objects that are serializable, inspectable, and validation-friendly.
3. **Runtime Adapters** — future bindings over tools such as React Router, TanStack Router, React Navigation, fetch, TanStack Query, IndexedDB, AsyncStorage, Expo, and plain React Native.

Runtime definitions must not be hidden inside UI node internals.

## Implemented runtime scope

`@katalix/app` provides the manifest foundation:

- `App("Name")`
- `.platforms(["web", "native"])`
- `.environment(...)`
- `.providers(...)`
- `.toManifest()`
- `.validate()`
- `.debug()`
- `validateManifest()`
- `printManifest()`

`@katalix/navigation` provides shared route manifests, diagnostics, and dependency-free adapter contracts for React Router, TanStack Router, and React Navigation.

`@katalix/data` provides resource/operation manifests, UI-state semantics, diagnostics, and dependency-free adapter contracts for fetch, TanStack Query, GraphQL, and RPC clients.

`@katalix/storage` provides key-value, secure key-value, document store, cache storage, local SQL, and offline queue manifests with platform-aware adapter diagnostics.

`@katalix/auth` provides session/auth manifests that compose storage, data, and navigation refs without becoming a backend auth provider.

`@katalix/web` provides browser metadata, PWA, rendering, route boundary, browser capability, and security manifests.

`@katalix/native` provides native UX declarations and capability manifests for both Expo and plain React Native targets.

`@katalix/app` includes a bounded observability area for analytics, screen tracking, structured logs, crash providers, performance spans, consent, and privacy controls.

Example:

```ts
import { App } from "@katalix/app";

const manifest = App("Shop")
  .platforms(["web", "native"])
  .environment((env) =>
    env
      .variable("API_URL", { required: true })
      .variable("APP_ENV", { defaultValue: "development" }),
  )
  .providers((providers) =>
    providers.provider("query-client", { adapter: "tanstack-query" }),
  )
  .toManifest();
```

## Diagnostics

Runtime diagnostics use the same Katalix diagnostic philosophy as UI validation:

- structured
- path-aware
- source-aware where possible
- human-readable
- actionable
- specific about invalid fields and values

Current runtime diagnostics include:

- invalid app names
- unsupported platforms
- duplicate provider IDs
- invalid environment keys
- duplicate route IDs, missing screen refs, invalid route params, unsupported router/platform combinations, and missing route adapter capabilities
- missing data base URLs, invalid methods, unsafe mutation config, unhandled auth requirements, and missing error maps
- unavailable storage adapters, insecure secure-storage choices, missing migrations, and missing offline conflict strategies
- unknown auth providers, missing auth storage, invalid guard refs, unsupported refresh strategies, and unsafe platform choices
- unsafe external links, insecure web storage, mixed-content assumptions, unsafe inline HTML, and unsupported web rendering targets
- missing native platform config, missing permissions, unavailable modules, unsupported native UX combinations, and Expo-only features used on plain React Native
- missing observability consent, duplicate event/log IDs, unknown crash providers, and privacy-sensitive events without consent

Scaffolding, generated app CI, and release-readiness automation remain later runtime phases.
