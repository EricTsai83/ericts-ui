# AGENTS.md

## Project Snapshot

ericts/ui is a shadcn-compatible component registry for polished, motion-focused UI components, hooks, and blocks. The public site documents the registry, lets developers browse previews, and provides a predictable path to install registry items.

## Package Manager

- Use `pnpm`; the project declares `packageManager` as pnpm.
- Do not use `bun`, `npm`, or `yarn` commands unless the user explicitly asks.
- Do not run dev servers unless explicitly asked. Assume the app may already be running.
- Do not run production builds unless explicitly asked, except `pnpm registry:build` when validating registry output.

## Task Completion Requirements

- Run `pnpm lint`, `pnpm typecheck`, `pnpm display:check`, and `pnpm test` before considering code changes complete.
- Run `pnpm registry:build` when changing files under `registry/`, `registry.json`, install snippets, or registry metadata.
- Run `pnpm display:check` whenever registry metadata or display config changes.
- There is currently no `format` script in `package.json`; do not invent one. Tests run via `pnpm test` (vitest).
- If a validation command cannot run or fails for an unrelated existing issue, report that clearly with the relevant error.

## TypeScript & React

- Never use `any` unless 100% necessary or specifically instructed.

## Registry Conventions

Naming and categories are enforced by `pnpm display:check`; read the JSDoc in
`lib/registry-display.ts` and `scripts/validate-registry-display.mjs` before
adding an item. The rules that a validator cannot check:

- **Renaming items is allowed.** Consumers copy source into their own repo, so
  there is no semver contract. Update in-repo callers and add the old name to
  `renamedRegistryItems` in `next.config.ts`, which keeps `/r/<name>.json` — the
  install command people have already pasted — resolving.
- **Categories describe what an item is, never that it animates.** Every item
  animates, so an "animation" category sorts nothing. Add a category only when an
  item occupies it.
- **`ref` points at a DOM node**, matching React 19 ref-as-prop. Imperative
  handles go on a separate prop (`controlsRef`, `inputRef`). Guarded by
  `tests/registry-ref-forwarding.test.tsx`; components whose root ref is also used
  internally must merge via callback ref rather than spreading.
- **Time props**: `<state>Duration` for how long a transient state shows,
  `duration` (ms) for CSS-driven animation, `transition` (Motion object) for
  Motion-driven.
- **Slot classes use two shapes on purpose**: a `classNames` object for
  many-slot components, flat `*ClassName` props for few-slot ones. Do not
  unify them.
- **Invariants for every new component**: controlled/uncontrolled must be
  non-latching; animated components must honour `prefers-reduced-motion`; every
  effect, observer, and timer must clean up.
- Deliberate local exceptions, so they are not "fixed" later: `RailList` and
  `SlidingList` accept arrow keys on both axes (`vertical-scene` depends on it),
  and the two `CopyButton` variants use different state attributes
  (`data-copied` vs `data-state`), each self-consistent.

## Maintainability

1. Performance first.
2. Reliability first.

If a tradeoff is required, choose correctness and robustness over short-term convenience.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
