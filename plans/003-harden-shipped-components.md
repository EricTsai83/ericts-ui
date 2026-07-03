# Plan 003: Harden four shipped registry components (layoutId scoping, SSR effect, key contract, async cancellation)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f46af2b..HEAD -- registry/base/ui/text-morph.tsx registry/base/ui/expandable-toolbar.tsx registry/base/ui/staggered-entrance.tsx registry/base/ui/status-button.tsx registry/base/ui/feedback-popover.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md (vitest must exist)
- **Category**: bug
- **Planned at**: commit `f46af2b`, 2026-07-03

## Why this matters

Files under `registry/base/` are the product: users install them verbatim into their apps via the shadcn CLI, so a latent bug here ships to every consumer. The audit confirmed four small defects: (1) `TextMorph` registers globally-scoped Motion `layoutId`s, so two instances on one page can animate characters between each other; (2) `ExpandableToolbar` uses raw `useLayoutEffect`, which logs an SSR warning in every consumer's Next.js app; (3) `StaggeredEntrance` accepts a non-function `getItemKey` that assigns the *same* React key to every item; (4) `StatusButton` and `FeedbackPopover` schedule timers/state after an awaited action resolves, so unmounting mid-action leaks timers and fires late callbacks. All four fixes are small and isolated; this plan also adds the jsdom test layer that future component plans will reuse.

## Current state

All five files are self-contained registry items ("copy-paste model") — fixes must not introduce imports of other registry items or site code beyond what each file already imports.

- **`registry/base/ui/text-morph.tsx:49-66`** — renders per-character spans with `layoutId={shouldReduceMotion ? undefined : key}` (line 55), where `key` is `` `${char}-${occurrence}` `` (e.g. `"e-0"`) from `generateKeys` (lines 19-30). There is **no `LayoutGroup` wrapper**, so ids are global to the page. Every other layout-animating component in this library scopes its ids (e.g. `floating-select.tsx`, `highlight-tabs.tsx` wrap in `<LayoutGroup id={reactId}>`).
- **`registry/base/ui/expandable-toolbar.tsx`** — imports `useLayoutEffect` from React (line 10) and uses it directly in `useMeasuredWidth` (line 383-387):

  ```ts
  function useMeasuredWidth<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
  ```

  The repo's own convention for this exists in `registry/base/hooks/use-scroll-anchor.ts:11-12`:

  ```ts
  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;
  ```

- **`registry/base/ui/staggered-entrance.tsx:9-11`** — the key prop type permits a bare key:

  ```ts
  type StaggeredEntranceKey<TItem> =
    | React.Key
    | ((item: TItem, index: number) => React.Key);
  ```

  and lines 109-112 use it directly:

  ```ts
  const key =
    typeof getItemKey === "function"
      ? getItemKey(item, index)
      : getItemKey ?? getFallbackKey(content, index);
  ```

  A non-function `getItemKey` (which the type invites) gives every item the identical key → duplicate-key warnings and wrong reconciliation.
- **`registry/base/ui/status-button.tsx:50-83`** — unmount cleanup clears `timers.current` (lines 50-54), but `handleClick` assigns NEW timers after `await onClick?.(event)` (line 75-82). Unmount during the await → cleanup already ran → the post-await timers are never cleared. The `catch` (line 68-71) also calls `setButtonState` unconditionally.
- **`registry/base/ui/feedback-popover.tsx:112-130`** — `submitFeedback` awaits `Promise.all([onSubmit?.(trimmedFeedback), wait(loadingDuration)])`, then calls `setFormState("success")` (line 125) and schedules `setOpen(false)` in a timer (lines 126-128). Unmount cleanup (`clearTimers`) runs before the await resolves; the late timer fires `setOpen`, which can invoke the consumer's open-change callback after unmount.
- After ANY change under `registry/`, `AGENTS.md` requires `pnpm registry:build` (regenerates `public/r/*.json` — commit the regenerated files).
- Test pattern from plan 001: files in `tests/`, explicit vitest imports. This plan adds jsdom-based component tests.

## Commands you will need

| Purpose        | Command               | Expected on success |
|----------------|-----------------------|---------------------|
| Install        | `pnpm install`        | exit 0              |
| Tests          | `pnpm test`           | exit 0, all pass    |
| Lint           | `pnpm lint`           | exit 0              |
| Typecheck      | `pnpm typecheck`      | exit 0              |
| Registry build | `pnpm registry:build` | exit 0              |
| Display check  | `pnpm display:check`  | `Registry display validation passed.` |

## Scope

**In scope** (the only files you should modify or create):
- `registry/base/ui/text-morph.tsx`
- `registry/base/ui/expandable-toolbar.tsx`
- `registry/base/ui/staggered-entrance.tsx`
- `registry/base/ui/status-button.tsx`
- `registry/base/ui/feedback-popover.tsx`
- `package.json` + `pnpm-lock.yaml` (add `jsdom`, `@testing-library/react` as devDependencies)
- `tests/status-button.test.tsx`, `tests/feedback-popover.test.tsx`, `tests/staggered-entrance.test.tsx` (create)
- `public/r/*.json` (regenerated by `pnpm registry:build` — commit, never hand-edit)

**Out of scope** (do NOT touch, even though they look related):
- `registry/base/ui/context-cursor.tsx` — its one-time global `<style>` injection is an accepted id-guarded singleton (recorded as rejected in `plans/README.md`).
- `components/registry-preview.tsx` demos — they keep working unchanged; plan 005 restructures them.
- `registry.json` — no metadata changes here.
- Every other file under `registry/base/` — e.g. do not "fix" other components' easing constants or ResizeObserver usage; those are separate deferred findings.

## Git workflow

- Branch: `advisor/003-harden-shipped-components`
- One commit per component fix (messages like `Scope TextMorph layout ids per instance`), or one commit overall — match the repo's imperative sentence-case style.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the jsdom test layer

`pnpm add -D jsdom @testing-library/react`. No global vitest config change: each component test file starts with the pragma comment `// @vitest-environment jsdom` so node-environment tests from plans 001/002 are unaffected.

**Verify**: `pnpm test` → exit 0 (existing tests still pass).

### Step 2: Scope TextMorph layout ids per instance

In `registry/base/ui/text-morph.tsx`, inside `TextMorph`, add `const uid = React.useId();` and change line 55 to:

```tsx
layoutId={shouldReduceMotion ? undefined : `${uid}-${key}`}
```

Leave `key={key}` unchanged (React keys are already per-instance). Do not add a `LayoutGroup` — the uid prefix achieves the same isolation with a smaller diff.

**Verify**: `pnpm typecheck` → exit 0. `pnpm lint` → exit 0.

### Step 3: Make ExpandableToolbar's measurement effect isomorphic

In `registry/base/ui/expandable-toolbar.tsx`:
1. Add `useEffect` to the existing React import list (line 3-14 region).
2. Below the imports (near the `EASE_OUT` const), add exactly the convention from `use-scroll-anchor.ts:11-12`:

   ```ts
   const useIsomorphicLayoutEffect =
     typeof window === "undefined" ? useEffect : useLayoutEffect;
   ```

3. In `useMeasuredWidth` (line 387), replace the `useLayoutEffect(` call with `useIsomorphicLayoutEffect(`.

Keep the `useLayoutEffect` import — it is referenced by the new const.

**Verify**: `pnpm typecheck` → exit 0. `grep -n "useIsomorphicLayoutEffect" registry/base/ui/expandable-toolbar.tsx` → 2 matches (definition + call site).

### Step 4: Narrow StaggeredEntrance's key contract to functions

In `registry/base/ui/staggered-entrance.tsx`:
1. Change the type (lines 9-11) to:

   ```ts
   type StaggeredEntranceKey<TItem> = (item: TItem, index: number) => React.Key;
   ```

2. Simplify lines 109-112 to:

   ```ts
   const key = getItemKey
     ? getItemKey(item, index)
     : getFallbackKey(content, index);
   ```

This is a type-level breaking change for any consumer passing a bare key — that usage was already broken at runtime (all items got one key), so failing at the type level is the correct outcome for a copy-paste registry item.

**Verify**: `pnpm typecheck` → exit 0 (also proves no site demo passes a non-function key).

### Step 5: Guard StatusButton's post-await scheduling

In `registry/base/ui/status-button.tsx`:
1. Add an `isMountedRef` alongside `timers`: `const isMountedRef = React.useRef(true);`
2. Extend the existing unmount effect (lines 50-54) to set it:

   ```ts
   React.useEffect(() => {
     isMountedRef.current = true;
     return () => {
       isMountedRef.current = false;
       timers.current.forEach(clearTimeout);
     };
   }, []);
   ```

   (Setting `true` on mount keeps the component correct under React Strict Mode's mount→unmount→remount cycle.)
3. In `handleClick`, immediately after `await onClick?.(event)` succeeds AND inside the `catch` block, bail before any state/timer work: `if (!isMountedRef.current) return;`

**Verify**: `pnpm typecheck` → exit 0.

### Step 6: Guard FeedbackPopover the same way

In `registry/base/ui/feedback-popover.tsx`, mirror Step 5: add `isMountedRef`, set/unset it in the existing cleanup effect (the one calling `clearTimers`), and in `submitFeedback` add `if (!isMountedRef.current) return;` after the `await Promise.all(...)` resolves and inside its `catch`, before `setFormState`/timer scheduling.

**Verify**: `pnpm typecheck` → exit 0. `pnpm lint` → exit 0.

### Step 7: Component tests

Create three jsdom test files (all with `// @vitest-environment jsdom` and `import { render, ... } from "@testing-library/react"`):

- `tests/status-button.test.tsx`:
  - Renders `<StatusButton onClick={deferred.promise-returning fn} idleLabel="Go" ...>`; click; `unmount()`; resolve the deferred; flush microtasks (`await Promise.resolve()` twice). Assert with `vi.spyOn(globalThis, "setTimeout")` that no new timeout was scheduled after unmount, and that no `console.error` fired (spy on it — React 19 logs nothing for dropped setState, so the spy also catches act/key warnings).
  - Happy path with `vi.useFakeTimers()`: click, resolve, advance past `loadingDuration` → button shows success label; advance past `successDuration` → back to idle.
- `tests/feedback-popover.test.tsx`: unmount-during-submit case mirroring the above; assert the open-change callback prop is NOT called after unmount.
- `tests/staggered-entrance.test.tsx`: render with `items={["a","b","c"]}` and `renderItem` and no `getItemKey` → 3 children render, no `console.error` (duplicate-key warnings surface there); render with `getItemKey={(item) => item}` → same.

If a component's import pulls in `motion/react` and jsdom trips on missing browser APIs (e.g. `matchMedia`), stub them in the test file (`window.matchMedia = ...` minimal mock) rather than adding global setup files.

**Verify**: `pnpm test` → exit 0, all new tests pass.

### Step 8: Rebuild registry payloads

`pnpm registry:build` and commit the regenerated `public/r/*.json` for the five touched items.

**Verify**: `pnpm registry:build` → exit 0; `pnpm display:check` → passes; `git diff --name-only public/r` lists only payloads for the touched items (text-morph, expandable-toolbar, staggered-entrance, status-button, feedback-popover).

## Test plan

Covered by Step 7. Structural pattern: `tests/component-search.test.ts` from plan 001 for file layout; these three files establish the jsdom pattern for future component plans. Cases: unmount-during-async (StatusButton, FeedbackPopover), happy-path state machine with fake timers (StatusButton), key uniqueness/no-console-error (StaggeredEntrance).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n 'layoutId={shouldReduceMotion ? undefined : `' registry/base/ui/text-morph.tsx` shows the uid-prefixed template literal
- [ ] `grep -c useIsomorphicLayoutEffect registry/base/ui/expandable-toolbar.tsx` ≥ 2
- [ ] `grep -n "React.Key$" registry/base/ui/staggered-entrance.tsx` shows the function-only key type (no `| React.Key` union arm remains)
- [ ] `grep -c isMountedRef registry/base/ui/status-button.tsx` ≥ 3 and same for `feedback-popover.tsx`
- [ ] `pnpm test` exits 0 including the three new test files
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm display:check`, `pnpm registry:build` all exit 0
- [ ] Regenerated `public/r/*.json` committed; no files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any "Current state" excerpt no longer matches the live file (drift).
- `pnpm typecheck` fails after Step 4 because a site file passes a non-function `getItemKey` — report the call site; do not weaken the type back.
- The jsdom tests cannot render a component due to `motion/react` requiring APIs beyond a `matchMedia` stub — report which API rather than installing extra polyfill packages.
- Fixing one component appears to require editing a file in the out-of-scope list.

## Maintenance notes

- The `isMountedRef` pattern is now the house convention for post-await scheduling in registry items — new async components (and `expandable-modal`'s existing `openRequestId` pattern) should stay consistent; a reviewer seeing a bare post-await `setState` in a future registry item should flag it.
- The StaggeredEntrance type narrowing is a semver-visible API change for the registry item — worth one line in any changelog/release notes the project adopts.
- Deferred deliberately: consolidating the five inline ResizeObserver implementations onto `use-element-height` (audit finding DEBT-02) and unifying the three reduced-motion strategies (DEBT-03) — both are listed in `plans/README.md` as next-up candidates and interact with these files; land this plan first.
