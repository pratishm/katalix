# Lattix

Lattix is a typed declarative definition system for cross-platform UI and optional app runtime concerns. Today, Lattix Core lets you author screens in a readable, statement-like TypeScript style and compiles that into a plain, normalized semantic tree consumed by React and React Native renderers.

## Why Lattix exists

JSX and giant object literals hide structure, make AI-generated UI hard to validate, and couple authoring to a single renderer. Lattix separates **how you write UI** from **what the runtime sees**: expressive authoring on top, boring semantic truth underneath.

## Main wedge and philosophy

- **Fluent statement-style authoring** instead of JSX trees or opaque config objects
- **Renderer-agnostic semantic tree** as the single source of truth
- **Dual styling** (design tokens + raw values) — Phase 4+
- **Declarative motion** attached to nodes — Phase 7+
- **Cross-platform** React and React Native output — Phases 5–6
- **Excellent diagnostics** with paths, fields, and fix suggestions — Phase 3+
- **Optional app runtime manifests** for app config, routing, data, storage, platform capabilities, auth, and observability — Phase 10+

Lattix is not a new programming language, custom React/React Native runtime, mandatory full-stack framework, JSX compiler plugin, or string parser. Optional runtime packages may orchestrate app concerns through manifests and adapters over existing ecosystem tools.

## Key features

| Status | Feature |
|--------|---------|
| ✅ Phase 1 | Normalized `LattixNode` model, actions, baseline validation |
| ✅ Phase 2 | Fluent DSL (`Screen`, `.stack()`, `.text()`, `.toTree()`, …) |
| ✅ Phase 3 | Diagnostics (built-in on every node/tree) |
| ✅ Phase 4 | Tokens + raw styles, normalization, style diagnostics |
| ✅ Phase 5 | Web renderer (`@lattix/react`) |
| ✅ Phase 6 | React Native renderer (`@lattix/react-native`) |
| ✅ Phase 7 | Motion presets (`@lattix/motion`) |
| ✅ Phase 8 | Patterns and advanced motion (`@lattix/patterns`) |
| ✅ Phase 9 | CLI starter scaffolding and release polish (`@lattix/cli`) |
| ✅ Phase 10 | App manifest foundation (`@lattix/app`) |
| ✅ Phase 11 | Navigation manifests and adapter contracts (`@lattix/navigation`) |
| ✅ Phase 12 | Data/API manifests and adapter contracts (`@lattix/data`) |
| ✅ Phase 13 | Storage/offline manifests and adapter contracts (`@lattix/storage`) |
| ✅ Phase 14 | Auth/session manifests and adapter contracts (`@lattix/auth`) |
| ✅ Phase 15 | Mobile layout and native UX declarations (`@lattix/native`) |
| ✅ Phase 16 | Web runtime manifests and security diagnostics (`@lattix/web`) |
| ✅ Phase 17 | Native capability manifests (`@lattix/native`) |
| ✅ Phase 18 | Observability manifests under `@lattix/app` |
| ✅ Phase 19 | Web and mobile app scaffolding (`@lattix/cli`) |
| ✅ Phase 20 | Web/mobile template verification and CI |
| ✅ Phase 21 | Web/mobile release readiness |

## Architecture overview

Lattix Core has three layers — never blurred:

1. **UI Authoring DSL** (`@lattix/dsl`) — fluent chains users write
2. **Semantic UI Tree** (`@lattix/core`) — normalized tree, validation, introspection
3. **UI Renderer Adapters** (`@lattix/react`, `@lattix/react-native`) — consume tree only

The optional App Runtime follows the same shape:

1. **App/Runtime Authoring DSL** — readable definitions for app concerns
2. **Normalized Runtime Manifests** — app, route, auth, data, storage, web/native capability, and observability manifests
3. **Runtime Adapters** — bindings over React Router, TanStack Router, React Navigation, fetch/TanStack Query/GraphQL clients, browser/native storage, Vite, Expo, and plain React Native

Current reality: Lattix apps still run as normal React or React Native apps. Runtime packages now define manifests for app config, navigation, data, storage, auth, web/native capabilities, and observability, while host apps still bind those manifests to real router, network, persistence, identity, browser/native, telemetry, and deployment tooling.

See [docs/architecture.md](./docs/architecture.md).

## Fluent DSL overview

Author UI with `@lattix/dsl` — chains compile to semantic nodes via `.toTree()`:

```ts
import { Screen } from "@lattix/dsl";

const home = Screen("Home", (s) =>
  s.padding(16)
   .stack({ gap: 12 }, (stack) =>
     stack.text("Welcome back").size(28)
          .button("Continue", (btn) => btn.onPress("continue"))
   )
);
```

See [docs/fluent-dsl.md](./docs/fluent-dsl.md).

## Semantic tree overview

Every UI definition resolves to `LattixNode` trees:

```ts
import { createNode, createTree, validateTree, printTree } from "@lattix/core";

const tree = createTree(
  createNode("screen", {
    children: [
      createNode("text", { props: { content: "Hello" } }),
    ],
  }),
);

validateTree(tree);
console.log(printTree(tree));
```

See [docs/semantic-tree.md](./docs/semantic-tree.md).

## Diagnostics and debugging

**Built in by default** — every `toTree()` attaches `tree.validation` and per-node `meta.diagnostics`. Invalid UI fails in strict mode without calling a separate validate API.

```ts
import { Screen } from "@lattix/dsl";
import { printDiagnostics, explainNode } from "@lattix/diagnostics";

const tree = Screen("Home", (s) => s.text("Hello")).toTree();
tree.validation.valid; // true

// Invalid authoring throws immediately (strict default)
// Screen("Bad", (s) => s.text(""));

const report = Screen("Home", (s) => s.text("")).toTree({ mode: "report", throwOnError: false });
console.log(printDiagnostics(report.validation.diagnostics));
```

See [docs/diagnostics.md](./docs/diagnostics.md). Run `npm run example:debug` for intentional failures.

## Styling model: tokens + raw values

Mix token refs and literals — normalization runs automatically on `toTree()`:

```ts
import { Screen } from "@lattix/dsl";

Screen("Card", (s) =>
  s.padding(16).background("surface.canvas").text("Hi").color("text.primary"),
).toTree();

// node.style — authoring
// node.normalizedStyle — { kind: "token" | "literal", ... }
```

See [docs/styling.md](./docs/styling.md). Example: `npm run example:style`.

## Animation model

Animations are semantic data on nodes. Use `.animate()` in the DSL or `motionPreset()` / `customMotion()` from `@lattix/motion`:

```ts
import { Screen } from "@lattix/dsl";

const tree = Screen("Motion", (s) =>
  s.text("Animated").animate("fade-in", { trigger: "mount", duration: 300 }),
).toTree();
```

See [docs/animations.md](./docs/animations.md). Example: `npm run example:motion`.

## Package overview

| Package | Phase | Purpose |
|---------|-------|---------|
| `@lattix/core` | 1 | Semantic nodes, validation contracts |
| `@lattix/dsl` | 2 ✅ | Fluent authoring API |
| `@lattix/diagnostics` | 3 ✅ | Diagnostic formatting and debug tools |
| `@lattix/tokens` | 4 ✅ | Design tokens, normalization, style diagnostics |
| `@lattix/react` | 5 ✅ | Web renderer |
| `@lattix/react-native` | 6 ✅ | Native renderer |
| `@lattix/motion` | 7 ✅ | Animation schema, presets, validation, adapters |
| `@lattix/patterns` | 8 ✅ | Reusable composites and advanced motion helpers |
| `@lattix/cli` | 9/19/20/21 ✅ | Core scaffolding, optional web/mobile templates, template verification, and release readiness config |
| `@lattix/app` | 10 ✅ | Optional app manifest, provider composition, and runtime validation |
| `@lattix/navigation` | 11 ✅ | Route manifests and router adapter contracts |
| `@lattix/data` | 12 ✅ | API/server-state contracts and adapter contracts |
| `@lattix/storage` | 13 ✅ | Persistence/database manifests and adapter contracts |
| `@lattix/auth` | 14 ✅ | Session/auth manifests composing data, storage, and navigation |
| `@lattix/native` | 15/17 ✅ | Native UX and capability contracts |
| `@lattix/web` | 16 ✅ | Browser capability contracts, metadata, PWA, SSR boundaries |
| `@lattix/app` observability area | 18 ✅ | Analytics, logging, crash, performance, and consent manifests |

## Installation

```bash
git clone https://github.com/your-org/lattix.git
cd lattix
npm install
npm run build
```

> Packages are not yet published to npm. Use workspace linking during development.

## Quick start

```bash
npm install
npm run build
npm test
```

```ts
import { Screen } from "@lattix/dsl";

const home = Screen("Home", (s) =>
  s.stack({ gap: 12 }, (stack) =>
    stack
      .text("Welcome back")
      .button("Open", (btn) => btn.onPress("open-details")),
  ),
);

const result = home.validate();
console.log(home.toTree());
```

Factory API (`createNode`, `createTree`) remains available in `@lattix/core` for tests and tooling.

## Fluent example

```ts
import { Screen } from "@lattix/dsl";

export const home = Screen("Home", (s) =>
  s
    .padding(16)
    .background("surface.canvas")
    .stack({ gap: 12 }, (stack) =>
      stack
        .text("Welcome back")
        .size(28)
        .weight("bold")
        .text("Ready to continue")
        .color("text.muted")
        .button("Continue", (btn) => btn.onPress("continue").variant("primary")),
    ),
);

home.validate(); // { valid: true, diagnostics: [] }
home.toTree();   // normalized LattixTree
```

Full sample: [examples/fluent-basic/home.screen.ts](./examples/fluent-basic/home.screen.ts).

## Semantic tree example

See [docs/semantic-tree.md](./docs/semantic-tree.md).

## Web renderer example

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Screen } from "@lattix/dsl";
import { LattixRenderer } from "@lattix/react";

const tree = Screen("Home", (s) =>
  s.padding(16)
   .background("surface.canvas")
   .stack({ gap: 12 }, (stack) =>
     stack
       .text("Welcome back").size(28).weight("bold")
       .button("Continue", (btn) => btn.onPress("continue"))
   )
).toTree();

createRoot(document.getElementById("root")!).render(
  <LattixRenderer
    tree={tree}
    onAction={(action) => console.log("action:", action)}
  />
);
```

See [docs/renderers.md](./docs/renderers.md). Example: `npm run example:web`.

## React Native renderer example

```tsx
import React from "react";
import { Screen } from "@lattix/dsl";
import { LattixNativeRenderer, setRNComponents } from "@lattix/react-native";
import { View, Text, Image, TextInput, Pressable, ScrollView } from "react-native";

// Register RN components once at app startup
setRNComponents({ View, Text, Image, TextInput, Pressable, ScrollView });

const tree = Screen("Home", (s) =>
  s.padding(16)
   .background("surface.canvas")
   .stack({ gap: 12 }, (stack) =>
     stack
       .text("Welcome back").size(28).weight("bold")
       .button("Continue", (btn) => btn.onPress("continue"))
   )
).toTree();

export default function App() {
  return (
    <LattixNativeRenderer
      tree={tree}
      onAction={(action) => console.log("action:", action)}
    />
  );
}
```

See [docs/renderers.md](./docs/renderers.md). Example: `npm run example:native`.

## Patterns example

```ts
import { createNode, createTree } from "@lattix/core";
import { card, section } from "@lattix/patterns";

const tree = createTree(
  createNode("screen", {
    children: [
      section({
        title: "Dashboard",
        children: [
          card({
            title: "Account",
            body: "Review your profile details.",
            action: { label: "Open", onPress: "open-account" },
            animation: { preset: "fade-in", trigger: "mount" },
          }),
        ],
      }),
    ],
  }),
);
```

See [docs/patterns.md](./docs/patterns.md). Example: `npm run example:patterns`.

## CLI starter example

```bash
lattix create my-lattix-app
lattix create web-app --router react-router
lattix create web-app --router tanstack-router
lattix create mobile-app --target expo
lattix create mobile-app --target react-native
```

The CLI scaffolds a minimal Lattix Core starter by default. Phases 19-21 add optional Vite React, Expo, and plain React Native app templates with Lattix screens, runtime manifests, environment files, tests, release profiles, privacy checklists, and package scripts.

See [packages/cli/README.md](./packages/cli/README.md), [docs/cli.md](./docs/cli.md), [docs/web-starter.md](./docs/web-starter.md), [docs/mobile-starter.md](./docs/mobile-starter.md), [docs/web-testing.md](./docs/web-testing.md), [docs/mobile-testing.md](./docs/mobile-testing.md), [docs/web-release.md](./docs/web-release.md), and [docs/mobile-release.md](./docs/mobile-release.md).

## App runtime manifest example

```ts
import { App } from "@lattix/app";

const manifest = App("Shop")
  .platforms(["web", "native"])
  .environment((env) => env.variable("API_URL", { required: true }))
  .providers((providers) =>
    providers.provider("query-client", { adapter: "tanstack-query" }),
  )
  .toManifest();
```

The App Runtime is optional. Phases 10-21 define app, navigation, data, storage, auth, web, native, and observability manifests plus dependency-free adapter contracts, generated app scaffolding, template verification, and release-readiness guidance. Host React and React Native apps still bind those manifests to actual router, network, persistence, identity, browser/native, telemetry, and deployment tooling.

See [docs/app-runtime.md](./docs/app-runtime.md).

## Validation and diagnostics example

```ts
import { Screen } from "@lattix/dsl";
import {
  validateWithDiagnostics,
  printDiagnostics,
  LattixValidationError,
} from "@lattix/diagnostics";

const broken = Screen("Home", (s) => s.text(""));
const result = validateWithDiagnostics(broken.toTree());
console.log(printDiagnostics(result.diagnostics));

try {
  validateWithDiagnostics(broken.toTree(), { mode: "strict" });
} catch (e) {
  if (e instanceof LattixValidationError) {
    console.log(e.diagnostics[0]?.authoring?.builderTrace);
  }
}
```

Playground: [examples/debugging-playground](./examples/debugging-playground).

## Current rollout phase / maturity

**Phase 21 — Web and mobile release readiness** (current)

- ✅ `@lattix/motion` — presets, validation, web/native adapters
- ✅ Fluent `.animate()` authoring on containers and leaves
- ✅ Web renderer applies CSS animation metadata and styles
- ✅ React Native renderer applies initial motion style through the shared adapter
- ✅ `@lattix/patterns` — generic `card`, `emptyState`, and `section` composites
- ✅ `@lattix/cli` — minimal Core starter scaffolding
- ✅ CI runs typecheck, lint, build, and tests
- ✅ Release and contributing docs are available
- ✅ `@lattix/app` — optional app manifest DSL, platform/provider/environment declarations, and runtime validation
- ✅ `@lattix/navigation` — shared route manifest with React Router, TanStack Router, and React Navigation adapter contracts
- ✅ `@lattix/data` — API/server-state resource manifests with fetch, TanStack Query, GraphQL, and RPC adapter contracts
- ✅ `@lattix/storage` — key-value, secure storage, document store, cache, and offline queue manifests with platform diagnostics
- ✅ `@lattix/auth` — auth/session manifests composing storage, data, and navigation contracts
- ✅ `@lattix/native` — native UX declarations and Expo/plain React Native capability manifests
- ✅ `@lattix/web` — browser runtime metadata, PWA, rendering, and security manifests
- ✅ `@lattix/app` observability area — analytics, logs, crash reporting, spans, consent, and privacy manifests
- ✅ `@lattix/cli` — Vite React app templates for React Router and TanStack Router
- ✅ `@lattix/cli` — Expo and plain React Native app templates with runtime manifests
- ✅ `@lattix/cli` — generated-template verification via `npm run test:templates`
- ✅ CI verifies typecheck, lint, build, tests, template generation, and examples
- ✅ Web/mobile testing docs cover Playwright, Maestro, and normal CI boundaries
- ✅ Web/mobile release docs cover hosting, EAS/TestFlight/Play Console, profiles, source maps, privacy, and rollback
- ✅ Generated apps include release profiles and privacy checklist files

Next: release review and post-v1 planning.

## Contributing

1. Read [lattix_master_prompt_v3.md](./lattix_master_prompt_v3.md) for the v4 phase boundaries
2. Keep README.md and handover.md aligned with the current implementation reality
3. Run `npm run typecheck && npm run build && npm test` before opening a PR

Contributing guide: [docs/contributing.md](./docs/contributing.md).

## License

MIT — see [LICENSE](./LICENSE).

## Roadmap

1. ~~Monorepo + semantic core~~
2. ~~Fluent DSL authoring layer~~
3. ~~Diagnostics and validation engine~~
4. ~~Token + raw style system~~
5. ~~Web renderer (`@lattix/react`)~~
6. ~~React Native renderer (`@lattix/react-native`)~~
7. ~~Motion presets~~
8. ~~Patterns and advanced motion~~
9. ~~CLI and release polish~~
10. ~~Optional app manifest foundation~~
11. ~~Optional navigation manifests and adapters~~
12. ~~Optional data/API manifests and adapters~~
13. ~~Optional storage/database/offline manifests~~
14. ~~Optional auth/session manifests~~
15. ~~Mobile layout and native UX primitives~~
16. ~~React web runtime manifests~~
17. ~~Native capability manifests~~
18. ~~Observability, errors, and app health~~
19. ~~Web and mobile app scaffolding~~
20. ~~Web and mobile testing and CI~~
21. ~~Web and mobile release readiness~~
