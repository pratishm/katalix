# Katalix architecture

Katalix Core is built in **three explicit layers**. Each layer has a single responsibility; boundaries must not blur.

The optional Katalix App Runtime follows the same architecture shape in parallel: authoring DSL, normalized manifests, and adapters over existing ecosystem tools. Core remains independently usable without runtime packages.

## Katalix Core

### Layer A: UI Authoring DSL (`@katalix/dsl` — Phase 2 ✅)

The fluent, statement-like TypeScript API developers write. It feels expressive and chainable but is **not** the runtime model. See [fluent-dsl.md](./fluent-dsl.md).

### Layer B: Semantic UI Tree (`@katalix/core`)

The normalized semantic tree is the **source of truth**. Every fluent definition must resolve into `KatalixNode` trees that are:

- Serializable and inspectable
- Fully typed
- Independent of fluent syntax
- Suitable for validation and renderer consumption

### Node shape

```ts
interface KatalixNode {
  kind: string;
  id?: string;
  debugLabel?: string;
  props: Record<string, unknown>;
  style?: KatalixStyle;
  animation?: KatalixAnimation | KatalixAnimation[];
  children?: KatalixNode[];
  meta?: { source?, path?, builderTrace? };
}
```

Semantic nodes **never** store fluent chain internals.

### Validation

`@katalix/core` ships base validators. `@katalix/diagnostics` (Phase 3 ✅) adds:

- Enriched diagnostics with authoring context (builder trace, debug labels, source)
- `validateWithDiagnostics` with `strict` / `report` / `tolerant` modes
- `explainNode`, enhanced `printTree`, formatted output

See [diagnostics.md](./diagnostics.md).

### Layer C: UI Renderer Adapters (`@katalix/react`, `@katalix/react-native` — Phase 5+)

Renderers consume **only** the normalized tree. They must not depend on partially-built chain state.

## Optional App Runtime

The App Runtime is a post-Core expansion. It should standardize app/runtime definitions without turning Katalix into a monolithic framework or custom runtime engine.

### Layer D: App/Runtime Authoring DSL

Readable, typed, statement-like app definitions for concerns such as routes, auth, data, storage, platform capabilities, observability, and scaffolding.

### Layer E: Normalized Runtime Manifests

Plain serializable manifests such as app, route, auth, data, storage, web capability, native capability, and observability manifests. These manifests are inspectable, validation-friendly, and independent of fluent builder state.

### Layer F: Runtime Adapters

Adapters bind manifests to existing tools such as React Router, TanStack Router, React Navigation, `fetch`, TanStack Query, GraphQL clients, browser/native storage, Vite, Expo, and plain React Native. React Router and TanStack Router are both first-class web targets over one shared route manifest. Expo and plain React Native are both first-class native targets. Unsupported platform, router, target, or adapter combinations should produce structured diagnostics.

## Data flow

```
Authoring DSL  →  normalize  →  KatalixNode tree  →  validate  →  renderer
```

Runtime flow:

```
App DSL  →  normalize  →  runtime manifests  →  validate  →  adapters
```

## Current scope (Phase 21)

- `@katalix/core`, `@katalix/dsl`, `@katalix/diagnostics`, `@katalix/tokens`
- Styles normalize to `normalizedStyle` with token/literal discrimination
- Built-in style diagnostics on every `toTree()`
- `@katalix/react` and `@katalix/react-native` render normalized semantic trees
- `@katalix/motion` defines shared motion presets, validation, and web/native adapters
- `@katalix/patterns` provides generic reusable composites built from primitives
- `@katalix/cli` scaffolds a minimal Katalix Core starter project plus optional Vite React, Expo, and plain React Native app templates
- `npm run test:templates` verifies generated web/mobile starter contents without requiring native services
- Generated app templates include release profile config, privacy checklists, and store/static hosting metadata placeholders
- `@katalix/app` defines optional app manifests for platform, provider, and environment declarations
- `@katalix/navigation` defines shared route manifests and adapter contracts for React Router, TanStack Router, and React Navigation
- `@katalix/data` defines API/server-state manifests and adapter contracts for fetch, TanStack Query, GraphQL, and RPC bindings
- `@katalix/storage` defines storage, database, and offline manifests with web/native adapter planning
- `@katalix/auth` defines auth/session manifests composing navigation, data, and storage refs
- `@katalix/web` defines browser metadata, PWA, rendering, route-boundary, browser capability, and security manifests
- `@katalix/native` defines native UX and capability manifests for Expo and plain React Native targets
- `@katalix/app` contains the bounded observability manifest area
- Generated host React and React Native apps bind runtime manifests to concrete router, network, persistence, identity, browser/native module, observability, testing, and deployment tooling

See [semantic-tree.md](./semantic-tree.md), [fluent-dsl.md](./fluent-dsl.md), [diagnostics.md](./diagnostics.md), [styling.md](./styling.md), [animations.md](./animations.md), [patterns.md](./patterns.md), [renderers.md](./renderers.md), [app-runtime.md](./app-runtime.md), [navigation.md](./navigation.md), [data.md](./data.md), [storage.md](./storage.md), [auth.md](./auth.md), [web-runtime.md](./web-runtime.md), [native.md](./native.md), [observability.md](./observability.md), [cli.md](./cli.md), [web-starter.md](./web-starter.md), [mobile-starter.md](./mobile-starter.md), [web-testing.md](./web-testing.md), [mobile-testing.md](./mobile-testing.md), [web-release.md](./web-release.md), [mobile-release.md](./mobile-release.md), and [privacy-checklist.md](./privacy-checklist.md).
