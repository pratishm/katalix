# Web Starter

`@lattix/cli` can generate Vite React app templates for React Router or TanStack Router.

## Commands

```bash
lattix create web-app --router react-router
lattix create web-app --router tanstack-router
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
    lattix/
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

The generated app remains a normal Vite React app. Lattix owns the declarative contracts:

- `src/screens/home.screen.ts` compiles to a semantic UI tree consumed by `@lattix/react`.
- `src/lattix/navigation.ts` emits a shared route manifest plus either a React Router or TanStack Router adapter contract.
- `src/lattix/data.ts`, `storage.ts`, and `web.ts` declare API, browser storage, metadata, route boundary, and SPA rendering contracts.
- `src/lattix/app.ts` composes the web platform, environment variables, and providers.
- `src/lattix/release.ts`, `.env.*`, and `public/_headers` describe dev, preview, and production release profiles.

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

The template test checks that every generated Lattix manifest is valid. Repository-level `npm run test:templates` verifies both web starter variants. See [web-testing.md](./web-testing.md) and [web-release.md](./web-release.md).
