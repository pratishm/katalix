# Fluent DSL

The `@lattix/dsl` package is **Layer A** — a readable, chainable authoring API that always resolves into the normalized semantic tree from `@lattix/core`. Renderers never see builder state.

## Entry points

```ts
import { Screen, screen } from "@lattix/dsl";

// PascalCase or lowercase — identical
const home = Screen("Home", (s) => /* ... */);
const same = screen("Home", (s) => /* ... */);
```

## Example

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

const tree = home.toTree();
const result = home.validate();
const debug = home.debug();
```

## Sibling chaining on leaves

After `.text(...)` or `.button(...)`, style methods chain on the leaf. The next container method (`.text`, `.stack`, `.button`, …) commits the leaf and continues on the parent — matching statement-style authoring:

```ts
stack
  .text("First").color("text.primary")
  .text("Second")
```

## Core node builders

| Method | Kind |
|--------|------|
| `.stack()`, `.row()`, `.box()`, `.list()` | Containers (callback) |
| `.text()` | Text |
| `.button()` | Button |
| `.image()` | Image |
| `.input()` | Input |
| `.badge()` | Badge |
| `.divider()`, `.spacer()` | Leaf layout |

## Style helpers

Shared on containers and leaves: `.padding()`, `.margin()`, `.background()`, `.color()`, `.gap()`, `.radius()`, `.size()` / `.fontSize()`, `.weight()`, `.width()`, `.height()`.

Token strings and raw literals are both accepted; resolution happens in Phase 4 (`@lattix/tokens`).

## Output contract

| Method | Returns |
|--------|---------|
| `.toNode()` | Root `LattixNode` (partial; no full-tree validation) |
| `.toTree()` | Validated `LattixTree` with `validation` + per-node `meta.diagnostics` |
| `.debug()` | Tree + pretty-print (validation included) |
| `.explain(path)` | Node inspection using built-in diagnostics |

Validation runs automatically on `.toTree()` and when each node is finalized in strict mode. Use `configureLattix({ validationMode: "report" })` to inspect invalid trees without throwing.

## Debug labels and builder trace

```ts
Screen("Home", (s) =>
  s.debugLabel("root").stack({ gap: 8 }, (stack) =>
    stack.text("Hi").debugLabel("greeting"),
  ),
);
```

`meta.builderTrace` on nodes records fluent operations (not chain objects).

## Rules

1. Fluent state stays inside builders until `toNode()` / `toTree()`.
2. Semantic nodes never store chain references.
3. Invalid trees surface the same structured diagnostics as core.

See [architecture.md](./architecture.md) and [semantic-tree.md](./semantic-tree.md).
