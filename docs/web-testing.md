# Web Testing

Phase 20 verifies generated Vite React starters without requiring manual setup.

## Repository checks

Run from the repo root:

```bash
npm run typecheck
npm run build
npm test
npm run test:templates
```

`npm run test:templates` scaffolds both web starter variants in temporary directories and checks the generated manifests, scripts, release profiles, and privacy checklist files.

## Generated app checks

Generated web apps include:

```bash
npm run typecheck
npm test
npm run build
```

The manifest test checks app, navigation, data, storage, web, and release profile contracts. The build command verifies the Vite app shell and selected router host.

## Playwright guidance

Use Playwright for browser E2E once the generated app has real screens:

```bash
npm run test:e2e
```

Recommended first scenarios:

- The home route renders a Lattix screen through the selected router.
- The diagnostics panel reports valid manifests.
- Loading/error route boundaries render for simulated failures.
- Keyboard navigation reaches the `main-content` skip-link target.

Keep Playwright out of normal Core-only checks unless the job has installed generated app dependencies.
