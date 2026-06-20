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
  const cssOnlyFiles = await getCssOnlyFiles(item);
  const codeVariants: ComponentCodeVariant[] = [
    {
      value: "motion",
      label: getPrimaryVariantLabel(item, source),
      files: await highlightCodeFiles(
        [
          {
            name: path.basename(getComponentTargetPath(item)),
            language: getCodeLanguage(getComponentTargetPath(item)),
            source,
          },
        ],
        item.type === "registry:hook",
      ),
    },
  ];

  if (cssOnlyFiles.length > 0) {
    codeVariants.push({
      value: "css-only",
      label: "CSS only",
      files: await highlightCodeFiles(cssOnlyFiles),
    });
  }

  const installTarget = getInstallTarget(item);
  const targetPath = getComponentTargetPath(item);

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
      </header>

      <ComponentShowcase
        name={item.name}
        type={item.type}
        codeVariants={codeVariants}
        installTarget={installTarget}
        targetPath={targetPath}
        dependencies={item.dependencies}
      />
    </main>
  );
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

async function getComponentSource(item: RegistryItem) {
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

function getComponentTargetPath(item: RegistryItem) {
  const file = getPrimaryRegistryFile(item);

  return file?.target ?? `components/ui/${item.name}.tsx`;
}

function getPrimaryVariantLabel(item: RegistryItem, source: string) {
  if (item.type === "registry:hook") {
    return "Hook";
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
