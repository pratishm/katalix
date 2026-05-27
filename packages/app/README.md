# @katalix/app

Optional App Runtime manifest foundation for Katalix.

`@katalix/app` keeps app concerns outside Katalix Core UI nodes. It provides a readable authoring DSL that resolves to plain, typed, serializable manifests.

## Example

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

The manifest is the runtime source of truth. Adapters in later phases will consume manifests; they must not consume fluent builder state.

## Current scope

Phase 10 includes:

- `App("Name")`
- platform declarations
- provider declarations
- environment variable declarations
- structured manifest validation
- `validateManifest()`
- `printManifest()`

Navigation, data, storage, auth, web/native capabilities, and observability adapters are planned for later optional runtime phases.
