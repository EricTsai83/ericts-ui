import { describe, expect, it } from "vitest";

import { getRegistryItem, registryItems } from "@/lib/registry";
import { getRegistryCssVariablesSource } from "@/lib/registry-css-vars";

function sourceFor(name: string) {
  const item = getRegistryItem(name);

  if (!item) throw new Error(`Missing registry item ${name}`);

  return getRegistryCssVariablesSource(item);
}

describe("registry CSS variables for manual installs", () => {
  it("writes an item's own variables where the CLI would put them", () => {
    const item = getRegistryItem("like-burst");
    const light = item?.cssVars?.light ?? {};
    const dark = item?.cssVars?.dark ?? {};
    const block = (selector: string, vars: Record<string, string>) =>
      `${selector} {\n${Object.entries(vars)
        .map(([name, value]) => `  --${name}: ${value};`)
        .join("\n")}\n}`;

    expect(sourceFor("like-burst")).toBe(
      `${block(":root", light)}\n\n${block(".dark", dark)}\n`,
    );
  });

  it("includes the variables of linked registry dependencies", () => {
    // Like Button declares none of its own; its heart is Like's.
    expect(getRegistryItem("like-button")?.cssVars).toBeUndefined();
    expect(sourceFor("like-button")).toContain("--ericts-like:");
  });

  it("returns nothing for items that need no variables", () => {
    expect(sourceFor("smooth-height")).toBeUndefined();
  });

  it("covers every variable every item declares", () => {
    const items = registryItems.filter((item) => item.cssVars);

    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      const source = getRegistryCssVariablesSource(item) ?? "";

      for (const vars of Object.values(item.cssVars ?? {})) {
        for (const [name, value] of Object.entries(vars)) {
          expect(source, `${item.name} --${name}`).toContain(
            `--${name}: ${value};`,
          );
        }
      }
    }
  });
});
