import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { RegistryInstallCommand } from "@/components/registry-install-command";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    RegistryInstallCommand,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
