# Mobile Testing

Phase 20 verifies generated Expo and plain React Native starters without requiring heavyweight native services in normal CI.

## Repository checks

Run from the repo root:

```bash
npm run typecheck
npm run build
npm test
npm run test:templates
```

`npm run test:templates` scaffolds both mobile starter variants in temporary directories and checks generated manifests, scripts, release profiles, store metadata placeholders, and privacy checklist files.

## Generated app checks

Generated mobile apps include:

```bash
npm run typecheck
npm test
```

The manifest test checks app, navigation, data, storage, auth, native capability, and release profile contracts. Normal CI should stop here unless a dedicated mobile runner is available.

## Maestro and Detox guidance

Use Maestro for the first generated-app smoke tests:

```bash
npm run test:e2e
```

Recommended first scenarios:

- The home screen renders through `KatalixNativeRenderer`.
- Navigation registers the generated React Navigation screen contracts.
- Session bootstrap shows the authenticated or login flow.
- Offline queue and secure-session manifests are present.

Use Detox later when native binary lifecycle coverage is needed. Keep Maestro/Detox jobs separate from Core checks so contributors can run normal CI without simulators or emulators.
