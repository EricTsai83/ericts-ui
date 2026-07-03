# Plan 002: Fix the search scoring tier order and pin it with table-driven tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f46af2b..HEAD -- lib/component-search.ts`
> If the file changed since this plan was written, compare the
> "Current state" excerpt against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md (vitest must exist)
- **Category**: bug / tests
- **Planned at**: commit `f46af2b`, 2026-07-03

## Why this matters

`lib/component-search.ts` ranks registry items for the public `/api/search` endpoint and the site's search dialog. Its scoring ladder returns on the first matching tier, but the tiers are not checked in descending score order: the category-substring tier (score 40) is checked *before* the exact-search-term tier (55) and prefix-search-term tier (50). An item whose category contains the query AND whose search terms match it exactly gets 40 instead of 55, so it ranks below items it should outrank. The fix is a small reorder; the real deliverable is a table-driven test suite so ranking logic can never silently drift again (this is exactly the class of bug tests-for-pure-functions exist to catch).

## Current state

- `lib/component-search.ts:134-193` — `getRegistryItemScore` (module-private, NOT exported). The buggy ladder, verbatim from `lib/component-search.ts:160-193`:

  ```ts
  if (normalizedName === query || normalizedTitle === query) {
    return 100;
  }

  if (normalizedName.startsWith(query) || normalizedTitle.startsWith(query)) {
    return 80;
  }

  if (normalizedName.includes(query) || normalizedTitle.includes(query)) {
    return 60;
  }

  if (normalizedCategory.includes(query)) {
    return 40;
  }

  if (normalizedSearchTerms.some((term) => term === query)) {
    return 55;
  }

  if (normalizedSearchTerms.some((term) => term.startsWith(query))) {
    return 50;
  }

  if (normalizedSearchTerms.some((term) => term.includes(query))) {
    return 45;
  }

  if (query.split(" ").every((term) => searchableText.includes(term))) {
    return 20;
  }

  return 0;
  ```

  The bug: the `return 40` category check sits above the 55/50/45 search-term checks. Correct behavior is tiers evaluated in strictly descending score order: 100, 80, 60, **55, 50, 45, 40**, 20.
- `getRegistryItemScore` is called only from `searchRegistryItems` (`lib/component-search.ts:46`). `searchRegistryItems` is consumed by `app/api/search/route.ts:18` and the search dialog.
- Search terms are built in `lib/registry.ts:70-83` (`getSearchTerms`): name, title, category, categories, `meta.effects`, plus CSS-only phrases. Category strings therefore also appear *inside* search terms — which is why the misordering has real collisions.
- Conventions: TypeScript strict, no `any`. Test pattern: `tests/component-search.test.ts` from plan 001 (explicit `import { describe, it, expect } from "vitest"`).

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Tests     | `pnpm test`      | exit 0, all pass    |
| Lint      | `pnpm lint`      | exit 0              |
| Typecheck | `pnpm typecheck` | exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `lib/component-search.ts` (reorder tiers; export `getRegistryItemScore`)
- `tests/component-search-scoring.test.ts` (create)
- `tests/component-search.test.ts` (extend only if an existing assertion conflicts — see STOP conditions)

**Out of scope** (do NOT touch, even though they look related):
- `lib/registry.ts` (`getSearchTerms`) — its term construction is intentional.
- `app/api/search/route.ts` and `components/docs-search.tsx` — consumers; no changes needed.
- The `highlightText`/`escapeHtml` helpers in the same file — no behavior change.
- Score *values* (100/80/60/55/50/45/40/20) — reorder the checks, do not retune the numbers.

## Git workflow

- Branch: `advisor/002-search-scoring-tier-order`
- Single commit is fine; message style: `Fix search scoring tier order and add scoring tests`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Reorder the tiers and export the function

In `lib/component-search.ts`, move the `normalizedCategory.includes(query)` / `return 40` block so it sits *after* the three `normalizedSearchTerms` blocks (55, 50, 45) and *before* the `query.split(" ")` block (20). Change `function getRegistryItemScore(` to `export function getRegistryItemScore(` so tests can exercise it directly (this is site-internal lib code, not a shipped registry item — a test-motivated export is acceptable here).

**Verify**: `pnpm typecheck` → exit 0. `pnpm lint` → exit 0.

### Step 2: Write the table-driven scoring tests

Create `tests/component-search-scoring.test.ts` importing `{ getRegistryItemScore, searchRegistryItems }` from `@/lib/component-search`. Note: `getRegistryItemScore` expects an already-normalized query (lowercase, hyphens/underscores → spaces, camelCase split) — pass pre-normalized inputs in the table.

Table-driven cases (one `it` per row or a `it.each`) — every tier plus the regression:

| case | args (query / name / title / category / searchTerms) | expected |
|---|---|---|
| exact name | `"copy button"` / `"copy button"` / `"Copy Button"` / `"button"` / `[]` | 100 |
| prefix name | `"copy"` / `"copy button"` / … / `"button"` / `[]` | 80 |
| name includes | `"py but"` / `"copy button"` / … / `"button"` / `[]` | 60 |
| **regression: exact term beats category substring** | query `"pill"` / name `"status marker"` / title `"status marker"` / category `"pill group"` / terms `["pill"]` | **55** (was 40) |
| prefix term beats category substring | query `"pil"` / same as above / terms `["pillar"]` | 50 |
| term includes beats category substring | query `"ill"` / same / terms `["pillar"]` | 45 |
| category substring only | query `"pill"` / name `"status marker"` / title `"status marker"` / category `"pill group"` / terms `[]` | 40 |
| all-words fallback | query `"status group"` / name `"status marker"` / category `"pill group"` / terms `[]` | 20 |
| no match | query `"zzz"` / … | 0 |

Add one integration assertion through the public API: `searchRegistryItems("copy button")` still returns `/components/copy-button` first (guards against a botched reorder breaking the happy path).

**Verify**: `pnpm test` → exit 0; the regression row would return 40 against the pre-fix code — you can sanity-check by mentally walking the old ladder, not by reverting.

## Test plan

- New file `tests/component-search-scoring.test.ts` as specified in Step 2 (9 table rows + 1 integration assertion), modeled structurally on `tests/component-search.test.ts` from plan 001.
- Verification: `pnpm test` → all pass, including 10 new assertions.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] In `lib/component-search.ts`, the `return 40` category block appears textually after the `return 45` block and before the `return 20` block
- [ ] `grep -n "export function getRegistryItemScore" lib/component-search.ts` matches
- [ ] `pnpm test` exits 0 including `tests/component-search-scoring.test.ts`
- [ ] `pnpm lint` and `pnpm typecheck` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The ladder in `lib/component-search.ts` no longer matches the excerpt above (drift — someone may have already fixed or restructured it).
- An existing test in `tests/component-search.test.ts` fails after the reorder — plan 001 was instructed not to pin tier ordering; if it did anyway, report the conflict instead of rewriting plan 001's assertions.
- `searchRegistryItems("copy button")` no longer returns `/components/copy-button` first after the fix — the reorder touched more than it should.

## Maintenance notes

- Future scoring changes (new tiers, retuned values) must update the table in `tests/component-search-scoring.test.ts` deliberately — that friction is the point.
- Reviewer should scrutinize: that only the category block moved (diff should show one relocated block plus the `export` keyword), and that no score values changed.
- Deferred (out of scope here): `components/docs-search.tsx` renders result HTML via `dangerouslySetInnerHTML` and relies on upstream escaping — a latent-fragility hardening noted in the audit (SECURITY-03), tracked in `plans/README.md` deferred list.
