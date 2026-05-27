# Releasing

Katalix uses release-gated phases. After each phase, verify the repo, update docs, update `handover.md`, summarize known limitations, and stop for release approval.

## Pre-release checklist

Run these commands from the repository root:

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm test
npm run test:templates
npm run example:web
npm run example:native
npm run example:motion
npm run example:patterns
```

## Package readiness

Each publishable package should include:

- `name`, `version`, `description`, and `license`
- `type`, `main`, `types`, and `exports`
- `files: ["dist"]`
- `build`, `typecheck`, `test`, and `clean` scripts where relevant
- focused tests for public behavior

## Release notes

For each phase, document:

- completed work
- verification commands and results
- known limitations
- migration notes, if any
- whether the phase is ready to release

Do not start the next phase until the release has been approved.

## App Template Release Checks

For web/mobile app templates, also review:

- [web-testing.md](./web-testing.md)
- [mobile-testing.md](./mobile-testing.md)
- [web-release.md](./web-release.md)
- [mobile-release.md](./mobile-release.md)
- [privacy-checklist.md](./privacy-checklist.md)

Normal CI verifies generated template contents without running heavyweight native services. Dedicated app release pipelines should install generated app dependencies and run Playwright, Maestro, Detox, EAS Build, or store submission checks as appropriate.
