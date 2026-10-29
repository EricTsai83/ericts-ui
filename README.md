<h1 align="center"><img src="./app/icon.svg" alt="ericts/ui logo" width="32" height="32" align="absmiddle" /> ericts/ui</h1>

ericts/ui is a shadcn-compatible component registry focused on fluid, animated UI components.

It helps developers browse, preview, and install reusable components, hooks, and blocks designed around polished motion and interaction patterns.

Website: [ui.ericts.com](https://ui.ericts.com)

## Development

The project supports one Node.js major: 24, the newest one Vercel deploys
(Vercel offers 24.x and 22.x). `.node-version`, `engines` (`24.x`), CI, and
`@types/node` all follow it, so development, CI, and production run the same
runtime. Move all four together once Vercel adds a newer major. Use the pnpm
version declared in `package.json` (pnpm 12).

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm display:check
pnpm test
```

Vitest 5 supplies jsdom's browser storage APIs on modern Node.js. Tests run with
plain `pnpm test`; no `NODE_OPTIONS` override or storage file is required.

## License

Licensed under the [MIT License](./LICENSE).
