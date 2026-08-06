import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { RegistryInstallCommand } from "@/components/registry-install-command";
import { SurfaceGrainDemo } from "@/components/surface-grain-demo";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    RegistryInstallCommand,
    SurfaceGrainDemo,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
