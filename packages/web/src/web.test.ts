import { describe, expect, it } from "vitest";
import {
  Web,
  createDocumentHead,
  createWebAdapterPlan,
  printWebManifest,
  validateWebManifest,
} from "./index.js";

describe("Web runtime DSL", () => {
  it("resolves browser authoring into a normalized web manifest", () => {
    const manifest = Web("Shop Web")
      .metadata((meta) =>
        meta
          .title("Shop")
          .description("Lattix shop")
          .canonical("https://shop.example.com")
          .openGraph("og:title", "Shop")
          .favicon("/favicon.ico")
          .themeColor("#ffffff")
          .meta("robots", "index,follow"),
      )
      .viewport({ width: "device-width", initialScale: 1 })
      .breakpoint("desktop", 1024)
      .cssReset("modern")
      .focusTrap("checkout-modal")
      .skipLink("main")
      .routeBoundary("account", { loading: "AccountLoading", error: "AccountError" })
      .capability("clipboard")
      .pwa({ manifestPath: "/manifest.webmanifest", serviceWorker: "/sw.js" })
      .rendering({ mode: "spa", framework: "vite" })
      .toManifest();

    expect(manifest.kind).toBe("web");
    expect(manifest.name).toBe("Shop Web");
    expect(manifest.metadata).toMatchObject({
      title: "Shop",
      description: "Lattix shop",
      canonical: "https://shop.example.com",
      openGraph: [{ property: "og:title", content: "Shop" }],
      favicons: ["/favicon.ico"],
      themeColor: "#ffffff",
      meta: [{ name: "robots", content: "index,follow" }],
    });
    expect(manifest.viewport).toEqual({ width: "device-width", initialScale: 1 });
    expect(manifest.breakpoints).toEqual([{ name: "desktop", minWidth: 1024 }]);
    expect(manifest.routeBoundaries).toEqual([
      { routeRef: "account", loading: "AccountLoading", error: "AccountError" },
    ]);
    expect(manifest.pwa).toEqual({
      manifestPath: "/manifest.webmanifest",
      serviceWorker: "/sw.js",
    });
    expect(manifest.rendering).toEqual({ mode: "spa", framework: "vite" });
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.meta.builderTrace).toContain('Web("Shop Web")');
  });

  it("projects web manifests into document head and adapter plans", () => {
    const manifest = Web("Shop Web")
      .metadata((meta) => meta.title("Shop").canonical("https://shop.example.com"))
      .rendering({ mode: "spa", framework: "vite" })
      .toManifest();

    expect(createDocumentHead(manifest)).toEqual({
      title: "Shop",
      meta: [],
      links: [{ rel: "canonical", href: "https://shop.example.com" }],
      openGraph: [],
      themeColor: undefined,
    });
    expect(createWebAdapterPlan(manifest)).toEqual({
      name: "Shop Web",
      framework: "vite",
      renderingMode: "spa",
      capabilities: [],
      pwa: undefined,
    });
  });

  it("includes SEO, Open Graph, favicons, and theme color in document head plans", () => {
    const manifest = Web("Shop Web")
      .metadata((meta) =>
        meta
          .title("Shop")
          .description("Lattix shop")
          .canonical("https://shop.example.com")
          .openGraph("og:title", "Shop")
          .favicon("/favicon.ico")
          .themeColor("#ffffff")
          .meta("robots", "index,follow"),
      )
      .toManifest();

    expect(createDocumentHead(manifest)).toEqual({
      title: "Shop",
      meta: [
        { name: "description", content: "Lattix shop" },
        { name: "robots", content: "index,follow" },
      ],
      links: [
        { rel: "canonical", href: "https://shop.example.com" },
        { rel: "icon", href: "/favicon.ico" },
      ],
      openGraph: [{ property: "og:title", content: "Shop" }],
      themeColor: "#ffffff",
    });
  });

  it("reports unsafe external links, insecure storage, mixed content, inline HTML, and unsupported rendering targets", () => {
    const manifest = Web("Shop Web")
      .externalLink("docs", "https://docs.example.com")
      .storage("session", { adapter: "localStorage", sensitive: true })
      .metadata((meta) => meta.canonical("http://shop.example.com"))
      .unsafeHtml("hero", "<script>alert(1)</script>")
      .rendering({ mode: "ssr", framework: "next" })
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LATTIX_UNSAFE_WEB_EXTERNAL_LINK",
          path: "web.externalLinks[0].rel",
        }),
        expect.objectContaining({
          code: "LATTIX_INSECURE_WEB_STORAGE",
          path: "web.storage[0].adapter",
          received: "localStorage",
        }),
        expect.objectContaining({
          code: "LATTIX_MIXED_CONTENT_ASSUMPTION",
          path: "web.metadata.canonical",
          received: "http://shop.example.com",
        }),
        expect.objectContaining({
          code: "LATTIX_UNSAFE_INLINE_HTML",
          path: "web.unsafeHtml[0]",
        }),
        expect.objectContaining({
          code: "LATTIX_UNSUPPORTED_WEB_RENDERING_TARGET",
          path: "web.rendering.framework",
          received: { mode: "ssr", framework: "next" },
        }),
      ]),
    );
  });

  it("reports unsupported web rendering mode and framework combinations", () => {
    const nextSpa = Web("Next SPA")
      .rendering({ mode: "spa", framework: "next" })
      .toManifest({ mode: "report", throwOnError: false });
    const viteSsr = Web("Vite SSR")
      .rendering({ mode: "ssr", framework: "vite" })
      .toManifest({ mode: "report", throwOnError: false });
    const viteSsg = Web("Vite SSG")
      .rendering({ mode: "ssg", framework: "vite" })
      .toManifest({ mode: "report", throwOnError: false });

    expect(nextSpa.validation.diagnostics[0]).toMatchObject({
      code: "LATTIX_UNSUPPORTED_WEB_RENDERING_TARGET",
      received: { mode: "spa", framework: "next" },
    });
    expect(viteSsr.validation.diagnostics[0]).toMatchObject({
      code: "LATTIX_UNSUPPORTED_WEB_RENDERING_TARGET",
      received: { mode: "ssr", framework: "vite" },
    });
    expect(viteSsg.validation.diagnostics[0]).toMatchObject({
      code: "LATTIX_UNSUPPORTED_WEB_RENDERING_TARGET",
      received: { mode: "ssg", framework: "vite" },
    });
  });
});

describe("web manifest utilities", () => {
  it("validates and prints web manifests without fluent builder state", () => {
    const manifest = Web("Shop Web")
      .metadata((meta) => meta.title("Shop"))
      .rendering({ mode: "spa", framework: "vite" })
      .toManifest();

    expect(validateWebManifest(manifest).valid).toBe(true);
    expect(printWebManifest(manifest)).toContain("web name=Shop Web");
    expect("state" in manifest).toBe(false);
  });
});
