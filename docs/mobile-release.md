# Mobile Release

Phase 21 gives generated Expo and plain React Native apps a documented path from local development to internal testing and store submission.

## Profiles

Generated mobile starters include:

- `release-profiles.json`
- `src/katalix/release.ts`
- `privacy-checklist.md`
- `store-metadata/README.md`

Expo starters also include `eas.json` with development, preview, and production profiles.

## EAS Build

For Expo starters:

```bash
npm run release:preview
npm run release:production
```

Preview builds use internal distribution. Production builds should use store distribution, app identifiers, and store metadata from `store-metadata/`.

## TestFlight And Play Console

Use the generated `storeSubmission` metadata in `src/katalix/release.ts` to keep iOS and Android identifiers aligned:

- iOS target: TestFlight
- Android target: Play Console
- Metadata path: `store-metadata`

Plain React Native starters should wire the same profile names into the native signing/build system selected by the host app.

## Versioning And Signing

Keep version names, build numbers, signing identities, and app identifiers profile-specific. Production signing credentials should not be used for local development.

## OTA Updates

Expo apps may use update channels that match `development`, `preview`, and `production`. Plain React Native apps should document the OTA provider separately if one is added.

## Store Metadata

Before submission, fill in descriptions, screenshots, support URL, privacy policy URL, age rating, data safety answers, and review notes under `store-metadata/`.

## Privacy

Complete `privacy-checklist.md` before internal testing. Pay special attention to permissions, analytics, secure storage, crash reporting, cookies used in embedded web flows, and PII handling.
