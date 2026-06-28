import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";

import {
  ComponentShowcase,
  type ComponentCodeFile,
  type ComponentCodeVariant,
} from "@/components/component-showcase";
import {
  getRegistryItem,
  getRegistryItemBadges,
  getRegistryItemsByCategory,
  type RegistryItem,
} from "@/lib/registry";
import { getRegistryItemUrl } from "@/lib/site-url";

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

  const primarySource = await getRegistryItemSource(item);
  const primaryFiles = await getRegistryItemCodeFiles(item);
  const cssOnlyFiles = await getCssOnlyFiles(item);
  const codeVariants: ComponentCodeVariant[] = [
    {
      value: "motion",
      label: getPrimaryVariantLabel(item, primarySource),
      files: await highlightCodeFiles(primaryFiles, item.type === "registry:hook"),
    },
  ];
  const hookUsageFiles =
    item.type === "registry:hook" ? getHookUsageSnippets(item.name) : [];

  if (hookUsageFiles.length > 0) {
    codeVariants.push({
      value: "usage",
      label: "Usage",
      files: await highlightCodeFiles(hookUsageFiles, true),
    });
  }

  if (cssOnlyFiles.length > 0) {
    codeVariants.push({
      value: "css-only",
      label: "CSS only",
      files: await highlightCodeFiles(cssOnlyFiles),
    });
  }

  const installTarget = getInstallTarget(item);
  const targetPath = getRegistryItemTargetPath(item);
  const badges = getRegistryItemBadges(item);
  const motionApiSnippets =
    item.name === "use-reduced-motion"
      ? await highlightCodeFiles(motionApiReducedMotionSnippets, true)
      : [];

  return (
    <main className="mx-auto flex min-w-0 w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex max-w-3xl flex-col gap-3">
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
      </header>

      <ComponentShowcase
        name={item.name}
        type={item.type}
        codeVariants={codeVariants}
        installTarget={installTarget}
        targetPath={targetPath}
        dependencies={item.dependencies}
        motionApiSnippets={motionApiSnippets}
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

function getCodeLanguage(filePath: string): ComponentCodeFile["language"] {
  if (filePath.endsWith(".css")) {
    return "css";
  }

  if (filePath.endsWith(".ts")) {
    return "ts";
  }

  return "tsx";
}

async function getRegistryItemSource(item: RegistryItem) {
  const file = getPrimaryRegistryFile(item);

  if (!file) {
    return "";
  }

  const registryPath = file.path.replace(/^registry\//, "");

  if (registryPath === file.path) {
    return "";
  }

  return readOptionalFile(path.join(process.cwd(), "registry", registryPath));
}

async function getRegistryItemCodeFiles(
  item: RegistryItem,
): Promise<ComponentCodeVariant["files"]> {
  const files = await Promise.all(
    (item.files ?? []).map(async (file) => {
      const registryPath = file.path.replace(/^registry\//, "");

      if (registryPath === file.path) {
        return undefined;
      }

      const source = await readOptionalFile(
        path.join(process.cwd(), "registry", registryPath),
      );

      if (!source) {
        return undefined;
      }

      const fileName = path.basename(file.target ?? file.path);

      return {
        name: fileName,
        language: getCodeLanguage(fileName),
        source,
      };
    }),
  );

  return files.filter((file): file is ComponentCodeFile => Boolean(file));
}

async function getCssOnlyFiles(
  item: RegistryItem,
): Promise<ComponentCodeVariant["files"]> {
  const cssOnlyPath = path.join(process.cwd(), "registry/base/css-only");
  const [cssSource, reactSource] = await Promise.all([
    readOptionalFile(path.join(cssOnlyPath, `${item.name}.css`)),
    readOptionalFile(path.join(cssOnlyPath, `${item.name}.tsx`)),
  ]);

  if (!cssSource || !reactSource) {
    return [];
  }

  return [
    {
      name: `${item.name}.css`,
      language: "css",
      source: cssSource,
    },
    {
      name: `${item.name}.tsx`,
      language: "tsx",
      source: reactSource,
    },
  ];
}

async function highlightCodeFiles(
  files: ComponentCodeFile[],
  keepCodeBlockStyle = false,
): Promise<ComponentCodeFile[]> {
  return Promise.all(
    files.map(async (file) => ({
      ...file,
      highlighted: await ServerCodeBlock({
        code: file.source.trimEnd(),
        lang: file.language,
        codeblock: keepCodeBlockStyle
          ? {
              title: file.name,
              "data-line-numbers": true,
            }
          : {
              allowCopy: false,
              className: "rounded-none border-0 bg-transparent shadow-none",
              "data-line-numbers": true,
              viewportProps: {
                className: "max-h-72 py-4",
              },
            },
      }),
    })),
  );
}

async function readOptionalFile(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function getInstallTarget(item: RegistryItem) {
  return getRegistryItemUrl(item.name);
}

function getRegistryItemTargetPath(item: RegistryItem) {
  const file = getPrimaryRegistryFile(item);

  return file?.target ?? `components/ui/${item.name}.tsx`;
}

function getPrimaryVariantLabel(item: RegistryItem, source: string) {
  if (item.type === "registry:hook") {
    return "Custom hook";
  }

  if (source.includes("motion/react")) {
    return "Motion";
  }

  if (item.files?.some((file) => file.target?.endsWith(".css"))) {
    return "CSS";
  }

  return "React";
}

function getPrimaryRegistryFile(item: RegistryItem) {
  return item.files?.find((entry) =>
    ["registry:ui", "registry:hook"].includes(entry.type),
  );
}

function getHookUsageSnippets(name: string) {
  return hookUsageSnippets[name] ?? [];
}

const hookUsageSnippets: Record<string, ComponentCodeFile[]> = {
  "use-element-height": [
    {
      name: "auto-height-panel.tsx",
      language: "tsx",
      source: `"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useElementHeight } from "@/hooks/use-element-height";

export function AutoHeightPanel({ children }: { children: ReactNode }) {
  const [measureRef, height] = useElementHeight<HTMLDivElement>();

  return (
    <motion.div
      animate={{ height: height ?? "auto" }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div ref={measureRef}>{children}</div>
    </motion.div>
  );
}`,
    },
  ],
  "use-element-size-map": [
    {
      name: "morphing-panel.tsx",
      language: "tsx",
      source: `"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useElementSizeMap } from "@/hooks/use-element-size-map";

type Panel = {
  id: string;
  content: ReactNode;
};

export function MorphingPanel({
  panels,
  activeId,
}: {
  panels: Panel[];
  activeId: string;
}) {
  const { setMeasureRef, sizes } = useElementSizeMap<HTMLDivElement>();
  const activePanel = panels.find((panel) => panel.id === activeId);
  const activeSize = activePanel ? sizes[activePanel.id] : undefined;
  const targetSize = activeSize ?? { width: 320, height: 180 };

  if (!activePanel) return null;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0"
      >
        {panels.map((panel) => (
          <div key={panel.id} ref={setMeasureRef(panel.id)} className="w-max">
            {panel.content}
          </div>
        ))}
      </div>

      <motion.div
        animate={{ width: targetSize.width, height: targetSize.height }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        {activePanel.content}
      </motion.div>
    </div>
  );
}`,
    },
  ],
};

const motionApiReducedMotionSnippets: ComponentCodeFile[] = [
  {
    name: "sidebar.tsx",
    language: "tsx",
    source: `import { useReducedMotion, motion } from "motion/react"

export function Sidebar({ isOpen }) {
  const shouldReduceMotion = useReducedMotion();
  const closedX = shouldReduceMotion ? 0 : "-100%";

  return (
    <motion.div animate={{
      opacity: isOpen ? 1 : 0,
      x: isOpen ? 0 : closedX
    }} />
  )
}`,
  },
  {
    name: "motion-config.tsx",
    language: "tsx",
    source: `import { MotionConfig } from "motion/react";

// ...

<MotionConfig reducedMotion="user">{children}</MotionConfig>`,
  },
];
