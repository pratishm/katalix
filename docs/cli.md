# Katalix CLI

`@katalix/cli` scaffolds Katalix projects without making runtime packages mandatory. The default command still creates a small Katalix Core project; passing a web router or native target opts into the app templates.

## Core starter

```bash
katalix create my-katalix-app
```

This writes a minimal project with a fluent `Screen()` example and an inspection script that prints the normalized semantic tree.

## Web app starter

```bash
katalix create web-app --router react-router
katalix create web-app --router tanstack-router
```

Both commands generate a Vite React app with:

- a Katalix-rendered home screen,
- an app manifest,
- a navigation manifest and selected router adapter contract,
- data, storage, and web runtime manifests,
- `.env.example`,
- release profile files and privacy checklist,
- `dev`, `build`, `preview`, `typecheck`, `test`, `test:e2e`, and release scripts.

See [web-starter.md](./web-starter.md).

## Mobile app starter

```bash
katalix create mobile-app --target expo
katalix create mobile-app --target react-native
```

Both commands generate a normal React Native app shell with:

- a Katalix-rendered home screen,
- app, navigation, data, storage, auth, and native manifests,
- native layout, accessibility, and capability declarations,
- `.env.example`,
- release profile files, store metadata placeholders, and privacy checklist,
- start/typecheck/test/E2E/release scripts.

See [mobile-starter.md](./mobile-starter.md).

## Options

- `--name <name>` overrides the generated package name.
- `--force` allows writing into a non-empty directory.
- `--router react-router|tanstack-router` selects a Vite React web template.
- `--target expo|react-native` selects a mobile template.

`--router` and `--target` are mutually exclusive. Generated apps use ecosystem tooling directly; Katalix provides manifests, renderers, and adapter contracts rather than replacing Vite, React Router, TanStack Router, Expo, or React Native.

## Verification

Run generated-template verification from the repository root:

```bash
npm run test:templates
```

This scaffolds every web/mobile template in temporary directories and checks scripts, manifest tests, release profiles, privacy checklists, and CI-facing template files.
