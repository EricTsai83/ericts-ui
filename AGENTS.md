# AGENTS.md

## Project Snapshot

ericts/ui is a shadcn-compatible component registry for polished, motion-focused UI components, hooks, and blocks. The public site documents the registry, lets developers browse previews, and provides a predictable path to install registry items.

This is a Next.js App Router project using React 19, TypeScript, Tailwind CSS v4, Fumadocs MDX, shadcn registry tooling, Base UI/Radix-style primitives where present, Lucide icons, and Motion for animation.

Keep the product feel precise, practical, and restrained. Treat it as a developer tool and documentation site, not a marketing landing page.

## Package Manager

- Use `pnpm`; the project declares `packageManager` as pnpm.
- Do not use `bun`, `npm`, or `yarn` commands unless the user explicitly asks.
- Do not run dev servers unless explicitly asked. Assume the app may already be running.
- Do not run production builds unless explicitly asked, except `pnpm registry:build` when validating registry output.

## Task Completion Requirements

- Run `pnpm lint` and `pnpm typecheck` before considering code changes complete.
- Run `pnpm registry:build` when changing files under `registry/`, `registry.json`, install snippets, or registry metadata.
- There is currently no `format` or `test` script in `package.json`; do not invent one. If tests or formatting become available, use the project script.
- If a validation command cannot run or fails for an unrelated existing issue, report that clearly with the relevant error.

## TypeScript & React

- Never use `any` unless 100% necessary or specifically instructed.

## Maintainability

1. Performance first.
2. Reliability first.

If a tradeoff is required, choose correctness and robustness over short-term convenience.