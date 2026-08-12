import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ComponentShowcase } from "@/components/component-showcase";
import { buttonVariants } from "@/components/ui/button";
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

const registryItemNavigation = {
  ui: { href: "/components", label: "components" },
  hooks: { href: "/hooks", label: "hooks" },
  blocks: { href: "/blocks", label: "blocks" },
} as const;

type RegistryItemCategory = keyof typeof registryItemNavigation;

type RegistryItemPageOptions = {
  name: string;
  category: RegistryItemCategory;
};

export function generateRegistryItemStaticParams(
  category: RegistryItemCategory,
) {
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
  const navigation = registryItemNavigation[category];

  return (
    <main className="mx-auto flex min-w-0 w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex max-w-3xl flex-col gap-5">
        <Link
          href={navigation.href}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "extend-touch-target -ml-2.5 self-start",
          })}
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Back to {navigation.label}
        </Link>
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
        targetPath={codeModel.targetPath}
        dependencies={codeModel.dependencies}
        registryDependencies={item.registryDependencies}
        motionApiSnippets={motionApiSnippets}
        fullscreenHref={displayItem?.viewHref}
      />
    </main>
  );
}

function getRegistryItemForCategory(
  name: string,
  category: RegistryItemCategory,
) {
  const item = getRegistryItem(name);

  if (item?.category !== category) {
    return undefined;
  }

  return item;
}
