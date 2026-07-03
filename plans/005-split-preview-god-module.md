# Plan 005: Split the 2,146-line preview god-module and lazy-load demos per route

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f46af2b..HEAD -- components/registry-preview.tsx components/component-preview-browser.tsx components/component-showcase.tsx components/registry-demo-shell.tsx scripts/validate-registry-display.mjs`
> If any in-scope/consumer file changed since this plan was written, compare
> the "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001-verification-baseline.md (CI safety net). Coordinate with plan 004 (validator parses this file — see STOP conditions).
- **Category**: perf / tech-debt
- **Planned at**: commit `f46af2b`, 2026-07-03

## Why this matters

`components/registry-preview.tsx` is a single 2,146-line `"use client"` module that statically imports ~21 registry components plus `motion` and ~18 lucide icons, and wires every demo into one `previews` map. Because it is one module, the bundler cannot prune per route: the landing page, all component/hook detail pages, and each fullscreen `/view` page (which renders exactly ONE demo) all ship the JavaScript for the ENTIRE demo gallery. The repo has zero `next/dynamic`/`React.lazy` usage. It is also the highest-churn file in the repo (41 commits) — every new component means editing this one buffer. `AGENTS.md` declares "Performance first" — this is the single biggest performance and maintainability win available. The `previews` name→render map is already the natural seam: this plan gives each demo its own file and converts the map to lazy `next/dynamic` entries, so each route downloads only the demos it shows.

## Current state

- `components/registry-preview.tsx`:
  - `:1` — `"use client"`.
  - `:3-87` — static imports: site UI (`Button`, drawer, tabs…), `motion/react`, ~18 lucide icons, and every registry component (`@/registry/base/ui/*`, both `smooth-height` variants, hooks).
  - `:89-92` — the seam:

    ```ts
    // Live previews for registry items, keyed by registry name. Each entry receives
    ...
    const previews: Record<string, (variant: string) => ReactNode> = {
    ```

    with ~24 entries like `"copy-button": () => <CopyButtonPreview />` (some branch on `variant`, e.g. smooth-height's motion vs css-only).
  - `:120-128` — the public component:

    ```tsx
    export function RegistryPreview({ name, variant = "motion" }: { name: string; variant?: string }) {
      return previews[name]?.(variant) ?? null;
    }
    ```

  - `:130-136` — `hasRegistryPreview` and `getRegistryPreviewNames`: **dead exports, zero callers repo-wide** (verified) — delete during this plan.
  - `:137-159` — `PreviewCornerSlotContext` (default `"right-3 top-3"`) + exported `PreviewCornerSlotProvider`.
  - `:160-188` — `ReplayablePreview` (replay-button wrapper reading the corner-slot context).
  - Remainder (~1,950 lines) — per-item demo components and their inline fixtures (e.g. `CopyButtonPreview`, `AdaptiveDrawerDemoActions`, `staggeredEntranceItems`, OTP demo harness).
- Consumers (all `"use client"`; none may need import changes if re-exports are kept):
  - `components/component-preview-browser.tsx:7` — `import { RegistryPreview } from "@/components/registry-preview";` rendered by the landing page (`app/(app)/(root)/page.tsx:266`).
  - `components/component-showcase.tsx:16-19` — imports `PreviewCornerSlotProvider, RegistryPreview` (every detail page).
  - `components/registry-demo-shell.tsx:15-18` — imports `PreviewCornerSlotProvider, RegistryPreview` (every `/view/[style]/[name]` page).
- **Hard constraint**: `scripts/validate-registry-display.mjs:9` hardcodes `components/registry-preview.tsx` and `readObjectMapKeys(previewSource, "previews")` (`:208-223`) AST-requires a variable named `previews` initialized with an **object literal** whose properties are plain property assignments in that file. Keys must remain string literals; values may be any expression (call expressions like `dynamic(...)` are fine).
- Path alias: `@/*` → repo root (`tsconfig.json`). Conventions: TypeScript strict, no `any`; imperative sentence-case commits.
- `AGENTS.md` says "Do not run production builds unless explicitly asked" — **this plan explicitly asks**: `pnpm build` is required for the before/after bundle measurement in Steps 1 and 7.

## Commands you will need

| Purpose        | Command               | Expected on success |
|----------------|-----------------------|---------------------|
| Lint           | `pnpm lint`           | exit 0              |
| Typecheck      | `pnpm typecheck`      | exit 0              |
| Display check  | `pnpm display:check`  | `Registry display validation passed.` |
| Registry build | `pnpm registry:build` | exit 0              |
| Tests          | `pnpm test`           | exit 0              |
| Prod build     | `pnpm build`          | exit 0; per-route "First Load JS" table printed |

## Scope

**In scope** (the only files you should modify or create):
- `components/registry-preview.tsx` (shrinks to: map of dynamic entries + `RegistryPreview` + re-exports)
- `components/previews/replayable-preview.tsx` (create — shared infra)
- `components/previews/<item-name>.tsx` (create — one per demo, ~24 files)
- `components/previews/` shared fixture module(s) only if two demos genuinely share data (prefer colocating fixtures in the demo file)

**Out of scope** (do NOT touch, even though they look related):
- `components/component-preview-browser.tsx`, `component-showcase.tsx`, `registry-demo-shell.tsx` — keep their imports working via re-exports; if you find yourself editing them, you broke the contract.
- `scripts/validate-registry-display.mjs` — plan 004 owns it; the `previews` object literal must keep satisfying its parser as-is.
- Anything under `registry/base/` — demos move, product code does not.
- `app/` routes.

## Git workflow

- Branch: `advisor/005-split-preview-god-module`
- Commit per batch (Steps 3a-3d) plus one per structural step; messages like `Extract copy-button and status-button previews into demo modules`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Record the bundle baseline

Run `pnpm build` and save the output table (copy it into the PR description / commit message body). Record "First Load JS" for at least: `/` (landing), `/components/[name]`, `/view/[style]/[name]`.

**Verify**: `pnpm build` → exit 0 and you have the three numbers written down.

### Step 2: Extract the shared preview infra

Create `components/previews/replayable-preview.tsx` (`"use client"`) containing, moved verbatim from `registry-preview.tsx:137-188`: `PreviewCornerSlotContext`, `PreviewCornerSlotProvider`, `ReplayablePreview`, plus a small exported hook `usePreviewCornerSlot()` returning `useContext(PreviewCornerSlotContext)` for demos that read the context directly. In `registry-preview.tsx`, delete the moved code and add `export { PreviewCornerSlotProvider } from "@/components/previews/replayable-preview";` so the two consumer imports keep resolving.

**Verify**: `pnpm typecheck` → exit 0; `pnpm lint` → exit 0; `pnpm display:check` → passes.

### Step 3 (a–d): Move demos into per-item files, in four batches

For each registry item key in the `previews` map, create `components/previews/<item-name>.tsx`:
- `"use client"` at top.
- Default-export a component `export default function Preview({ variant }: { variant: string })` that contains what the map entry's arrow function returned, plus that demo's components and fixtures moved from the god module (e.g. `CopyButtonPreview` and anything only it uses). Demos that ignore `variant` still accept the prop.
- Import `ReplayablePreview`/`usePreviewCornerSlot` from `@/components/previews/replayable-preview` where the moved code used them.

During this step keep `registry-preview.tsx`'s map entries as **eager imports** of the new files (`import CopyButtonPreview from "@/components/previews/copy-button";` … `"copy-button": (variant) => <CopyButtonPreview variant={variant} />`) so each batch is independently verifiable with no behavior change. Work in four batches of ~6 items, committing per batch.

**Verify after every batch**: `pnpm lint` → exit 0; `pnpm typecheck` → exit 0; `pnpm display:check` → passes (map keys unchanged).

### Step 4: Convert the map to lazy entries

In `components/registry-preview.tsx`, replace the eager imports with `next/dynamic`:

```tsx
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type PreviewComponent = ComponentType<{ variant: string }>;

const previews: Record<string, PreviewComponent> = {
  "copy-button": dynamic(() => import("@/components/previews/copy-button")),
  "status-button": dynamic(() => import("@/components/previews/status-button")),
  // ... one line per item, string-literal keys, statically analyzable import paths
};

export function RegistryPreview({
  name,
  variant = "motion",
}: {
  name: string;
  variant?: string;
}) {
  const Preview = previews[name];
  return Preview ? <Preview variant={variant} /> : null;
}
```

Rules: keys stay string literals (validator contract); every `import()` argument is a static string (bundler contract); default `loading` (none) is acceptable — do not invent skeletons.

**Verify**: `pnpm typecheck` → exit 0; `pnpm display:check` → passes (this is the step most likely to break the AST parse — if it fails, STOP).

### Step 5: Delete the dead exports

Remove `hasRegistryPreview` and `getRegistryPreviewNames` from `registry-preview.tsx`. First re-confirm zero callers: `grep -rn "hasRegistryPreview\|getRegistryPreviewNames" app components lib scripts` must return only the definitions you are deleting.

**Verify**: the grep post-deletion returns nothing; `pnpm typecheck` → exit 0.

### Step 6: Full local gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm display:check && pnpm registry:build && pnpm test` → all exit 0.

### Step 7: Measure and confirm the win

Run `pnpm build`. Compare against Step 1's numbers.

**Verify**: `pnpm build` → exit 0, and First Load JS decreases materially on `/` and `/view/[style]/[name]` (the fullscreen route previously shipped all ~24 demos to render one). If the numbers do NOT drop, that is a STOP condition — likely a shared chunk is still pulling everything (e.g. a fixtures module importing many registry components, or a demo file importing the map).

## Test plan

No new unit tests: the behavior contract is "same demos render at the same routes", which is covered by (a) `display:check`'s registry↔preview parity, (b) typecheck across the re-export surface, and (c) the bundle measurement. If plan 003's jsdom layer exists, optionally add `tests/registry-preview.test.tsx` asserting `RegistryPreview({ name: "nonexistent" })` renders null — do not block on it.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `wc -l components/registry-preview.tsx` ≤ 150
- [ ] `ls components/previews/*.tsx | wc -l` ≥ 24 (one per map key + replayable-preview)
- [ ] `grep -c "dynamic(() => import(" components/registry-preview.tsx` equals the number of `previews` keys
- [ ] `grep -rn "hasRegistryPreview\|getRegistryPreviewNames" app components lib scripts` → no matches
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm display:check`, `pnpm registry:build`, `pnpm test` all exit 0
- [ ] `pnpm build` exits 0; First Load JS for `/` and `/view/[style]/[name]` lower than the Step 1 baseline (numbers recorded in the PR/commit body)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm display:check` fails to parse the `previews` map after Step 4 — do NOT edit `scripts/validate-registry-display.mjs` (plan 004 owns it); report the parse error and the map shape you produced.
- Keeping a consumer working seems to require editing `component-preview-browser.tsx`, `component-showcase.tsx`, or `registry-demo-shell.tsx` — the re-export contract failed; report which import broke.
- Step 7 shows no meaningful First Load JS reduction — report the before/after table and your hypothesis; do not start restructuring chunks speculatively.
- A demo turns out to depend on module-level shared mutable state in the god module (not just shared fixtures) — report it; per-file extraction may change its behavior.
- You find a caller of `hasRegistryPreview`/`getRegistryPreviewNames` that appeared since `f46af2b`.

## Maintenance notes

- New registry items now require: demo file in `components/previews/<name>.tsx` + one `dynamic()` map line. `display:check` still enforces map coverage — that contract is what keeps this refactor safe; if plan 004's executor changes the parser, the `previews` literal here must stay compatible.
- Reviewer should scrutinize: that demos land with `loading` unset (no invented skeletons), that no demo file imports `registry-preview.tsx` back (cycle), and that fixtures didn't get duplicated across demo files.
- Deferred: a loading placeholder strategy for the fullscreen `/view` route if the null-flash is visible in practice (evaluate after this lands, with the maintainer's design preferences — see memory: previews own their layout bounds); route-level `generateStaticParams` interplay is unchanged by this plan.
