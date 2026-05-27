# Navigation Manifests

`@katalix/navigation` defines a shared route manifest for Katalix App Runtime. It does not replace React Router, TanStack Router, or React Navigation; it gives adapters a typed, normalized route contract to consume.

## Authoring

```ts
import { Navigation } from "@katalix/navigation";

const routes = Navigation("Shop")
  .routes((r) =>
    r
      .layout("root", (root) =>
        root.path("/").screen("home", "HomeScreen", (home) =>
          home
            .path("")
            .queryParam("tab", { type: "string" })
            .guard("authenticated")
            .deepLink("shop://home"),
        ),
      )
      .stack("account", (account) =>
        account.path("/account").screen("profile", "ProfileScreen", (profile) =>
          profile.path("profile").param("userId", { type: "string", required: true }),
        ),
      ),
  )
  .toManifest();
```

## Adapter Boundaries

The package exports dependency-free adapter contracts:

- `createReactRouterRoutes(manifest)`
- `createTanStackRouteTree(manifest)`
- `createReactNavigationScreens(manifest)`

These helpers produce plain objects with component references. Host applications still bind those references to real components and router APIs.

## Portable Features

Portable route features include:

- pages and nested layouts
- route groups, stacks, tabs, modals, and sheets
- route params and query params
- guards, links, and deep links

Native-only presentation such as `sheet` is diagnosed when validating against web adapters.

## Diagnostics

Navigation diagnostics include duplicate route IDs, missing screen references, invalid params, unsupported platform combinations, and adapter feature gaps. Use report mode when you want a manifest plus diagnostics instead of a thrown validation error.
