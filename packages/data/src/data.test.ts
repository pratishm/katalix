import { describe, expect, it } from "vitest";
import {
  Data,
  createFetchAdapterContract,
  createGraphQLAdapterContract,
  createRpcAdapterContract,
  createTanStackQueryContract,
  printDataManifest,
  validateDataManifest,
} from "./index.js";

describe("Data runtime DSL", () => {
  it("resolves resource authoring into a normalized data manifest", () => {
    const manifest = Data("Shop API")
      .baseUrl("https://api.example.com")
      .auth("session")
      .resource("products", (products) =>
        products
          .query("list", "GET", "/products", (op) =>
            op
              .cacheKey("products")
              .retry({ attempts: 2 })
              .errorMap("standard")
              .state("loading")
              .state("empty"),
          )
          .mutation("create", "POST", "/products", (op) =>
            op.invalidates("products").errorMap("standard").authRequired(),
          ),
      )
      .toManifest();

    expect(manifest.kind).toBe("data");
    expect(manifest.name).toBe("Shop API");
    expect(manifest.baseUrl).toBe("https://api.example.com");
    expect(manifest.resources).toEqual([
      {
        id: "products",
        operations: [
          {
            id: "list",
            kind: "query",
            method: "GET",
            path: "/products",
            cacheKeys: ["products"],
            invalidates: [],
            retry: { attempts: 2 },
            cancellation: true,
            errorMap: "standard",
            requiresAuth: false,
            states: ["loading", "empty"],
          },
          {
            id: "create",
            kind: "mutation",
            method: "POST",
            path: "/products",
            cacheKeys: [],
            invalidates: ["products"],
            cancellation: true,
            errorMap: "standard",
            requiresAuth: true,
            states: [],
          },
        ],
      },
    ]);
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.meta.builderTrace).toContain('Data("Shop API")');
  });

  it("projects manifests into dependency-free adapter contracts", () => {
    const manifest = Data("Shop API")
      .baseUrl("https://api.example.com")
      .resource("products", (products) =>
        products.query("list", "GET", "/products", (op) =>
          op.cacheKey("products").errorMap("standard"),
        ),
      )
      .toManifest();

    expect(createFetchAdapterContract(manifest)).toEqual([
      {
        id: "products.list",
        method: "GET",
        url: "https://api.example.com/products",
        cancellation: true,
      },
    ]);
    expect(createTanStackQueryContract(manifest)).toEqual([
      {
        id: "products.list",
        kind: "query",
        queryKey: ["products"],
        method: "GET",
        path: "/products",
        invalidates: [],
        retry: undefined,
        requiresAuth: false,
        errorMap: "standard",
        states: [],
      },
    ]);
    expect(createGraphQLAdapterContract(manifest)).toEqual([
      {
        id: "products.list",
        operation: "query",
        documentRef: "products.list",
      },
    ]);
    expect(createRpcAdapterContract(manifest)).toEqual([
      {
        id: "products.list",
        procedure: "products.list",
        kind: "query",
      },
    ]);
  });

  it("reports missing base URLs, invalid methods, unsafe mutations, missing auth, and missing error maps", () => {
    const manifest = Data("Shop API")
      .resource("products", (products) =>
        products
          .query("list", "TRACE", "/products")
          .mutation("create", "GET", "/products", (op) => op.authRequired()),
      )
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "KATALIX_MISSING_DATA_BASE_URL",
          path: "data.baseUrl",
          field: "baseUrl",
        }),
        expect.objectContaining({
          code: "KATALIX_INVALID_DATA_METHOD",
          path: "data.resources[0].operations[0].method",
          received: "TRACE",
        }),
        expect.objectContaining({
          code: "KATALIX_MISSING_DATA_ERROR_MAP",
          path: "data.resources[0].operations[0].errorMap",
        }),
        expect.objectContaining({
          code: "KATALIX_UNSAFE_MUTATION_CONFIG",
          path: "data.resources[0].operations[1].method",
          received: "GET",
        }),
        expect.objectContaining({
          code: "KATALIX_UNHANDLED_DATA_AUTH_REQUIREMENT",
          path: "data.resources[0].operations[1].requiresAuth",
        }),
      ]),
    );
  });

  it("preserves mutation and subscription semantics in adapter contracts", () => {
    const manifest = Data("Shop API")
      .baseUrl("https://api.example.com")
      .auth("session")
      .resource("products", (products) =>
        products
          .mutation("create", "POST", "/products", (op) =>
            op.invalidates("products").retry({ attempts: 1 }).errorMap("standard").authRequired(),
          )
          .subscription("changes", "/products/changes", (op) =>
            op.cacheKey("product-changes").errorMap("standard").state("refreshing"),
          ),
      )
      .toManifest();

    expect(createTanStackQueryContract(manifest)).toEqual([
      {
        id: "products.create",
        kind: "mutation",
        queryKey: ["products", "create"],
        method: "POST",
        path: "/products",
        invalidates: ["products"],
        retry: { attempts: 1 },
        requiresAuth: true,
        errorMap: "standard",
        states: [],
      },
      {
        id: "products.changes",
        kind: "subscription",
        queryKey: ["product-changes"],
        method: "GET",
        path: "/products/changes",
        invalidates: [],
        retry: undefined,
        requiresAuth: false,
        errorMap: "standard",
        states: ["refreshing"],
      },
    ]);
  });
});

describe("data manifest utilities", () => {
  it("validates and prints data manifests without fluent builder state", () => {
    const manifest = Data("Shop API")
      .baseUrl("https://api.example.com")
      .resource("products", (products) =>
        products.query("list", "GET", "/products", (op) =>
          op.errorMap("standard"),
        ),
      )
      .toManifest();

    expect(validateDataManifest(manifest).valid).toBe(true);
    expect(printDataManifest(manifest)).toContain("data name=Shop API");
    expect("state" in manifest).toBe(false);
  });
});
