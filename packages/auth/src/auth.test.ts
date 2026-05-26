import { describe, expect, it } from "vitest";
import {
  Auth,
  createAuthAdapterPlan,
  printAuthManifest,
  validateAuthManifest,
} from "./index.js";

describe("Auth runtime DSL", () => {
  it("resolves session authoring into a normalized auth manifest", () => {
    const manifest = Auth("Shop Auth")
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

    expect(manifest.kind).toBe("auth");
    expect(manifest.name).toBe("Shop Auth");
    expect(manifest.storage).toEqual({ id: "session", secure: true });
    expect(manifest.navigation.guards).toEqual([
      { id: "authenticated", routeRef: "account" },
    ]);
    expect(manifest.data.authHeaders).toEqual([
      { resourceRef: "api", header: "Authorization" },
    ]);
    expect(manifest.sessions[0]).toMatchObject({
      id: "primary",
      provider: "jwt",
      refresh: { endpoint: "/auth/refresh", strategy: "rotation" },
      logout: { endpoint: "/auth/logout" },
      bootstrap: "silent",
      expiry: { idleMinutes: 30, absoluteMinutes: 480 },
    });
    expect(manifest.oauth[0]).toEqual({
      id: "github",
      redirectUri: "/auth/github/callback",
    });
    expect(manifest.magicLinks[0]).toEqual({
      id: "email",
      redirectUri: "/auth/magic",
    });
    expect(manifest.anonymousSessions).toEqual([{ id: "guest" }]);
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.meta.builderTrace).toContain('Auth("Shop Auth")');
  });

  it("projects manifests into dependency-free auth adapter plans", () => {
    const manifest = Auth("Shop Auth")
      .storage("session", { secure: true })
      .navigation((nav) => nav.guard("authenticated"))
      .session("primary", "jwt", (session) => session.refresh("/auth/refresh"))
      .toManifest();

    expect(createAuthAdapterPlan(manifest, { platform: "web" })).toEqual({
      name: "Shop Auth",
      platform: "web",
      providers: ["jwt"],
      storageRef: "session",
      guards: ["authenticated"],
      refreshEndpoints: ["/auth/refresh"],
    });
  });

  it("reports unknown providers, missing storage, invalid guard refs, unsupported refresh, and unsafe platform choices", () => {
    const manifest = Auth("Shop Auth")
      .navigation((nav) => nav.guard("bad guard"))
      .session("primary", "ldap", (session) =>
        session.refresh("/auth/refresh", { strategy: "cookie-rotation" }),
      )
      .toManifest({ mode: "report", throwOnError: false, platform: "native" });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LATTIX_UNKNOWN_AUTH_PROVIDER",
          path: "auth.sessions[0].provider",
          received: "ldap",
        }),
        expect.objectContaining({
          code: "LATTIX_MISSING_AUTH_STORAGE",
          path: "auth.storage",
        }),
        expect.objectContaining({
          code: "LATTIX_INVALID_AUTH_GUARD_REF",
          path: "auth.navigation.guards[0].id",
          received: "bad guard",
        }),
        expect.objectContaining({
          code: "LATTIX_UNSUPPORTED_AUTH_REFRESH_STRATEGY",
          path: "auth.sessions[0].refresh.strategy",
          received: "cookie-rotation",
        }),
        expect.objectContaining({
          code: "LATTIX_UNSAFE_AUTH_PLATFORM_CHOICE",
          path: "auth.sessions[0].refresh.strategy",
          received: { platform: "native", strategy: "cookie-rotation" },
        }),
      ]),
    );
  });

  it("reports cookie-backed sessions on native targets", () => {
    const manifest = Auth("Shop Auth")
      .storage("session", { secure: true })
      .session("browser", "cookie")
      .toManifest({ mode: "report", throwOnError: false, platform: "native" });

    expect(manifest.validation.diagnostics[0]).toMatchObject({
      code: "LATTIX_UNSAFE_AUTH_PLATFORM_CHOICE",
      path: "auth.sessions[0].provider",
      received: { platform: "native", provider: "cookie" },
    });
  });
});

describe("auth manifest utilities", () => {
  it("validates and prints auth manifests without fluent builder state", () => {
    const manifest = Auth("Shop Auth")
      .storage("session", { secure: true })
      .session("primary", "jwt")
      .toManifest();

    expect(validateAuthManifest(manifest).valid).toBe(true);
    expect(printAuthManifest(manifest)).toContain("auth name=Shop Auth");
    expect("state" in manifest).toBe(false);
  });
});
