import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  RegistryDemoShell,
  type RegistryDemoNavigation,
  type RegistryDemoNavigationItem,
} from "@/components/registry-demo-shell";
import { getRegistryCodeModel } from "@/lib/registry-code";
import {
  getRegistryDisplayItem,
  getRegistryDisplayItems,
  getRegistryDisplayNavigation,
  type RegistryDisplayItem,
} from "@/lib/registry-display";
import { getRegistryItem } from "@/lib/registry";

type PageProps = {
  params: Promise<{
    style: string;
    name: string;
  }>;
  searchParams?: Promise<{
    variant?: string | string[];
  }>;
};

export function generateStaticParams() {
  return getRegistryDisplayItems()
    .filter((item) => item.browsable !== false)
    .map((item) => ({
      style: "base",
      name: item.name,
    }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name, style } = await params;
  const item = style === "base" ? getRegistryDisplayItem(name) : undefined;

  if (!item) {
    return {};
  }

  return {
    title: item.title,
    description: item.description,
  };
}

export default async function ViewPage({ params, searchParams }: PageProps) {
  const { name, style } = await params;
  const displayItem =
    style === "base" ? getRegistryDisplayItem(name) : undefined;
  const registryItem = getRegistryItem(name);

  if (!displayItem || displayItem.browsable === false || !registryItem) {
    notFound();
  }

  const codeModel = await getRegistryCodeModel(registryItem);
  const navigation = getRegistryDisplayNavigation(displayItem.name);
  const requestedVariant = getRequestedVariant(await searchParams);
  const variant = getResolvedVariant(displayItem, codeModel, requestedVariant);

  if (!navigation) {
    notFound();
  }

  return (
    <RegistryDemoShell
      item={displayItem}
      codeModel={codeModel}
      navigation={toDemoNavigation(navigation)}
      variant={variant}
    />
  );
}

function getRequestedVariant(
  searchParams: Awaited<PageProps["searchParams"]>,
) {
  const variant = searchParams?.variant;

  if (Array.isArray(variant)) {
    return variant[0];
  }

  return variant;
}

function getResolvedVariant(
  item: RegistryDisplayItem,
  codeModel: Awaited<ReturnType<typeof getRegistryCodeModel>>,
  requestedVariant: string | undefined,
) {
  const validVariants = new Set(
    codeModel.variants.map((variant) => variant.value),
  );

  if (requestedVariant && validVariants.has(requestedVariant)) {
    return requestedVariant;
  }

  if (item.defaultVariant && validVariants.has(item.defaultVariant)) {
    return item.defaultVariant;
  }

  return codeModel.variants[0]?.value ?? "motion";
}

function toDemoNavigation(
  navigation: NonNullable<ReturnType<typeof getRegistryDisplayNavigation>>,
): RegistryDemoNavigation {
  return {
    previous: toDemoNavigationItem(navigation.previous),
    next: toDemoNavigationItem(navigation.next),
    previousCategory: toDemoNavigationItem(navigation.previousCategory),
    nextCategory: toDemoNavigationItem(navigation.nextCategory),
    randomItems: navigation.randomItems.map(toRequiredDemoNavigationItem),
  };
}

function toDemoNavigationItem(
  item: RegistryDisplayItem | undefined,
): RegistryDemoNavigationItem | undefined {
  return item ? toRequiredDemoNavigationItem(item) : undefined;
}

function toRequiredDemoNavigationItem(
  item: RegistryDisplayItem,
): RegistryDemoNavigationItem {
  return {
    name: item.name,
    title: item.title,
    category: item.category,
    viewHref: item.viewHref,
  };
}
