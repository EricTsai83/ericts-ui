import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComponentShowcase } from "@/components/component-showcase";
import {
  getRegistryItem,
  registryItems,
  type RegistryItem,
} from "@/lib/registry";
import { getRegistryItemUrl } from "@/lib/site-url";

type PageProps = {
  params: Promise<{
    name: string;
  }>;
};

export function generateStaticParams() {
  return registryItems.map((item) => ({
    name: item.name,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name } = await params;
  const item = getRegistryItem(name);

  if (!item) {
    return {};
  }

  return {
    title: item.title,
    description: item.description,
  };
}

export default async function ComponentPage({ params }: PageProps) {
  const { name } = await params;
  const item = getRegistryItem(name);

  if (!item) {
    notFound();
  }

  const source = await getComponentSource(item);
  const installTarget = getInstallTarget(item);
  const targetPath = getComponentTargetPath(item);

  return (
    <main className="mx-auto flex min-w-0 w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex max-w-3xl flex-col gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          {item.category}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">
          {item.title ?? item.name}
        </h1>
        {item.description ? (
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            {item.description}
          </p>
        ) : null}
      </header>

      <ComponentShowcase
        name={item.name}
        source={source}
        installTarget={installTarget}
        targetPath={targetPath}
        dependencies={item.dependencies}
      />
    </main>
  );
}

async function getComponentSource(item: RegistryItem) {
  const file = item.files?.find((entry) => entry.type === "registry:ui");

  if (!file) {
    return "";
  }

  const registryPath = file.path.replace(/^registry\//, "");

  if (registryPath === file.path) {
    return "";
  }

  try {
    return await readFile(
      path.join(process.cwd(), "registry", registryPath),
      "utf8"
    );
  } catch {
    return "";
  }
}

function getInstallTarget(item: RegistryItem) {
  return getRegistryItemUrl(item.name);
}

function getComponentTargetPath(item: RegistryItem) {
  const file = item.files?.find((entry) => entry.type === "registry:ui");

  return file?.target ?? `components/ui/${item.name}.tsx`;
}
