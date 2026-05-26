# Web Runtime Manifests

`@lattix/web` defines browser runtime contracts for Lattix App Runtime. It does not replace Vite, React Router, TanStack Router, browser APIs, or future SSR frameworks.

## Authoring

```ts
import { Web } from "@lattix/web";

const web = Web("Shop Web")
  .metadata((meta) =>
    meta
      .title("Shop")
      .description("Lattix shop")
      .canonical("https://shop.example.com")
      .openGraph("og:title", "Shop")
      .favicon("/favicon.ico")
      .themeColor("#ffffff"),
  )
  .viewport({ width: "device-width", initialScale: 1 })
  .breakpoint("desktop", 1024)
  .routeBoundary("account", { loading: "AccountLoading", error: "AccountError" })
  .pwa({ manifestPath: "/manifest.webmanifest", serviceWorker: "/sw.js" })
  .rendering({ mode: "spa", framework: "vite" })
  .toManifest();
```

## Scope

Web manifests cover document metadata, title, meta tags, canonical URLs, Open Graph, favicons, theme color, SEO metadata, responsive breakpoints, CSS reset strategy, viewport handling, focus traps, skip links, route loading/error boundaries, browser capabilities, PWA manifest hooks, service worker hooks, and rendering boundaries.

Vite SPA is the initial concrete adapter boundary. Next.js and Remix remain future adapter targets.

## Security Diagnostics

Diagnostics cover unsafe external links, missing `rel` attributes, insecure browser storage choices, mixed-content assumptions, unsafe inline HTML, and unsupported SSR framework targets.
