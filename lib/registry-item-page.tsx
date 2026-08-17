import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ComponentShowcase } from "@/components/component-showcase";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getRegistryCodeModel,
  getRegistryGuideSnippets,
  getRegistryMotionApiSnippets,
} from "@/lib/registry-code";
import { getRegistryDisplayItem } from "@/lib/registry-display";
import {
  getRegistryItem,
  getRegistryItemBadges,
  getRegistryItemsByCategory,
} from "@/lib/registry";
import {
  getRegistryKindRegistryCategory,
  getRegistryKindSegment,
  type RegistryKind,
} from "@/lib/registry-kind";

type RegistryItemPageOptions = {
  name: string;
  kind: RegistryKind;
};

export function generateRegistryItemStaticParams(kind: RegistryKind) {
  return getRegistryItemsByCategory(getRegistryKindRegistryCategory(kind)).map(
    (item) => ({ name: item.name }),
  );
}

export async function generateRegistryItemMetadata({
  name,
  kind,
}: RegistryItemPageOptions): Promise<Metadata> {
  const item = getRegistryItemForKind(name, kind);

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
  kind,
}: RegistryItemPageOptions) {
  const item = getRegistryItemForKind(name, kind);

  if (!item) {
    notFound();
  }

  const codeModel = await getRegistryCodeModel(item);
  const badges = getRegistryItemBadges(item);
  const guideSnippets = await getRegistryGuideSnippets(item.name);
  const motionApiSnippets = await getRegistryMotionApiSnippets(item.name);
  const displayItem = getRegistryDisplayItem(item.name);
  const segment = getRegistryKindSegment(kind);
  const isNextJsOnly = item.meta?.tags?.includes("nextjs-only") ?? false;

  return (
    <main className="mx-auto flex min-w-0 w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-10">
      <header className="flex max-w-3xl flex-col gap-5">
        <Link
          href={`/${segment}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "extend-touch-target -ml-2.5 self-start",
          })}
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Back to {segment}
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
          {isNextJsOnly ? (
            <Alert variant="warning" className="mt-1">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>Next.js App Router only</AlertTitle>
              <AlertDescription>
                Built on <code>next/link</code> and{" "}
                <code>next/navigation</code>. Not compatible with the Pages
                Router or other frameworks.
              </AlertDescription>
            </Alert>
          ) : null}
          {!isNextJsOnly && badges.visible.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {badges.visible.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
              {badges.hiddenCount > 0 ? (
                <Badge variant="secondary">
                  +{badges.hiddenCount}
                </Badge>
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
        guideSnippets={guideSnippets}
        motionApiSnippets={motionApiSnippets}
        fullscreenHref={displayItem?.viewHref}
      />
    </main>
  );
}

function getRegistryItemForKind(name: string, kind: RegistryKind) {
  const item = getRegistryItem(name);

  if (item?.category !== getRegistryKindRegistryCategory(kind)) {
    return undefined;
  }

  return item;
}
