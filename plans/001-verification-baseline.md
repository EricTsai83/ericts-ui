# Plan 001: Establish a verification baseline — vitest, CI, and dependency hygiene

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f46af2b..HEAD -- package.json AGENTS.md lib/component-search.ts registry/base/hooks/use-scroll-anchor.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests / dx / security
- **Planned at**: commit `f46af2b`, 2026-07-03

## Why this matters

This repo is a shadcn-compatible component registry — its entire value is "install this and it works" — yet it has no test framework, no CI, and no single command that answers "is the codebase green?". Four verification commands exist (`lint`, `typecheck`, `display:check`, `registry:build`) but nothing runs them automatically. Separately, the `shadcn` CLI is declared as a production dependency even though it is only used at build time, which drags `express`, `fast-glob`, and `@modelcontextprotocol/sdk` into the production dependency graph and is the root of every HIGH advisory `pnpm audit --prod` currently reports. This plan fixes the dependency classification, adds vitest with the first real tests, wires a CI workflow, and corrects `AGENTS.md` so agents run the full check set. Every other plan in this directory relies on the baseline this one creates.

## Current state

- `package.json` — scripts are `dev`, `build`, `start`, `display:check`, `lint`, `typecheck`, `registry:build`. There is **no `test` script** and no test runner in `devDependencies`. `shadcn` is listed under `dependencies` (`"shadcn": "^4.11.0"`), but the only usage is the build script:

  ```json
  "build": "pnpm registry:build && next build",
  ...
  "registry:build": "shadcn build"
  ```

  No source file imports the `shadcn` package — all in-code references (e.g. `components/registry-install-command.tsx`) are user-facing install-command *strings*.
- `pnpm audit --prod` currently reports two HIGH advisories, both reachable only through `shadcn`: `picomatch <2.3.2` (via `shadcn>fast-glob>micromatch>picomatch`) and `path-to-regexp >=8.0.0 <8.4.0` (via `shadcn>@modelcontextprotocol/sdk>express>router>path-to-regexp`). Moderate advisories via `next>postcss` etc. are out of scope here.
- There is **no `.github/` directory** — no CI of any kind.
- `AGENTS.md` "Task Completion Requirements" currently reads:

  ```
  - Run `pnpm lint` and `pnpm typecheck` before considering code changes complete.
  - Run `pnpm registry:build` when changing files under `registry/`, `registry.json`, install snippets, or registry metadata.
  - There is currently no `format` or `test` script in `package.json`; do not invent one. ...
  ```

  It omits `pnpm display:check` (the consistency checker in `scripts/validate-registry-display.mjs`), and the "no test script" line will be stale once this plan lands.
- Test targets for the first tests (both are pure, deterministic code):
  - `registry/base/hooks/use-scroll-anchor.ts:18-26` exports `scrollAnchorEasings` — four pure `(progress: number) => number` easing functions (`easeOutQuart`, `easeOutCubic`, `easeInOutCubic`, `linear`).
  - `lib/component-search.ts:30` exports `searchRegistryItems(query: string): SortedResult[]` — pure function over the static registry (`lib/registry.ts` imports `@/registry.json`). Returns `[]` for empty queries (line 33-35).
- `tsconfig.json` maps `@/*` to `./*` (plus `@/hooks/*` → `./registry/base/hooks/*`), so a vitest alias for `@` is required.
- Repo conventions: pnpm only (`packageManager: pnpm@11.7.0`); TypeScript strict; never `any`. Commit style is imperative sentence case, e.g. `Migrate registry UI styles to Tailwind v4 variant syntax`.

## Commands you will need

| Purpose        | Command                | Expected on success |
|----------------|------------------------|---------------------|
| Install        | `pnpm install`         | exit 0              |
| Lint           | `pnpm lint`            | exit 0              |
| Typecheck      | `pnpm typecheck`       | exit 0              |
| Display check  | `pnpm display:check`   | prints `Registry display validation passed.` |
| Registry build | `pnpm registry:build`  | exit 0              |
| Audit          | `pnpm audit --prod`    | no critical/high advisories (after Step 1) |
| Tests (new)    | `pnpm test`            | exit 0, all tests pass (after Step 3) |

## Scope

**In scope** (the only files you should modify or create):
- `package.json` (dependency move, `test` script, new devDependencies)
- `pnpm-lock.yaml` (regenerated by `pnpm install` — never hand-edit)
- `vitest.config.ts` (create)
- `tests/scroll-anchor-easings.test.ts` (create)
- `tests/component-search.test.ts` (create)
- `.github/workflows/ci.yml` (create)
- `AGENTS.md` (Task Completion Requirements section only)
- `public/r/*.json` only if `pnpm registry:build` regenerates them after the shadcn bump (commit the regenerated output; do not hand-edit)

**Out of scope** (do NOT touch, even though they look related):
- `lib/component-search.ts` — a scoring bug in it is fixed by plan 002; do not fix it here, and do not write tests that assert the current tier *ordering* (see Step 3).
- Any file under `registry/base/` — component fixes belong to plan 003.
- `scripts/validate-registry-display.mjs` — extended by plan 004.
- Other `dependencies` entries (e.g. `@types/mdx` in dependencies) — leave as-is.

## Git workflow

- Branch: `advisor/001-verification-baseline`
- Commit per step; imperative sentence-case messages matching `git log` style (e.g. `Add vitest baseline and first characterization tests`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move `shadcn` to devDependencies and bump it

In `package.json`, remove `"shadcn": "^4.11.0"` from `dependencies` and add `"shadcn": "^4.12.0"` to `devDependencies`. Run `pnpm install`.

**Verify**: `pnpm registry:build` → exit 0. `pnpm audit --prod` → no critical or high advisories (the two HIGH advisories rooted at `shadcn>` disappear from the production graph; moderate advisories via `next` may remain and are acceptable). If `registry:build` regenerated files under `public/r/`, inspect `git diff --stat public/r` — content-equivalent regeneration is expected and should be committed.

### Step 2: Add vitest and the `test` script

`pnpm add -D vitest`. Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

**Verify**: `pnpm test` → exit 0 with "no test files found" treated as… vitest exits non-zero on zero test files by default; proceed immediately to Step 3 and verify there. `pnpm typecheck` → exit 0.

### Step 3: Write the first two test files

`tests/scroll-anchor-easings.test.ts` — import `{ scrollAnchorEasings }` from `@/registry/base/hooks/use-scroll-anchor`. For each of the four easings assert: `f(0)` ≈ 0 and `f(1)` ≈ 1 (within 1e-9), and that values are non-decreasing across `progress = 0, 0.1, …, 1`.

`tests/component-search.test.ts` — import `{ searchRegistryItems }` from `@/lib/component-search`. Assert:
- `searchRegistryItems("")` returns `[]`.
- `searchRegistryItems("copy button")` returns a non-empty array whose first result has `url === "/components/copy-button"` (exact title match scores 100 — the top tier, safe to pin).
- `searchRegistryItems("c++ (unmatched)")` does not throw and returns an array (regex-special characters are escaped upstream).

Do NOT write assertions about the relative ranking of category-match vs search-term-match results — that ordering has a known bug that plan 002 fixes; pinning it here would make plan 002 fail its own tests.

Use explicit `import { describe, it, expect } from "vitest"` (no globals config).

**Verify**: `pnpm test` → exit 0, 2 files, all tests pass. `pnpm lint` → exit 0. `pnpm typecheck` → exit 0.

### Step 4: Add the CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm display:check
      - run: pnpm registry:build
      - run: pnpm test
```

`pnpm/action-setup@v4` reads the pinned version from the `packageManager` field — do not hardcode a pnpm version.

**Verify**: `node -e "require('js-yaml')"` is not available — instead verify YAML syntax with `pnpm dlx yaml-lint .github/workflows/ci.yml` if available, or simply re-read the file for correct indentation. All five commands in the workflow must already pass locally (run them in sequence one more time).

### Step 5: Update AGENTS.md

In the "Task Completion Requirements" section:
- Add `pnpm display:check` to the first bullet's required commands, and require it whenever registry metadata or display config changes.
- Add `pnpm test` to the required commands.
- Rewrite the line `There is currently no format or test script in package.json; do not invent one.` to state that there is no `format` script (do not invent one) and that tests run via `pnpm test` (vitest).

**Verify**: re-read the section; it must mention all five commands: lint, typecheck, display:check, registry:build, test.

## Test plan

The new tests ARE the deliverable of Steps 2–3:
- `tests/scroll-anchor-easings.test.ts`: 4 easings × (endpoints + monotonicity).
- `tests/component-search.test.ts`: empty query, exact-title top hit, regex-special input safety.
- No existing tests exist to model after — these two files become the structural pattern for future plans (002, 003 reference them).
- Verification: `pnpm test` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n '"shadcn"' package.json` shows it only under `devDependencies`, version `^4.12.0`
- [ ] `pnpm audit --prod` reports zero critical and zero high advisories
- [ ] `pnpm test` exits 0 with both new test files passing
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm display:check`, `pnpm registry:build` all exit 0
- [ ] `.github/workflows/ci.yml` exists and lists all five check commands
- [ ] `AGENTS.md` names `pnpm display:check` and `pnpm test` in Task Completion Requirements
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm audit --prod` still shows HIGH advisories rooted at `shadcn>` after the bump to `^4.12.0` — report the advisory paths and versions instead of chasing transitive overrides.
- `pnpm registry:build` fails after moving `shadcn` to devDependencies.
- vitest cannot resolve `@/lib/...` or `@/registry/...` imports after Step 2's alias config.
- `searchRegistryItems("copy button")` does not return `/components/copy-button` first — the registry data drifted; report rather than loosening the assertion.

## Maintenance notes

- Plans 002 and 003 add more test files under `tests/` and extend devDependencies (jsdom, testing-library) — this plan deliberately installs only vitest.
- Plan 004 appends a `git diff --exit-code -- public/r` staleness step to this CI workflow.
- Reviewer should scrutinize: that `pnpm registry:build` still works in CI where devDependencies are installed (it does with `pnpm install --frozen-lockfile`; it would NOT with `--prod` installs), and that the shadcn bump didn't change `public/r` payload semantics (diff should be formatting/metadata only, if anything).
- Deferred: moving `@types/mdx` out of `dependencies` (harmless today); Node version pinning via `engines`.
