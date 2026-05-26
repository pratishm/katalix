# Web Release

Phase 21 gives generated Vite React apps a documented path from local development to preview and production.

## Profiles

Generated web starters include:

- `.env.development`
- `.env.preview`
- `.env.production`
- `src/lattix/release.ts`
- `public/_headers`

Use `npm run release:preview` for preview builds and `npm run release:production` for production builds.

## Static Hosting And CDN

Deploy the `dist/` output to a static host or CDN. Preserve `public/_headers` where the host supports it so cache headers and CSP are applied.

Suggested cache policy:

- HTML: `max-age=0, must-revalidate`
- Hashed assets: `max-age=31536000, immutable`
- Source maps: upload to the error reporting provider, then avoid public production serving unless explicitly required.

## Environment Injection

Use profile-specific env files for API URLs, release channels, analytics keys, and source-map behavior. Keep secrets out of client env files.

## CSP And Security

Start from the generated CSP in `public/_headers`, then tighten `connect-src`, `img-src`, and telemetry endpoints for each deployment.

## Error Reporting Releases

Use the release channel in `src/lattix/release.ts` to tag error reporting uploads. Keep preview and production release names distinct so rollback analysis remains clear.

## Preview Deployments

Preview deployments should use `.env.preview`, source maps, and isolated analytics projects. Do not reuse production cookies or production analytics streams.

## Rollback Strategy

Keep the last known-good static artifact available. A rollback should pin the CDN or hosting provider to that artifact, invalidate changed paths, and record the reverted release channel.
