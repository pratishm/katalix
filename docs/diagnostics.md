# Diagnostics and debugging

Diagnostics are **built into every Katalix node and tree by default** — not an optional add-on. You do not need to call a separate validation API for normal authoring.

## What happens automatically

| When | What runs |
|------|-----------|
| DSL finalizes a node (`text`, `button`, …) | Shallow validation → `meta.diagnostics` on that node; **strict mode throws immediately** |
| `createTree()` / `toTree()` | Full tree validation → `tree.validation` + per-node `meta.diagnostics` |
| Invalid + strict (default) | `KatalixValidationError` with structured diagnostics |

```ts
import { Screen } from "@katalix/dsl";

// Throws in strict mode — empty text is caught while building the screen
Screen("Home", (s) => s.text(""));

// Valid trees carry validation on the result
const tree = Screen("Home", (s) => s.text("Hello")).toTree();
tree.validation.valid; // true
tree.root.children?.[0]?.meta?.diagnostics; // [] when clean
```

## Validation modes

Configure globally when needed (tests, CI, exploratory tooling):

```ts
import { configureKatalix, resetKatalixConfig } from "@katalix/diagnostics";

configureKatalix({ validationMode: "report", throwOnValidationError: false });
// ... build invalid trees without throwing
resetKatalixConfig();
```

| Mode | Behavior |
|------|----------|
| `strict` (default) | Throw on errors during node finalize and `toTree()` |
| `report` | Attach diagnostics; do not throw unless `throwOnError: true` |
| `tolerant` | Empty containers → warnings; `valid` true if no errors |

Per-call override:

```ts
home.toTree({ mode: "report", throwOnError: false });
```

## Reading diagnostics

```ts
const tree = home.toTree({ mode: "report", throwOnError: false });

// Tree-level
tree.validation.diagnostics;
tree.validation.errors;
tree.validation.warnings;

// Node-level (same issues, scoped to that path)
const text = tree.root.children?.[0];
text?.meta?.diagnostics;
```

## Formatting and inspection

```ts
import { printDiagnostics, explainNode, printTree } from "@katalix/diagnostics";

printDiagnostics(tree.validation.diagnostics);

explainNode(tree, "screen#Home/stack[0]/text[0]");

printTree(tree, { showBuilderTrace: true });
```

Fluent DSL:

```ts
home.explain("screen#Home/stack[0]/text[0]");
home.debug({ mode: "report", throwOnError: false });
```

## Source maps

TypeScript source maps are enabled in `tsconfig.base.json`.

```bash
npm run dev:inspect -- your-script.ts
npm run example:debug
```

When `meta.source` is present on nodes, diagnostics and `explainNode` include file/line/column.

## Package roles

- `@katalix/core` — validators, `createTree` with base diagnostics on nodes
- `@katalix/diagnostics` — enriched diagnostics, tolerant mode, `explainNode`, formatting
- `@katalix/dsl` — shallow validation on every finalized node + `toTree()` via diagnostics
