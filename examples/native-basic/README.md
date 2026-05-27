# Native basic example

Demonstrates semantic tree construction and React Native style resolution
using `@katalix/react-native` without requiring a device or simulator.

```bash
npm run build
npm run example:native
```

This demonstrates the pipeline:

1. Author UI with `@katalix/dsl` (fluent chains)
2. Build a validated semantic tree via `.toTree()`
3. Resolve semantic styles to React Native `StyleSheet`-compatible values via `resolveStyleToNative()`

For full component rendering, use `<KatalixNativeRenderer>` inside a React Native app.
