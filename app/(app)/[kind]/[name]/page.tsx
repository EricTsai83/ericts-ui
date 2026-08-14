import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  generateRegistryItemMetadata,
  generateRegistryItemStaticParams,
  RegistryItemPage,
} from "@/lib/registry-item-page";
import {
  getRegistryKindFromSegment,
  registryKindSegments,
} from "@/lib/registry-kind";

type PageProps = {
  params: Promise<{
    kind: string;
    name: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return registryKindSegments.flatMap((segment) => {
    const kind = getRegistryKindFromSegment(segment);

    if (!kind) {
      return [];
    }

    return generateRegistryItemStaticParams(kind).map(({ name }) => ({
      kind: segment,
      name,
    }));
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { kind: segment, name } = await params;
  const kind = getRegistryKindFromSegment(segment);

  if (!kind) {
    return {};
  }

  return generateRegistryItemMetadata({ name, kind });
}

export default async function RegistryItemDetailPage({ params }: PageProps) {
  const { kind: segment, name } = await params;
  const kind = getRegistryKindFromSegment(segment);

  if (!kind) {
    notFound();
  }

  return <RegistryItemPage name={name} kind={kind} />;
}
