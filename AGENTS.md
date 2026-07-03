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

## Maintainability

1. Performance first.
2. Reliability first.

If a tradeoff is required, choose correctness and robustness over short-term convenience.