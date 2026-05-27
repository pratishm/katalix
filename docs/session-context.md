# Katalix Development Session Context

## What was done in this session

### 1. README cleanup

Removed all references to internal development artifacts that should not appear in a public-facing README:

- Removed every mention of **phases** (e.g. "Phase 1", "Phase 4+", "Phases 5–6")
- Removed the reference to `katalix_master_prompt_v3.md` from the Contributing section
- Removed the numbered roadmap and replaced it with a plain `Completed capabilities` list
- Replaced the `Status` column in the features table (which showed "✅ Phase N") with a simple feature list

---

### 2. README restructuring

Added a new top-level section **"Build an app with Katalix"** placed right after "Key features" (near the top of the README so users don't have to scroll far). This section contains:

- `npm install katalix` install command (see note below)
- All CLI scaffold commands
- A **prompt format guide** for users and AI agents — a structured template they can use when asking an AI to build an app with Katalix

The `Installation`, `Quick start`, and duplicate CLI command sections that were buried further down were removed and consolidated into this single top section.

---

### 3. Package versioning: upgraded all packages to `1.0.0`

Every workspace package `version` and every internal `@katalix/*` dependency reference was updated from `0.1.0` → `1.0.0`. This covered:

- All 16 `packages/*/package.json` files
- The umbrella `packages/katalix/package.json`
- CLI-generated starter template `package.json` strings inside `packages/cli/src/index.ts`
- Test assertions in `packages/cli/src/index.test.ts` and `packages/katalix/src/package.test.ts`
- `package-lock.json` (regenerated via `npm install --package-lock-only`)

Full build (`npm run build`) and test suite (`npm test`) pass after this change.

---

### 4. New umbrella package: `packages/katalix`

A new workspace package was created at `packages/katalix/` to serve as the published `katalix` entry point. Its purpose is to make `npm install katalix` install the mandatory framework packages automatically.

**Mandatory dependencies** (installed with `katalix`):
- `@katalix/core`
- `@katalix/dsl`
- `@katalix/diagnostics`
- `@katalix/tokens`
- `@katalix/motion`
- `@katalix/patterns`
- `@katalix/cli`

**Optional peer dependencies** (installed by each generated app template as needed):
- `@katalix/app`
- `@katalix/auth`
- `@katalix/data`
- `@katalix/native`
- `@katalix/navigation`
- `@katalix/react`
- `@katalix/react-native`
- `@katalix/storage`
- `@katalix/web`

The umbrella also exposes the `katalix` CLI binary by proxying through `@katalix/cli/cli`.

---

### 5. npm naming issue (blocking — unresolved)

#### The problem

The unscoped npm package name `katalix` is **owned by a different user (`chenxizhang`)**. This was confirmed by:

```bash
npm owner ls katalix
# chenxizhang <ares@xizhang.com>

npm view katalix version
# 1.2.2

npm view katalix description
# "Distributed agent orchestration, without a control plane."
```

`katalix@1.0.0` does not exist on the registry, which is why `npm install katalix@1.0.0` returns `ETARGET`.

The `@katalix/*` org/scope **is** owned by `pratishm7` (your npm username), and all scoped packages were published at `1.0.0` correctly. But the org scope and the unscoped package name are two separate things on npm.

#### Root cause (plain English)

Creating an npm organisation called `katalix` gives you the right to publish `@katalix/anything`. It does **not** reserve or grant ownership of the unscoped name `katalix`. That name was already taken.

#### Current state

| Package | Owner | Version on npm |
|---------|-------|----------------|
| `katalix` | `chenxizhang` | `1.2.2` (latest) |
| `@katalix/core` | `pratishm7` | `1.0.0` |
| `@katalix/dsl` | `pratishm7` | `1.0.0` |
| `@katalix/cli` | `pratishm7` | `1.0.0` |
| … all other `@katalix/*` | `pratishm7` | `1.0.0` |

#### Options going forward

**Option A — Use the scoped CLI (works right now)**

Change all README install/create commands to use the scoped package:

```bash
npx @katalix/cli@1.0.0 create mobile-app --target react-native
npm install @katalix/core @katalix/dsl
```

**Option B — Publish under a new unscoped name you control**

Pick a free unscoped name (e.g. `katalix-ui`, `create-katalix-app`) and publish the umbrella under that.

**Option C — Acquire the `katalix` name**

Contact `chenxizhang` to transfer or add you as owner. Until that happens, `npm install katalix` will always install the other project.

---

## Current README structure (top-level sections in order)

1. Title + description
2. Why Katalix exists
3. Main wedge and philosophy
4. Key features (flat list, no status column, no phases)
5. **Build an app with Katalix** ← new near-top section with install commands + prompt format guide
6. Architecture overview
7. Fluent DSL overview
8. Semantic tree overview
9. Diagnostics and debugging
10. Styling model
11. Animation model
12. Package overview (table, includes `katalix` umbrella row)
13. Fluent example
14. Semantic tree example
15. Web renderer example
16. React Native renderer example
17. Patterns example
18. CLI starter details
19. App runtime manifest example
20. Validation and diagnostics example
21. Current maturity (replaces "Current rollout phase")
22. Contributing
23. License
24. Completed capabilities (replaces "Roadmap" with numbered phases)

---

## Files changed in this session

| File | Change |
|------|--------|
| `README.md` | Phase/prompt cleanup, restructure, prompt guide, install commands |
| `package.json` | Renamed to `katalix-monorepo` (private root, not published) |
| `tsconfig.json` | Added `packages/katalix` reference |
| `packages/katalix/package.json` | New umbrella package |
| `packages/katalix/tsconfig.json` | New |
| `packages/katalix/src/index.ts` | Re-exports mandatory packages |
| `packages/katalix/src/cli.ts` | Proxies to `@katalix/cli` binary |
| `packages/katalix/src/package.test.ts` | Tests umbrella manifest structure |
| `packages/cli/package.json` | Added `./cli` export entry |
| `packages/*/package.json` (all 16) | Version bumped to `1.0.0` |
| `packages/cli/src/index.ts` | Template version strings `0.1.0` → `1.0.0` |
| `packages/cli/src/index.test.ts` | Test version assertions updated |
| `package-lock.json` | Regenerated |
