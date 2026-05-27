# Auth Manifests

`@katalix/auth` defines auth and session contracts for Katalix App Runtime. It does not provide a backend identity provider, token service, OAuth implementation, or secure storage engine.

## Authoring

```ts
import { Auth } from "@katalix/auth";

const auth = Auth("Shop Auth")
  .storage("session", { secure: true })
  .navigation((nav) =>
    nav.guard("authenticated", { routeRef: "account" }).loginRoute("login"),
  )
  .data((data) => data.authHeader("api", "Authorization"))
  .session("primary", "jwt", (session) =>
    session
      .refresh("/auth/refresh", { strategy: "rotation" })
      .logout("/auth/logout")
      .bootstrap("silent")
      .expiry({ idleMinutes: 30, absoluteMinutes: 480 }),
  )
  .oauth("github", { redirectUri: "/auth/github/callback" })
  .magicLink("email", { redirectUri: "/auth/magic" })
  .anonymous("guest")
  .toManifest();
```

## Integration Contracts

Auth manifests reference other runtime manifests by ID:

- navigation guards and login routes,
- data resource auth headers,
- storage refs for sessions and tokens.

Host apps still bind these contracts to real identity providers, router guards, storage adapters, and network clients.

## Diagnostics

Diagnostics cover unknown providers, missing storage refs, invalid guard refs, unsupported refresh strategies, duplicate session IDs, and platform-unsafe choices such as cookie-oriented refresh on native targets.
