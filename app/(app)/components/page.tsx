import type { Metadata } from "next";

import {
  ComponentsBrowser,
  type ComponentListItem,
} from "@/app/(app)/components/components-browser";
import { registryItems } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Components",
  description: "All the components available in the library.",
};

export default function ComponentsPage() {
  const components: ComponentListItem[] = [...registryItems]
    .sort((a, b) => (a.title ?? a.name).localeCompare(b.title ?? b.name))
    .map((component) => ({
      name: component.name,
      title: component.title,
      description: component.description,
      category: component.category,
      href: component.href,
    }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-12">
      <ComponentsBrowser components={components} />
    </main>
  );
}
