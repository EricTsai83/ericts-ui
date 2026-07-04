# Switch ericts/ui website install flow to `@ericts` after shadcn Registry Directory acceptance

## Goal

After the shadcn Registry Directory PR is merged and `@ericts/{name}` is available through `shadcn@latest`, switch the primary ericts/ui website installation experience to namespace install while preserving URL fallback.

## Scope

Includes:

- Change the website primary install command to `@ericts/{name}`.
- Promote namespace install to primary in docs.
- Show namespace and URL fallback in install command UI.
- Add or update tests.
- Verify fresh app namespace install.

Does not include:

- Modifying the `shadcn-ui/ui` directory PR again.
- Changing registry item names.
- Changing registry file structure.
- Creating a custom CLI.

## Preconditions

All must be true:

- The `shadcn-ui/ui` PR has been merged.
- `https://ui.shadcn.com/r/registries.json` contains:

  ```json
  {
    "name": "@ericts",
    "url": "https://ui.ericts.com/r/{name}.json"
  }
  ```

- A fresh app can run:

  ```bash
  pnpm dlx shadcn@latest add @ericts/copy-button
  ```

## Files To Change In ericts/ui

Required:

```txt
lib/registry-install.ts
components/registry-install-command.tsx
content/docs/installation.mdx
app/(app)/(root)/page.tsx
components/component-preview-browser.tsx
components/component-showcase.tsx
```

Tests if present or added:

```txt
*.test.ts
*.test.tsx
```

Validation likely unchanged:

```txt
scripts/validate-registry-display.mjs
```

## Implementation Steps

### 1. Change Default Install Mode

Update `lib/registry-install.ts`.

Introduce explicit default:

```ts
export const DEFAULT_REGISTRY_INSTALL_MODE: RegistryInstallMode = "namespace";
```

Update:

```ts
export function getRegistryInstallTarget(
  name: string,
  mode: RegistryInstallMode = DEFAULT_REGISTRY_INSTALL_MODE,
) {
  return mode === "namespace"
    ? getRegistryNamespaceTarget(name)
    : getRegistryUrlTarget(name);
}
```

Acceptance:

```ts
getRegistryInstallTarget("copy-button") === "@ericts/copy-button"
```

### 2. Add URL Fallback Support In Command UI

Update `components/registry-install-command.tsx`.

Props:

```ts
type RegistryInstallCommandProps = {
  name: string;
  defaultMode?: RegistryInstallMode;
  className?: string;
};
```

Behavior:

- Default mode: `"namespace"`.
- Render two mode buttons:
  - `@ericts`
  - `URL`
- Package manager selector remains:
  - `pnpm`
  - `npm`
  - `yarn`
  - `bun`

Command generation:

```ts
const installTarget = getRegistryInstallTarget(name, installMode);
const command = getRegistryInstallCommand(installTarget, packageManager);
```

Expected commands:

```bash
pnpm dlx shadcn@latest add @ericts/copy-button
pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json
```

UX notes:

- `@ericts` mode is selected by default.
- URL mode is clearly available as fallback.
- Do not add warning text saying namespace is pending.

### 3. Update Homepage Install Command

Update `app/(app)/(root)/page.tsx`.

Homepage README/CLI card should show:

```bash
npx shadcn@latest add @ericts/copy-button
```

or package manager-specific command if the existing UI supports it.

For preview items, pass namespace targets by default:

```ts
installTarget: getRegistryInstallTarget(item.name)
```

### 4. Update Component Preview Browser

Update `components/component-preview-browser.tsx`.

Ensure generated command uses namespace target by default:

```ts
npx shadcn@latest add @ericts/{name}
```

If URL fallback UI is only in the detail install panel, no extra mode switch is needed here. Preview browser can stay simple and primary-only.

### 5. Update Installation Docs

Modify `content/docs/installation.mdx`.

New content intent:

````mdx
---
title: Installation
description: Install ericts/ui registry entries with the shadcn CLI.
---

## Install an item

Use the shadcn CLI with the `@ericts` registry namespace.

```bash
pnpm dlx shadcn@latest add @ericts/copy-button
```

Replace `copy-button` with any item name from the components, hooks, or blocks pages.

## URL fallback

You can also install directly from the registry JSON endpoint.

```bash
pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json
```

## Local development

Build the registry output after changing `registry.json` or files under `registry/base`.

```bash
pnpm registry:build
```
````

### 6. Update Tests

Add or update tests for install helper.

Required assertions:

```ts
getRegistryNamespaceTarget("copy-button") === "@ericts/copy-button"
getRegistryUrlTarget("copy-button") === "https://ui.ericts.com/r/copy-button.json"
getRegistryInstallTarget("copy-button") === "@ericts/copy-button"
getRegistryInstallTarget("copy-button", "url") === "https://ui.ericts.com/r/copy-button.json"
```

Add or update tests for command generation:

```ts
getRegistryInstallCommand("@ericts/copy-button", "pnpm")
```

returns:

```txt
pnpm dlx shadcn@latest add @ericts/copy-button
```

URL mode returns:

```txt
pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json
```

### 7. Fresh App Namespace Smoke Test

In a temporary app outside this repo:

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add @ericts/copy-button
```

Acceptance:

- CLI resolves `@ericts`.
- Item installs successfully.
- Dependency resolution matches URL install behavior.

Also test URL fallback:

```bash
pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json
```

### 8. Validate ericts/ui

Run:

```bash
pnpm lint
pnpm typecheck
pnpm display:check
pnpm test
```

Run `pnpm registry:build` only if registry source or metadata changed. This post-PR change should normally not require registry rebuild.

## Acceptance Criteria

- Main website install commands use `@ericts/{name}`.
- Component detail install panel defaults to `@ericts`.
- Component detail install panel offers URL fallback.
- Docs show `@ericts/copy-button` as primary install command.
- Docs still show direct URL fallback.
- `getRegistryInstallTarget(name)` defaults to namespace mode.
- Fresh app install via `@ericts/copy-button` works.
- Fresh app install via URL fallback still works.
- Required local checks pass:

  ```bash
  pnpm lint
  pnpm typecheck
  pnpm display:check
  pnpm test
  ```

## Explicit Assumptions

- The namespace is `@ericts`, not `@ericts-ui`.
- `https://ui.ericts.com` is the permanent canonical registry domain.
- The project remains shadcn-compatible and does not introduce a custom CLI.
- Namespace install is made primary only after the shadcn Registry Directory PR is accepted and verified.
- Repo commands must use `pnpm`.
