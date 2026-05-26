# Web basic example

Renders a fluent DSL screen to static HTML using `@lattix/react` and `react-dom/server`.

```bash
npm run build
npm run example:web
```

This demonstrates the full pipeline:

1. Author UI with `@lattix/dsl` (fluent chains)
2. Build a validated semantic tree via `.toTree()`
3. Render to HTML with `<LattixRenderer>` from `@lattix/react`

Actions are dispatched through the `onAction` callback.
