# Semantic tree

The semantic tree is Lattix's runtime source of truth. Build trees with `@lattix/core` factories today; the fluent DSL (Phase 2) will compile to the same shape.

## Creating nodes

```ts
import { createNode, createTree, normalizeAction } from "@lattix/core";

const tree = createTree(
  createNode("screen", {
    id: "home",
    children: [
      createNode("stack", {
        style: { gap: 12, padding: 16 },
        children: [
          createNode("text", {
            props: { content: "Welcome back" },
            style: { fontSize: 28, fontWeight: "bold" },
          }),
          createNode("button", {
            props: {
              label: "Continue",
              onPress: normalizeAction("continue"),
            },
          }),
        ],
      }),
    ],
  }),
);
```

## Paths and validation

```ts
import { assignPaths, validateTree, printTree } from "@lattix/core";

const withPaths = assignPaths(tree.root);
const result = validateTree(withPaths);

if (!result.valid) {
  console.error(result.diagnostics);
}

console.log(printTree(withPaths));
```

## Validation modes

| Mode | Behavior |
|------|----------|
| `report` (default) | Return `{ valid, diagnostics }` |
| `strict` | Throw `LattixValidationError` on failure |
| `tolerant` | Same as report in Phase 1; renderer warnings in later phases |

## Style values

`LattixStyle` accepts token references (`text.primary`) or raw literals (`#101828`, `16`). Token resolution ships in Phase 4 (`@lattix/tokens`).
