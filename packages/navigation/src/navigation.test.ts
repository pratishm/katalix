import { describe, expect, it } from "vitest";
import {
  Navigation,
  createReactNavigationScreens,
  createReactRouterRoutes,
  createTanStackRouteTree,
  printRouteManifest,
  validateRouteManifest,
} from "./index.js";

describe("Navigation runtime DSL", () => {
  it("resolves readable route authoring into a normalized manifest", () => {
    const manifest = Navigation("Shop")
      .routes((routes) =>
        routes
          .layout("root", (root) =>
            root
              .path("/")
              .screen("home", "HomeScreen", (home) =>
                home
                  .path("")
                  .queryParam("tab", { type: "string" })
                  .guard("authenticated")
                  .link("home-link", "/")
                  .deepLink("shop://home"),
              ),
          )
          .stack("account", (account) =>
            account
              .path("/account")
              .screen("profile", "ProfileScreen", (profile) =>
                profile.path("profile").param("userId", { type: "string", required: true }),
              ),
          ),
      )
      .toManifest();

    expect(manifest.kind).toBe("navigation");
    expect(manifest.name).toBe("Shop");
    expect(manifest.routes).toHaveLength(2);
    expect(manifest.routes[0]).toMatchObject({
      id: "root",
      kind: "layout",
      path: "/",
      children: [
        {
          id: "home",
          kind: "screen",
          screenRef: "HomeScreen",
          path: "",
          guards: ["authenticated"],
          links: [{ id: "home-link", href: "/" }],
          deepLinks: ["shop://home"],
        },
      ],
    });
    expect(manifest.routes[1]?.children[0]?.params).toEqual([
      { name: "userId", type: "string", required: true },
    ]);
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.meta.builderTrace).toContain('Navigation("Shop")');
  });

  it("projects the shared manifest into first-class adapter contracts", () => {
    const manifest = Navigation("Shop")
      .routes((routes) =>
        routes.screen("home", "HomeScreen", (home) => home.path("/")),
      )
      .toManifest();

    expect(createReactRouterRoutes(manifest)).toEqual([
      { id: "home", path: "/", elementRef: "HomeScreen" },
    ]);
    expect(createTanStackRouteTree(manifest)).toEqual([
      { id: "home", path: "/", componentRef: "HomeScreen" },
    ]);
    expect(createReactNavigationScreens(manifest)).toEqual([
      { name: "home", componentRef: "HomeScreen", presentation: "card" },
    ]);
  });

  it("reports duplicate route IDs with a manifest path", () => {
    const manifest = Navigation("Shop")
      .routes((routes) =>
        routes
          .screen("home", "HomeScreen")
          .screen("home", "DuplicateHomeScreen"),
      )
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.valid).toBe(false);
    expect(manifest.validation.diagnostics[0]).toMatchObject({
      code: "LATTIX_DUPLICATE_ROUTE_ID",
      manifestKind: "navigation",
      path: "navigation.routes[1]",
      field: "routes.id",
      received: "home",
    });
  });

  it("reports missing screen refs and unsupported adapter features", () => {
    const manifest = Navigation("Shop")
      .routes((routes) =>
        routes.sheet("compose", "", (compose) => compose.path("/compose")),
      )
      .toManifest({
        mode: "report",
        throwOnError: false,
        adapter: "react-router",
        platform: "web",
      });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LATTIX_MISSING_ROUTE_SCREEN_REF",
          path: "navigation.routes[0].screenRef",
          field: "screenRef",
        }),
        expect.objectContaining({
          code: "LATTIX_UNSUPPORTED_ROUTE_ADAPTER_FEATURE",
          path: "navigation.routes[0].presentation",
          field: "presentation",
          received: "sheet",
        }),
      ]),
    );
  });

  it("reports invalid param types and unsupported adapter platform combinations", () => {
    const validManifest = Navigation("Shop")
      .routes((routes) =>
        routes.screen("profile", "ProfileScreen", (profile) =>
          profile.path("/profile/:userId").param("userId", { type: "string" }),
        ),
      )
      .toManifest();
    const manifestWithInvalidParam = {
      ...validManifest,
      routes: [
        {
          ...validManifest.routes[0],
          params: [{ name: "userId", type: "uuid" as never }],
        },
      ],
    };

    const validation = validateRouteManifest(manifestWithInvalidParam, {
      adapter: "react-navigation",
      platform: "web",
    });

    expect(validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LATTIX_INVALID_ROUTE_PARAM_TYPE",
          path: "navigation.routes[0].params[0].type",
          received: "uuid",
        }),
        expect.objectContaining({
          code: "LATTIX_UNSUPPORTED_ROUTE_PLATFORM",
          path: "navigation.routes[0]",
          received: { adapter: "react-navigation", platform: "web" },
        }),
      ]),
    );
  });
});

describe("route manifest utilities", () => {
  it("validates and prints route manifests without fluent builder state", () => {
    const manifest = Navigation("Shop")
      .routes((routes) =>
        routes.screen("home", "HomeScreen", (home) => home.path("/")),
      )
      .toManifest();

    expect(validateRouteManifest(manifest).valid).toBe(true);
    expect(printRouteManifest(manifest)).toContain("navigation name=Shop");
    expect("state" in manifest).toBe(false);
  });
});
