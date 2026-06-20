import type { Metadata } from "next";

import {
  generateRegistryItemMetadata,
  generateRegistryItemStaticParams,
  RegistryItemPage,
} from "@/lib/registry-item-page";

type PageProps = {
  params: Promise<{
    name: string;
  }>;
};

const CATEGORY = "hooks";

export function generateStaticParams() {
  return generateRegistryItemStaticParams(CATEGORY);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name } = await params;

  return generateRegistryItemMetadata({ name, category: CATEGORY });
}

export default async function HookPage({ params }: PageProps) {
  const { name } = await params;

  return <RegistryItemPage name={name} category={CATEGORY} />;
}
