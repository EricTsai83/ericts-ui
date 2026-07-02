import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComponentShowcase } from "@/components/component-showcase";
import {
  getRegistryCodeModel,
  getRegistryMotionApiSnippets,
} from "@/lib/registry-code";
import { getRegistryDisplayItem } from "@/lib/registry-display";
import {
  getRegistryItem,
  getRegistryItemBadges,
  getRegistryItemsByCategory,
} from "@/lib/registry";

type RegistryItemPageOptions = {
  name: string;
  category: string;
};

export function generateRegistryItemStaticParams(category: string) {
  return getRegistryItemsByCategory(category).map((item) => ({
    name: item.name,
  }));
}

export async function generateRegistryItemMetadata({
  name,
  category,
}: RegistryItemPageOptions): Promise<Metadata> {
  const item = getRegistryItemForCategory(name, category);

  if (!item) {
    return {};
  }

  return {
    title: item.title,
    description: item.description,
  };
}

export async function RegistryItemPage({
  name,
  category,
}: RegistryItemPageOptions) {
  const item = getRegistryItemForCategory(name, category);

  if (!item) {
    notFound();
  }

  const codeModel = await getRegistryCodeModel(item);
  const badges = getRegistryItemBadges(item);
  const motionApiSnippets = await getRegistryMotionApiSnippets(item.name);
  const displayItem = getRegistryDisplayItem(item.name);

  return (
    <main className="mx-auto flex min-w-0 w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            {item.title ?? item.name}
          </h1>
          {item.description ? (
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              {item.description}
            </p>
          ) : null}
          {badges.visible.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {badges.visible.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
              {badges.hiddenCount > 0 ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  +{badges.hiddenCount}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <ComponentShowcase
        name={item.name}
        type={item.type}
        codeVariants={codeModel.variants}
        installTarget={codeModel.installTarget}
        targetPath={codeModel.targetPath}
        dependencies={codeModel.dependencies}
        motionApiSnippets={motionApiSnippets}
        fullscreenHref={displayItem?.viewHref}
      />
    </main>
  );
}

function getRegistryItemForCategory(name: string, category: string) {
  const item = getRegistryItem(name);

  if (item?.category !== category) {
    return undefined;
  }

  return item;
}
