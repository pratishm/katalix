# demo-mobile

Generated with Katalix CLI as a plain React Native starter.

## Getting started

Bare React Native uses Metro for the JS bundle only. Simulators are launched with separate commands.

```bash
npm install
npm run bootstrap   # one-time: ios/ and android/ via @react-native-community/cli
npx katalix doctor  # Watchman, native folders, react 19.0.0 alignment
npm start           # Metro — keep this running (no press i/a; use second terminal)
```

In a **second terminal** (after bootstrap):

```bash
npm run ios
npm run android
```

## Scripts

- `npm run bootstrap` generates `ios/` and `android/` with `@react-native-community/cli init` (official tooling).
- `npm start` starts Metro (`react-native start`).
- `npm run ios` / `npm run android` build and run on a simulator (requires bootstrap).
- `npm test` verifies the generated Katalix manifests.

## Katalix files

- `src/screens/home.screen.ts` defines the sample semantic UI tree.
- `src/katalix/navigation.ts`, `data.ts`, `auth.ts`, and `storage.ts` define app runtime contracts.
- `src/katalix/native.ts` declares the plain React Native target, permissions, layout, and accessibility contracts.
