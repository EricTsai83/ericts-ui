import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  RegistryDemoShell,
  type RegistryDemoNavigation,
  type RegistryDemoNavigationItem,
} from "@/components/registry-demo-shell";
import {
  getRegistryDisplayItem,
  getRegistryDisplayItems,
  getRegistryDisplayNavigationGroups,
  getRegistryDisplayNavigation,
  type RegistryDisplayItem,
} from "@/lib/registry-display";

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

  if (!displayItem || displayItem.browsable === false) {
    notFound();
  }

  const navigation = getRegistryDisplayNavigation(displayItem.name);
  const requestedVariant = getRequestedVariant(await searchParams);
  const variant = getResolvedVariant(displayItem, requestedVariant);

  if (!navigation) {
    notFound();
  }

  return (
    <RegistryDemoShell
      item={displayItem}
      navigation={toDemoNavigation(navigation)}
      navigationGroups={toDemoNavigationGroups(
        getRegistryDisplayNavigationGroups(displayItem.kind),
      )}
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
  requestedVariant: string | undefined,
) {
  if (requestedVariant && fullscreenPreviewVariants.has(requestedVariant)) {
    return requestedVariant;
  }

  if (item.defaultVariant && fullscreenPreviewVariants.has(item.defaultVariant)) {
    return item.defaultVariant;
  }

  return "motion";
}

const fullscreenPreviewVariants = new Set(["motion", "css-only", "usage"]);

function toDemoNavigation(
  navigation: NonNullable<ReturnType<typeof getRegistryDisplayNavigation>>,
): RegistryDemoNavigation {
  return {
    previous: toDemoNavigationItem(navigation.previous),
    next: toDemoNavigationItem(navigation.next),
    previousCategory: toDemoNavigationItem(navigation.previousCategory),
    nextCategory: toDemoNavigationItem(navigation.nextCategory),
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

function toDemoNavigationGroups(
  groups: ReturnType<typeof getRegistryDisplayNavigationGroups>,
) {
  return groups.map((group) => ({
    category: group.category,
    label: group.label,
    items: group.items.map(toRequiredDemoNavigationItem),
  }));
}
