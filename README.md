# Lattix

Lattix is a typed declarative definition system for cross-platform UI and optional app runtime concerns. Today, Lattix Core lets you author screens in a readable, statement-like TypeScript style and compiles that into a plain, normalized semantic tree consumed by React and React Native renderers.

## Why Lattix exists

JSX and giant object literals hide structure, make AI-generated UI hard to validate, and couple authoring to a single renderer. Lattix separates **how you write UI** from **what the runtime sees**: expressive authoring on top, boring semantic truth underneath.

## Main wedge and philosophy

- **Fluent statement-style authoring** instead of JSX trees or opaque config objects
- **Renderer-agnostic semantic tree** as the single source of truth
- **Dual styling** with design tokens and raw values
- **Declarative motion** attached to nodes
- **Cross-platform** React and React Native output
- **Excellent diagnostics** with paths, fields, and fix suggestions
- **Optional app runtime manifests** for app config, routing, data, storage, platform capabilities, auth, and observability

Lattix is not a new programming language, custom React/React Native runtime, mandatory full-stack framework, JSX compiler plugin, or string parser. Optional runtime packages may orchestrate app concerns through manifests and adapters over existing ecosystem tools.

## Key features

- Normalized `LattixNode` model, actions, baseline validation
- Fluent DSL (`Screen`, `.stack()`, `.text()`, `.toTree()`, …)
- Diagnostics built into every node and tree
- Tokens + raw styles, normalization, style diagnostics
- Web renderer (`@lattix/react`)
- React Native renderer (`@lattix/react-native`)
- Motion presets (`@lattix/motion`)
- Patterns and advanced motion (`@lattix/patterns`)
- CLI starter scaffolding and release polish (`@lattix/cli`)
- App manifest foundation (`@lattix/app`)
- Navigation manifests and adapter contracts (`@lattix/navigation`)
- Data/API manifests and adapter contracts (`@lattix/data`)
- Storage/offline manifests and adapter contracts (`@lattix/storage`)
- Auth/session manifests and adapter contracts (`@lattix/auth`)
- Mobile layout and native UX declarations (`@lattix/native`)
- Web runtime manifests and security diagnostics (`@lattix/web`)
- Native capability manifests (`@lattix/native`)
- Observability manifests under `@lattix/app`
- Web and mobile app scaffolding (`@lattix/cli`)
- Web/mobile template verification and CI
- Web/mobile release readiness

## Build an app with Lattix

Install Lattix from npm:

```bash
npm install lattix
```

Use the CLI to start from the shape of app you want:

```bash
npx lattix create my-lattix-app
npx lattix create web-app --router react-router
npx lattix create web-app --router tanstack-router
npx lattix create mobile-app --target expo
npx lattix create mobile-app --target react-native
```

The `lattix` package installs the mandatory framework packages: `@lattix/core`, `@lattix/dsl`, `@lattix/diagnostics`, `@lattix/tokens`, `@lattix/motion`, `@lattix/patterns`, and `@lattix/cli`.

The default starter creates a small Lattix Core project. The web and mobile templates add the optional platform/runtime packages they need, such as `@lattix/react`, `@lattix/react-native`, `@lattix/app`, `@lattix/navigation`, `@lattix/data`, `@lattix/storage`, `@lattix/auth`, `@lattix/web`, and `@lattix/native`. After scaffolding, use the scripts in the generated `package.json` to run, test, build, and release the app.

### Prompt format for app generation

Use this format when asking a teammate or AI agent to build an app with Lattix:

```md
Build a Lattix app for: <product or workflow>
Target: <core | web react-router | web tanstack-router | mobile expo | mobile react-native>
Screens: <screen names, layout hierarchy, primary UI states>
Navigation: <routes, tabs, stacks, deep links>
Data: <API resources, request/response shapes, loading and error states>
Storage and auth: <session, persistence, offline, secure storage needs>
Styling and motion: <tokens, raw style constraints, animation presets>
Actions: <button presses, form submits, navigation events>
Platform needs: <web metadata/PWA/SSR or native capabilities/accessibility>
Validation: <commands or checks the generated app must pass>
```

Ask for Lattix to remain the semantic source of truth: define screens with `@lattix/dsl`, keep app concerns in manifests, render through `@lattix/react` or `@lattix/react-native`, and bind manifests to normal ecosystem tooling instead of inventing a custom runtime.

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

| Package | Purpose |
|---------|---------|
| `lattix` | Umbrella package for the mandatory framework packages and CLI |
| `@lattix/core` | Semantic nodes, validation contracts |
| `@lattix/dsl` | Fluent authoring API |
| `@lattix/diagnostics` | Diagnostic formatting and debug tools |
| `@lattix/tokens` | Design tokens, normalization, style diagnostics |
| `@lattix/react` | Web renderer |
| `@lattix/react-native` | Native renderer |
| `@lattix/motion` | Animation schema, presets, validation, adapters |
| `@lattix/patterns` | Reusable composites and advanced motion helpers |
| `@lattix/cli` | Core scaffolding, optional web/mobile templates, template verification, and release readiness config |
| `@lattix/app` | Optional app manifest, provider composition, and runtime validation |
| `@lattix/navigation` | Route manifests and router adapter contracts |
| `@lattix/data` | API/server-state contracts and adapter contracts |
| `@lattix/storage` | Persistence/database manifests and adapter contracts |
| `@lattix/auth` | Session/auth manifests composing data, storage, and navigation |
| `@lattix/native` | Native UX and capability contracts |
| `@lattix/web` | Browser capability contracts, metadata, PWA, SSR boundaries |
| `@lattix/app` observability area | Analytics, logging, crash, performance, and consent manifests |

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

## CLI starter details

The CLI scaffolds a minimal Lattix Core starter by default. It also supports optional Vite React, Expo, and plain React Native app templates with Lattix screens, runtime manifests, environment files, tests, release profiles, privacy checklists, and package scripts.

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

The App Runtime is optional. It defines app, navigation, data, storage, auth, web, native, and observability manifests plus dependency-free adapter contracts, generated app scaffolding, template verification, and release-readiness guidance. Host React and React Native apps still bind those manifests to actual router, network, persistence, identity, browser/native, telemetry, and deployment tooling.

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

Next: release review and post-v1 planning.

## Contributing

1. Keep README.md and handover.md aligned with the current implementation reality
2. Run `npm run typecheck && npm run build && npm test` before opening a PR

Contributing guide: [docs/contributing.md](./docs/contributing.md).

## License

MIT — see [LICENSE](./LICENSE).

## Capabilities

- Monorepo and semantic core
- Fluent DSL authoring layer
- Diagnostics and validation engine
- Token and raw style system
- Web renderer (`@lattix/react`)
- React Native renderer (`@lattix/react-native`)
- Motion presets
- Patterns and advanced motion
- CLI and release polish
- Optional app manifest foundation
- Optional navigation manifests and adapters
- Optional data/API manifests and adapters
- Optional storage/database/offline manifests
- Optional auth/session manifests
- Mobile layout and native UX primitives
- React web runtime manifests
- Native capability manifests
- Observability, errors, and app health
- Web and mobile app scaffolding
- Web and mobile testing and CI
- Web and mobile release readiness
