# @katalix/cli

CLI scaffolding and release utilities for Katalix.

## Usage

```bash
katalix create my-katalix-app
```

This creates a minimal Katalix Core starter project with:

- `src/home.screen.ts` — a fluent `Screen()` example
- `src/index.ts` — prints the normalized semantic tree
- `package.json` — starter scripts and dependencies
- `tsconfig.json` — strict TypeScript defaults

Use `--name` to override the package name and `--force` to overwrite starter files in a non-empty directory.

```bash
katalix create ./playground --name katalix-playground --force
```

## Web app templates

```bash
katalix create web-app --router react-router
katalix create web-app --router tanstack-router
```

These create Vite React apps with a Katalix-rendered screen, app/navigation/data/storage/web manifests, environment config, manifest tests, release profiles, privacy checklist, and package scripts.

## Mobile app templates

```bash
katalix create mobile-app --target expo
katalix create mobile-app --target react-native
```

These create Expo or plain React Native app shells with a Katalix-rendered screen, app/navigation/data/storage/auth/native manifests, environment config, manifest tests, release profiles, store metadata placeholders, privacy checklist, and package scripts.

## Template verification

```bash
npm run test:templates --workspace @katalix/cli
```

This scaffolds every web/mobile template into temporary directories and checks CI-facing files, manifest tests, release profiles, and privacy checklists.

See [docs/cli.md](../../docs/cli.md), [docs/web-starter.md](../../docs/web-starter.md), [docs/mobile-starter.md](../../docs/mobile-starter.md), [docs/web-testing.md](../../docs/web-testing.md), [docs/mobile-testing.md](../../docs/mobile-testing.md), [docs/web-release.md](../../docs/web-release.md), and [docs/mobile-release.md](../../docs/mobile-release.md).
