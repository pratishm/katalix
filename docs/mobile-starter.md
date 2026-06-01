# Mobile Starter

`@katalix/cli` can generate Expo and plain React Native app templates.

## Commands

```bash
katalix create mobile-app --target expo
katalix create mobile-app --target react-native
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
    katalix/
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

Expo starters also include `eas.json` and `scripts/bootstrap-native.mjs`. Plain React Native starters also include `index.js`, `metro.config.js`, `babel.config.js`, and `scripts/bootstrap-native.cjs`.

Neither template ships committed `ios/` or `android/` folders. Run `npm run bootstrap` after `npm install` to generate them with official tooling:

- **Expo:** `expo prebuild`
- **Plain React Native:** `@react-native-community/cli init` (copies only the native projects into your app)

Then use `npm start` and, in a second terminal, `npm run ios` / `npm run android`. Expo also supports `npm start` with **press i / press a** before bootstrap (Expo Go).

## Runtime contracts

The generated app remains a normal React Native app. Katalix owns the declarative contracts:

- `src/screens/home.screen.ts` compiles to a semantic UI tree consumed by `@katalix/react-native`.
- `src/katalix/navigation.ts` emits a React Navigation adapter contract.
- `src/katalix/data.ts`, `storage.ts`, and `auth.ts` declare API, persistence, offline queue, secure-session, guard, and auth-header contracts.
- `src/katalix/native.ts` declares native target metadata, safe area, keyboard, status bar, dynamic type, accessibility, and capability contracts.
- `src/katalix/app.ts` composes the native platform, environment variables, and providers.
- `src/katalix/release.ts`, `release-profiles.json`, and `store-metadata/` describe development, preview, and production release paths.

## Verification

Generated projects include:

```bash
npm install
npm run bootstrap
npm run start
npm run typecheck
npm test
npm run test:e2e
npm run release:preview
npm run release:production
```

The template test checks that every generated Katalix manifest is valid. Repository-level `npm run test:templates` verifies both mobile starter variants without emulators. See [mobile-testing.md](./mobile-testing.md) and [mobile-release.md](./mobile-release.md).
