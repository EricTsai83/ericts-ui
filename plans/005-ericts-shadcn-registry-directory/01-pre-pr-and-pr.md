# Prepare ericts/ui for `@ericts` shadcn Registry Directory PR

## Goal

Before opening the shadcn Registry Directory PR, bring ericts/ui registry URLs, docs, install commands, and validation to a mature and stable state, then prepare and submit the external PR.

## Scope

Includes:

- Standardize the canonical registry domain as `https://ui.ericts.com`.
- Keep URL install as the current official website entry point.
- Add an `@ericts` namespace helper without making namespace install the primary command.
- Update installation docs.
- Harden registry validation.
- Verify the production registry URL is publicly reachable.
- Open a PR to `shadcn-ui/ui` adding the directory entry.

Does not include:

- Changing the website primary install command to `@ericts/{name}`.
- Publicly claiming `@ericts` is available before acceptance.
- Creating a custom CLI.

## Files To Change In ericts/ui

Required:

```txt
lib/site-url.ts
content/docs/installation.mdx
lib/registry-install.ts
lib/registry-code.tsx
app/(app)/(root)/page.tsx
components/component-preview-browser.tsx
components/registry-install-command.tsx
components/component-showcase.tsx
scripts/validate-registry-display.mjs
```

Do not change unless needed:

```txt
registry.json
registry/**
public/r/**
```

Only run `pnpm registry:build` if `registry.json`, `registry/`, registry metadata, or registry output-affecting snippets are changed.

## Implementation Steps

### 1. Canonical URL

Update `lib/site-url.ts`.

Change:

```ts
const DEFAULT_SITE_URL = "https://ericts-ui.vercel.app";
```

To:

```ts
const DEFAULT_SITE_URL = "https://ui.ericts.com";
```

Keep existing env override behavior.

### 2. Add Registry Install Helper

Create `lib/registry-install.ts`.

Content intent:

```ts
import { getRegistryItemUrl } from "@/lib/site-url";

export const REGISTRY_NAMESPACE = "@ericts";

export type RegistryInstallMode = "url" | "namespace";

export function getRegistryNamespaceTarget(name: string) {
  return `${REGISTRY_NAMESPACE}/${name}`;
}

export function getRegistryUrlTarget(name: string) {
  return getRegistryItemUrl(name);
}

export function getRegistryInstallTarget(
  name: string,
  mode: RegistryInstallMode = "url",
) {
  return mode === "namespace"
    ? getRegistryNamespaceTarget(name)
    : getRegistryUrlTarget(name);
}
```

Decision: default mode stays `"url"` before the directory PR is accepted.

### 3. Use Helper In Existing Install Surfaces

Update `lib/registry-code.tsx`.

Replace direct `getRegistryItemUrl(item.name)` usage with:

```ts
getRegistryInstallTarget(item.name)
```

Update `app/(app)/(root)/page.tsx`.

Replace install target generation with:

```ts
getRegistryInstallTarget(name)
```

Update `components/component-preview-browser.tsx`.

Rename prop from `installUrl` to `installTarget` for maintainability.

Update type:

```ts
export type ComponentPreviewBrowserItem = {
  name: string;
  title: string;
  description?: string;
  href: string;
  installTarget: string;
  badges: string[];
};
```

Update command:

```ts
const installCommand = activeItem
  ? `npx shadcn@latest add ${activeItem.installTarget}`
  : "";
```

Update all call sites accordingly.

### 4. Keep Registry Install Command URL-First

Update `components/registry-install-command.tsx` to accept item name instead of precomputed target.

Preferred prop:

```ts
type RegistryInstallCommandProps = {
  name: string;
  className?: string;
};
```

Inside component:

```ts
const installTarget = getRegistryInstallTarget(name);
const command = getRegistryInstallCommand(installTarget, packageManager);
```

Do not expose `@ericts` mode in UI yet. The namespace is not usable until the shadcn directory PR is merged.

Update `components/component-showcase.tsx` and related code so the component receives `name`, not only `installTarget`.

### 5. Update Installation Docs

Modify `content/docs/installation.mdx`.

Use this content intent:

````mdx
---
title: Installation
description: Install ericts/ui registry entries with the shadcn CLI.
---

## Install an item

Use the shadcn CLI with the public registry JSON endpoint.

```bash
pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json
```

Replace `copy-button` with any item name from the components, hooks, or blocks pages.

## Registry namespace

ericts/ui is prepared for the shadcn Registry Directory under `@ericts`.

Once the directory entry is accepted, items can also be installed with:

```bash
pnpm dlx shadcn@latest add @ericts/copy-button
```

The direct URL remains the stable fallback.

## Local development

Build the registry output after changing `registry.json` or files under `registry/base`.

```bash
pnpm registry:build
```
````

### 6. Harden Validation

Update `scripts/validate-registry-display.mjs`.

Add `validateCanonicalRegistryUrls()`.

Rules:

- `registry.json.homepage` must equal `https://ui.ericts.com`.
- `public/r/registry.json.homepage` must equal `https://ui.ericts.com`.
- Absolute registry dependencies pointing to this registry must start with `https://ui.ericts.com/r/`.
- Fail if source/docs files contain `https://ericts-ui.vercel.app`.

Suggested files to scan:

```txt
README.md
content
app
components
lib
registry.json
```

Suggested errors:

```txt
registry.json homepage must be https://ui.ericts.com.
public/r/registry.json homepage must be https://ui.ericts.com - run pnpm registry:build.
Found legacy Vercel registry URL in {file}: use https://ui.ericts.com.
Registry dependency for "{name}" must use https://ui.ericts.com/r/.
```

### 7. Verify ericts/ui

Run:

```bash
pnpm lint
pnpm typecheck
pnpm display:check
pnpm test
```

Run only if registry output changed:

```bash
pnpm registry:build
```

### 8. Production URL Checks

After deployment, verify:

```bash
curl -fsSL https://ui.ericts.com/r/registry.json
curl -fsSL https://ui.ericts.com/r/copy-button.json
```

Acceptance:

- Both commands return valid JSON.
- JSON schema fields are present.
- No auth, redirect loop, or HTML error page.

### 9. Fresh App Install Smoke Test

In a temporary app outside this repo:

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json
```

Acceptance:

- `components/ui/copy-button.tsx` is generated.
- `button` registry dependency resolves.
- External dependencies are handled by the shadcn CLI.
- Generated imports use the target app aliases.

### 10. Open shadcn-ui/ui PR

In a fork of `shadcn-ui/ui`, edit:

```txt
apps/v4/registry/directory.json
```

Add entry:

```json
{
  "name": "@ericts",
  "homepage": "https://ui.ericts.com",
  "url": "https://ui.ericts.com/r/{name}.json",
  "description": "Motion-focused shadcn-compatible components, hooks, and blocks for polished React interfaces.",
  "logo": ""
}
```

Run in `shadcn-ui/ui`:

```bash
pnpm validate:registries
```

PR title:

```txt
feat(registry): add @ericts registry
```

PR body:

```md
Adds the `@ericts` registry directory entry.

Registry:
- Homepage: https://ui.ericts.com
- URL pattern: https://ui.ericts.com/r/{name}.json
- Registry index: https://ui.ericts.com/r/registry.json

ericts/ui is a shadcn-compatible registry of motion-focused components, hooks, and blocks installable as source with the shadcn CLI.
```

## Acceptance Criteria

- `https://ericts-ui.vercel.app` no longer appears in source/docs install instructions.
- Website install commands still use `https://ui.ericts.com/r/{name}.json`.
- `@ericts` helper exists but is not the default user-facing install command.
- Required local checks pass:

  ```bash
  pnpm lint
  pnpm typecheck
  pnpm display:check
  pnpm test
  ```

- Production registry URLs are reachable.
- Fresh app URL install works.
- `shadcn-ui/ui` PR is opened with the `@ericts` entry.

## Explicit Assumptions

- The namespace is `@ericts`, not `@ericts-ui`.
- `https://ui.ericts.com` is the permanent canonical registry domain.
- The project remains shadcn-compatible and does not introduce a custom CLI.
- Namespace install must not become the primary public command until the shadcn Registry Directory PR is accepted and verified.
- Repo commands must use `pnpm`.
