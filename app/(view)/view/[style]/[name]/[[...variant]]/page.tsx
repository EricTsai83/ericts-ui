import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStaticRegistryBrowseModel } from "@/lib/registry-browse.server";
import {
  getRegistryDisplayItem,
  getRegistryDisplayItems,
  type RegistryDisplayItem,
} from "@/lib/registry-display";
import { RegistryDemoShell } from "@/components/registry-demo-shell";

type PageProps = {
  params: Promise<{
    style: string;
    name: string;
    variant?: string[];
  }>;
};

// Fail during prerendering if request-time APIs are accidentally added later.
export const dynamic = "error";
export const dynamicParams = false;

const fullscreenPreviewVariants = ["motion", "css-only", "usage"] as const;

export function generateStaticParams() {
  return getRegistryDisplayItems()
    .filter((item) => item.browsable !== false)
    .flatMap((item) =>
      [undefined, ...fullscreenPreviewVariants].map((variant) => ({
        style: "base",
        name: item.name,
        variant: variant ? [variant] : [],
      })),
    );
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

export default async function ViewPage({ params }: PageProps) {
  const { name, style, variant: variantSegments = [] } = await params;
  const displayItem =
    style === "base" ? getRegistryDisplayItem(name) : undefined;

  if (!displayItem || displayItem.browsable === false) {
    notFound();
  }

  const browseModel = getStaticRegistryBrowseModel(displayItem.kind);
  const navigationByOrder = browseModel.navigation.get(displayItem.name);
  const requestedVariant = variantSegments[0];

  if (
    variantSegments.length > 1 ||
    (requestedVariant && !isFullscreenPreviewVariant(requestedVariant))
  ) {
    notFound();
  }
  const variant = getResolvedVariant(displayItem, requestedVariant);

  if (!navigationByOrder) {
    notFound();
  }

  return (
    <RegistryDemoShell
      item={displayItem}
      navigationByOrder={navigationByOrder}
      navigationGroups={browseModel.groups}
      variant={variant}
    />
  );
}

function getResolvedVariant(
  item: RegistryDisplayItem,
  requestedVariant: string | undefined,
) {
  if (requestedVariant && isFullscreenPreviewVariant(requestedVariant)) {
    return requestedVariant;
  }

  if (item.defaultVariant && isFullscreenPreviewVariant(item.defaultVariant)) {
    return item.defaultVariant;
  }

  return "motion";
}

function isFullscreenPreviewVariant(value: string) {
  return fullscreenPreviewVariants.some((variant) => variant === value);
}
