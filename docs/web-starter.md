# Web Starter

`@katalix/cli` can generate Vite React app templates for React Router or TanStack Router.

## Commands

```bash
katalix create web-app --router react-router
katalix create web-app --router tanstack-router
```

The directory name is also the package name unless `--name` is provided.

## Generated structure

```text
web-app/
  index.html
  .env.example
  .env.development
  .env.preview
  .env.production
  public/_headers
  playwright.config.ts
  e2e/home.spec.ts
  src/
    main.tsx
    App.tsx
    router.tsx
    screens/home.screen.ts
    katalix/
      app.ts
      data.ts
      diagnostics.ts
      navigation.ts
      release.ts
      storage.ts
      web.ts
      manifest.test.ts
  privacy-checklist.md
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
```

## Runtime contracts

The generated app remains a normal Vite React app. Katalix owns the declarative contracts:

- `src/screens/home.screen.ts` compiles to a semantic UI tree consumed by `@katalix/react`.
- `src/katalix/navigation.ts` emits a shared route manifest plus either a React Router or TanStack Router adapter contract.
- `src/katalix/data.ts`, `storage.ts`, and `web.ts` declare API, browser storage, metadata, route boundary, and SPA rendering contracts.
- `src/katalix/app.ts` composes the web platform, environment variables, and providers.
- `src/katalix/release.ts`, `.env.*`, and `public/_headers` describe dev, preview, and production release profiles.

## Verification

Generated projects include:

```bash
npm run dev
npm run build
npm test
npm run test:e2e
npm run release:preview
npm run release:production
```

The template test checks that every generated Katalix manifest is valid. Repository-level `npm run test:templates` verifies both web starter variants. See [web-testing.md](./web-testing.md) and [web-release.md](./web-release.md).
