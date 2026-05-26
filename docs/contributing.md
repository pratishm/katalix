# Contributing

Lattix is phase-gated. Before contributing, read the v4 master prompt in `lattix_master_prompt_v3.md` and the current status in `handover.md`.

## Development workflow

1. Keep changes scoped to the active phase.
2. Preserve the Core boundaries: authoring DSL, semantic tree, renderer adapters.
3. Keep runtime concerns out of Core packages until optional App Runtime phases begin.
4. Add tests for new public behavior.
5. Update README, docs, and `handover.md` when behavior or phase status changes.

## Verification

Run the full verification set before opening a PR:

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

Run relevant examples for renderer, motion, or pattern changes:

```bash
npm run example:web
npm run example:native
npm run example:motion
npm run example:patterns
```

## Diagnostics expectations

Diagnostics must be structured, path-aware, source-aware where possible, human-readable, and actionable. Prefer precise field/value/suggestion messages over generic errors.
