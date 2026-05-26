# Mobile Starter

`@lattix/cli` can generate Expo and plain React Native app templates.

## Commands

```bash
lattix create mobile-app --target expo
lattix create mobile-app --target react-native
```

The Expo template is the easiest native starting point. The plain React Native template keeps React Native first-class and avoids assuming Expo-only modules.

## Generated structure

```text
mobile-app/
  app.json
  App.tsx
  .env.example
  release-profiles.json
  src/
    App.tsx
    screens/home.screen.ts
    lattix/
      app.ts
      auth.ts
      data.ts
      diagnostics.ts
      native.ts
      navigation.ts
      release.ts
      storage.ts
      manifest.test.ts
  privacy-checklist.md
  store-metadata/README.md
  e2e/home.yml
  package.json
  tsconfig.json
```

Expo starters also include `eas.json`. Plain React Native starters also include `index.js` for `AppRegistry` registration.

## Runtime contracts

The generated app remains a normal React Native app. Lattix owns the declarative contracts:

- `src/screens/home.screen.ts` compiles to a semantic UI tree consumed by `@lattix/react-native`.
- `src/lattix/navigation.ts` emits a React Navigation adapter contract.
- `src/lattix/data.ts`, `storage.ts`, and `auth.ts` declare API, persistence, offline queue, secure-session, guard, and auth-header contracts.
- `src/lattix/native.ts` declares native target metadata, safe area, keyboard, status bar, dynamic type, accessibility, and capability contracts.
- `src/lattix/app.ts` composes the native platform, environment variables, and providers.
- `src/lattix/release.ts`, `release-profiles.json`, and `store-metadata/` describe development, preview, and production release paths.

## Verification

Generated projects include:

```bash
npm run start
npm run typecheck
npm test
npm run test:e2e
npm run release:preview
npm run release:production
```

The template test checks that every generated Lattix manifest is valid. Repository-level `npm run test:templates` verifies both mobile starter variants without emulators. See [mobile-testing.md](./mobile-testing.md) and [mobile-release.md](./mobile-release.md).
