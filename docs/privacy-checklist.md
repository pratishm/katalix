# Privacy Checklist

Use this checklist before preview or production releases of generated web and mobile apps.

## Identity And Sessions

- Cookies have documented purpose, expiration, SameSite policy, and secure flags.
- Tokens and session identifiers use secure storage on mobile.
- Logout clears app, browser, and secure native storage where applicable.

## Permissions

- Camera, location, notifications, files, contacts, biometrics, clipboard, and media library permissions explain why access is needed.
- Permission prompts are tied to user intent rather than app startup.
- Denied permissions have a documented fallback path.

## Analytics And Observability

- Analytics events avoid PII unless consent is explicitly declared.
- Crash reports scrub credentials, emails, tokens, and user-generated content.
- Performance spans do not include sensitive URLs or request bodies.

## Storage And Data

- Browser localStorage is not used for secrets.
- Offline queues do not persist raw credentials or unnecessary PII.
- Data retention, export, and deletion paths are documented.

## Release Records

- Preview and production releases record their privacy checklist result.
- Store metadata and web privacy policy URLs match the shipped behavior.
