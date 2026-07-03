# Plan 004: Make the registry pipeline self-verifying (file existence, cssOnly consistency, published-output checks)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f46af2b..HEAD -- scripts/validate-registry-display.mjs registry.json .github/workflows/ci.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md (CI workflow must exist)
- **Category**: tests / docs
- **Planned at**: commit `f46af2b`, 2026-07-03

## Why this matters

The product is the registry pipeline: `registry.json` declares items → `shadcn build` publishes `public/r/*.json` → users install from there. Today nothing verifies that a declared `files[].path` actually exists on disk (`lib/registry-code.tsx`'s `readOptionalFile` swallows read errors into an empty string, so a renamed file silently ships an empty code block), nothing verifies the published `public/r` output matches the current `registry.json`, and one item already carries a broken promise: `staggered-entrance` sets `meta.cssOnly: true`, which the site renders as a "CSS-only alternative" badge and search terms — but no `registry/base/css-only/staggered-entrance.*` files exist, so the advertised alternative tab never appears. This plan extends the existing validator (`pnpm display:check`) with three structural checks, fixes the mislabel, and adds a CI staleness gate so the published payloads can never drift from source again.

## Current state

- `scripts/validate-registry-display.mjs` — plain Node script, run via `pnpm display:check`, exits 1 with an error list or prints `Registry display validation passed.`. It currently validates only *display* consistency: duplicate names, category slugs, registry↔display coverage, kinds, and preview keys (it AST-parses `components/registry-preview.tsx` via the `typescript` package). Existing checks are top-level function calls appended to an `errors` array (lines 22-30) — e.g. `validateDuplicateDisplayNames()`, `validateBrowsablePreviews()`. **It never touches the filesystem beyond reading the three source files** — no `fs.existsSync` on `files[].path`, no check of `public/r/`.
- `registry.json` — 25 items. The `staggered-entrance` entry (around line 461-484):

  ```json
  {
    "name": "staggered-entrance",
    "type": "registry:ui",
    "title": "Staggered List",
    "description": "A CSS-powered staggered entrance primitive for lists, cards, steps, rows, and search results.",
    "categories": ["list"],
    "meta": {
      "tags": ["stagger", "entrance", "css-only", "list-animation"],
      "effects": ["stagger", "fade", "slide"],
      "cssOnly": true
    },
    ...
  }
  ```

- The rendered meaning of `meta.cssOnly` everywhere in the site is "a CSS-only *alternative* implementation exists":
  - `lib/registry.ts:66-83` — `hasCssOnlySupport` gates search terms `"css-only alternative"`, `"css version"`, etc.
  - `components/registry-items-browser.tsx:54` — renders the CSS-only metadata label from the flag.
  - `lib/registry-code.tsx:130-141` — `getCssOnlyFiles` shows the "CSS only" code tab **only if BOTH** `registry/base/css-only/{name}.css` **and** `registry/base/css-only/{name}.tsx` exist.
- `ls registry/base/css-only/` → `copy-button.css`, `copy-button.tsx`, `smooth-height.css`, `smooth-height.tsx`. The other two flagged items (`smooth-height`, `copy-button`) are consistent; `staggered-entrance` is not (its base implementation is CSS-*powered*, which the description and `tags` already say — that is a different fact than "has an alternative").
- `public/r/` currently contains exactly one JSON per item (25) plus `registry.json` — clean today; the check is preventive.
- `.github/workflows/ci.yml` (created by plan 001) runs `pnpm registry:build` but does not fail on a dirty `public/r` afterward.
- Validator conventions to match: each check is a small top-level function pushing human-readable strings into `errors`; follow the phrasing style of the existing messages.

## Commands you will need

| Purpose        | Command                                     | Expected on success |
|----------------|---------------------------------------------|---------------------|
| Display check  | `pnpm display:check`                        | `Registry display validation passed.` |
| Registry build | `pnpm registry:build`                       | exit 0              |
| Staleness      | `git status --porcelain public/r`           | empty after a fresh build |
| Lint           | `pnpm lint`                                 | exit 0              |
| Typecheck      | `pnpm typecheck`                            | exit 0              |
| Tests          | `pnpm test`                                 | exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `scripts/validate-registry-display.mjs` (three new checks)
- `registry.json` (remove one line: `staggered-entrance`'s `"cssOnly": true`)
- `public/r/staggered-entrance.json` + `public/r/registry.json` (regenerated by `pnpm registry:build` — commit, never hand-edit)
- `.github/workflows/ci.yml` (one added step)

**Out of scope** (do NOT touch, even though they look related):
- `lib/registry-code.tsx` — making `readOptionalFile` loud for *required* files is a worthwhile follow-up but needs care to keep the css-only existence-probing quiet; deferred (see Maintenance notes).
- `lib/registry.ts`, `components/registry-items-browser.tsx`, `component-showcase.tsx` — the flag's rendered semantics are correct; only the data was wrong.
- Adding new css-only variant files — that is direction work (see `plans/README.md` deferred list), not a data fix.
- `components/registry-preview.tsx` — plan 005 restructures it; do not tighten the preview parsing here.

## Git workflow

- Branch: `advisor/004-registry-pipeline-integrity`
- Commit per step; imperative sentence-case messages (e.g. `Validate registry file paths and css-only variants`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Validate that every declared registry file exists

In `scripts/validate-registry-display.mjs`, add `validateRegistryFilesExist()` (called alongside the existing `validate*()` calls): for every `registry.items[].files[].path`, `fs.existsSync(path.join(root, filePath))`; on failure push `` `Registry item "${item.name}" declares missing file: ${filePath}` ``.

**Verify**: `pnpm display:check` → passes (all current paths exist). Temporarily typo one `path` in `registry.json`, re-run → fails naming the item and path; revert the typo, re-run → passes.

### Step 2: Validate cssOnly ⇒ variant files exist

Add `validateCssOnlyVariants()`: for every item with `meta.cssOnly === true`, require both `registry/base/css-only/{name}.css` and `registry/base/css-only/{name}.tsx` to exist; on failure push `` `Registry item "${item.name}" sets meta.cssOnly but registry/base/css-only/${item.name}.{css,tsx} is missing.` ``

**Verify**: `pnpm display:check` → FAILS with exactly one error, naming `staggered-entrance`. This expected failure proves the check works — do not fix the data yet.

### Step 3: Remove the stale flag from staggered-entrance

In `registry.json`, delete the `"cssOnly": true` line from the `staggered-entrance` item's `meta` (keep `tags` and `effects` untouched — `"css-only"` in `tags` still records that the base implementation is CSS-powered). Run `pnpm registry:build` and commit the regenerated `public/r/staggered-entrance.json` (and `public/r/registry.json` if it changes).

Known, intended side effects: the item loses the "CSS-only alternative" badge and the `"css-only alternative"`-family search terms (`lib/registry.ts:79-81`) — correct, because the alternative does not exist.

**Verify**: `pnpm display:check` → passes. `grep -A8 '"name": "staggered-entrance"' registry.json | grep cssOnly` → no match.

### Step 4: Validate published output parity

Add `validatePublishedOutput()`: for every item, `public/r/{name}.json` exists; and every `*.json` file in `public/r/` other than `registry.json` corresponds to a current item name (orphan detection for renamed/removed items). Failure messages: `` `Registry item "${name}" has no published payload in public/r — run pnpm registry:build.` `` and `` `public/r/${file} does not match any registry item — stale artifact from a rename?` ``

**Verify**: `pnpm display:check` → passes. `touch public/r/zz-orphan.json`, re-run → fails naming the orphan; `rm public/r/zz-orphan.json`, re-run → passes.

### Step 5: Add the CI staleness gate

First confirm the build is deterministic: run `pnpm registry:build` twice in a row; `git status --porcelain public/r` must be empty after the second run. If it is not (timestamps/ordering churn), this is a STOP condition.

Then in `.github/workflows/ci.yml`, immediately after the `pnpm registry:build` step, add:

```yaml
      - run: git diff --exit-code -- public/r
```

This fails CI whenever someone edits registry source without committing the rebuilt payloads.

**Verify**: local sequence `pnpm registry:build && git diff --exit-code -- public/r` → exit 0 on the final commit of this branch.

## Test plan

The validator is a self-testing script in this plan's shape — each new check is verified by a deliberate breakage + revert in its step (Steps 1, 2, 4), and the real data fix (Step 3) is caught by the Step 2 check before and passes after. No vitest unit tests for the validator in this plan: refactoring the script into importable functions is bigger surgery than the checks themselves (deferred; see Maintenance notes).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "validateRegistryFilesExist\|validateCssOnlyVariants\|validatePublishedOutput" scripts/validate-registry-display.mjs` ≥ 6 (3 definitions + 3 call sites)
- [ ] `pnpm display:check` passes on the final tree
- [ ] `registry.json` has no `cssOnly` key under `staggered-entrance`; `smooth-height` and `copy-button` still have theirs
- [ ] `pnpm registry:build && git diff --exit-code -- public/r` → exit 0
- [ ] `.github/workflows/ci.yml` contains the `git diff --exit-code -- public/r` step after the registry build step
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` all exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm registry:build` output is nondeterministic (Step 5's double-build check leaves a dirty `public/r`) — report the diff; skip the CI gate rather than committing a flaky check.
- Step 2's expected failure names any item other than exactly `staggered-entrance` — the data drifted; report before deleting flags.
- The validator's existing AST parsing of `components/registry-preview.tsx` fails — plan 005 may have landed first and changed the file shape; report, do not patch the parser ad hoc.
- Removing the flag changes any file other than `registry.json` and the two regenerated `public/r` payloads.

## Maintenance notes

- When plan 005 (preview split) lands, the validator's `readObjectMapKeys(previewSource, "previews")` contract must keep holding — the `previews` object literal must remain in `components/registry-preview.tsx`. Reviewer of either PR should check the other's assumptions.
- If a CSS-only variant for `staggered-entrance` (or others) is ever added under `registry/base/css-only/`, restore `meta.cssOnly: true` — Step 2's check will then require both files, which is the point.
- Deferred follow-ups recorded in `plans/README.md`: make `lib/registry-code.tsx` fail the build when a *required* `files[].path` read fails (distinguish it from the intentional css-only existence probe at `registry-code.tsx:130-141`); refactor the validator into importable, unit-testable functions.
