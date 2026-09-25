import {
  getLocalRegistryDependencyName,
  getRegistryItem,
  type RegistryCssVars,
  type RegistryItem,
} from "@/lib/registry";

type RegistryCssVarScope = keyof RegistryCssVars;

/** Where `shadcn add` writes each `cssVars` scope in a Tailwind v4 project. */
const cssVarSelectors = [
  ["theme", "@theme inline"],
  ["light", ":root"],
  ["dark", ".dark"],
] as const satisfies ReadonlyArray<readonly [RegistryCssVarScope, string]>;

/**
 * The theme variables `shadcn add` writes into a project's global stylesheet,
 * as CSS a manual install pastes in by hand. Nothing else carries them:
 * copying the source files alone leaves every `var(--ericts-…)` the component
 * reads undefined, which renders it without its colours.
 *
 * Linked registry dependencies contribute theirs too, for the same reason
 * their files join the code panel — Like Button's source is Like's, so its
 * manual install needs Like's `--ericts-like`. The item's own value wins if
 * a dependency declares the same variable.
 */
export function getRegistryCssVariablesSource(
  item: RegistryItem,
): string | undefined {
  const collected = new Map<RegistryCssVarScope, Map<string, string>>();

  collectCssVars(item, new Set([item.name]), collected);

  const blocks = cssVarSelectors.flatMap(([scope, selector]) => {
    const variables = collected.get(scope);

    if (!variables || variables.size === 0) {
      return [];
    }

    const declarations = [...variables]
      .map(([name, value]) => `  --${name}: ${value};`)
      .join("\n");

    return [`${selector} {\n${declarations}\n}`];
  });

  return blocks.length > 0 ? `${blocks.join("\n\n")}\n` : undefined;
}

function collectCssVars(
  item: RegistryItem,
  visited: Set<string>,
  collected: Map<RegistryCssVarScope, Map<string, string>>,
) {
  for (const [scope] of cssVarSelectors) {
    for (const [name, value] of Object.entries(item.cssVars?.[scope] ?? {})) {
      const variables = collected.get(scope) ?? new Map<string, string>();

      if (!variables.has(name)) {
        variables.set(name, value);
      }

      collected.set(scope, variables);
    }
  }

  for (const dependency of item.registryDependencies ?? []) {
    const dependencyName = getLocalRegistryDependencyName(dependency);

    if (!dependencyName || visited.has(dependencyName)) continue;

    visited.add(dependencyName);
    const dependencyItem = getRegistryItem(dependencyName);

    if (dependencyItem) {
      collectCssVars(dependencyItem, visited, collected);
    }
  }
}
