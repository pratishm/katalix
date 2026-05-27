# Data Manifests

`@katalix/data` defines API and server-state contracts for Katalix App Runtime. It is not a data engine and does not require `fetch`, TanStack Query, GraphQL, or RPC libraries.

## Authoring

```ts
import { Data } from "@katalix/data";

const data = Data("Shop API")
  .baseUrl("https://api.example.com")
  .auth("session")
  .resource("products", (products) =>
    products
      .query("list", "GET", "/products", (op) =>
        op.cacheKey("products").retry({ attempts: 2 }).errorMap("standard"),
      )
      .mutation("create", "POST", "/products", (op) =>
        op.invalidates("products").errorMap("standard").authRequired(),
      ),
  )
  .toManifest();
```

## Adapter Boundaries

The package exports plain adapter contracts:

- `createFetchAdapterContract(manifest)`
- `createTanStackQueryContract(manifest)`
- `createGraphQLAdapterContract(manifest)`
- `createRpcAdapterContract(manifest)`

These helpers preserve the manifest contract while host apps choose the actual network library and binding code.

## UI States

Operations can declare UI-state semantics such as `idle`, `loading`, `refreshing`, `success`, `empty`, `error`, `stale`, and `offline`. These values are descriptive manifest data; renderers do not fetch data or mutate UI nodes.

## Diagnostics

Data diagnostics cover missing base URLs, invalid HTTP methods, unsafe mutation methods, unhandled auth requirements, and missing error normalization. Use `toManifest({ mode: "report", throwOnError: false })` to collect diagnostics without throwing.
