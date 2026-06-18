import Link from "next/link";
import type { Metadata } from "next";

import { registryItems } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Components",
  description: "All the components available in the library.",
};

export default function ComponentsPage() {
  const components = [...registryItems].sort((a, b) =>
    (a.title ?? a.name).localeCompare(b.title ?? b.name)
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">Components</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Here you can find all the components available in the library. We are
          working on adding more components.
        </p>
      </div>

      {components.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <Link
              key={component.name}
              href={component.href}
              className="text-lg text-foreground transition-colors hover:text-muted-foreground"
            >
              {component.title ?? component.name}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No components yet.
        </div>
      )}
    </div>
  );
}
