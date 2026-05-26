# Styling model

Lattix supports **design token references** and **raw literals** in the same style bag. Normalization and validation run automatically — the same built-in diagnostics pipeline as node validation.

## Authoring (fluent DSL)

```ts
import { Screen } from "@lattix/dsl";

const card = Screen("Card", (s) =>
  s
    .padding(16) // raw number
    .background("surface.canvas") // token ref
    .stack({ gap: 12 }, (stack) =>
      stack
        .text("Hello")
        .color("text.primary") // token
        .size(18) // raw → fontSize
        .marginTop("space.3"), // token spacing
    ),
);
```

## Semantic representation

Authoring stores mixed values on `node.style`:

```ts
{ color: "text.primary", padding: 16 }
```

After normalization (automatic on `toTree()`):

```ts
node.normalizedStyle = {
  color: { kind: "token", ref: "text.primary" },
  padding: { kind: "literal", value: 16 },
};
```

Renderers (Phase 5+) resolve tokens to platform values via `resolveToken(ref, registry)`.

## Default token registry

`@lattix/tokens` ships `defaultTokenRegistry` with common entries:

- Text: `text.primary`, `text.muted`, `text.inverse`
- Surfaces: `surface.canvas`, `surface.elevated`, `surface.overlay`
- Brand: `brand.primary`, `brand.primaryHover`
- Space: `space.1` … `space.6`
- Radius: `radius.sm`, `radius.md`, `radius.lg`

Extend for your product:

```ts
import { createTokenRegistry } from "@lattix/tokens";

const registry = createTokenRegistry({
  "brand.accent": "#7c3aed",
});
```

## Style schema (Phase 4 subset)

Supported properties include: `color`, `background`, `padding`, `margin`, `gap`, `borderRadius`, `fontSize`, `fontWeight`, `width`, `height`, and flex layout props.

Unsupported properties produce **`LATTIX_UNKNOWN_STYLE_PROP`** diagnostics (never silent).

Unknown token refs produce **`LATTIX_UNKNOWN_TOKEN`**.

## Three-step pipeline

1. **Author** — DSL or `createNode({ style: { … } })`
2. **Normalize** — `normalizeStyle` / automatic via `toTree()`
3. **Resolve** (renderers, Phase 5+) — `resolveToken` → CSS / React Native styles

## Built-in diagnostics

Style issues appear in:

- `tree.validation.diagnostics`
- `node.meta.diagnostics`
- Strict mode throws during authoring or `toTree()` (default)

```ts
import { configureLattix } from "@lattix/diagnostics";

configureLattix({ validationMode: "report", throwOnValidationError: false });
const tree = Screen("X", (s) => s.background("missing.token")).toTree({
  throwOnError: false,
});
```
