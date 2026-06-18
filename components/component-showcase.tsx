"use client";

import { Terminal } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CopyButton } from "@/registry/base/ui/copy-button";
import { RegistryPreview } from "@/components/registry-preview";
import { cn } from "@/lib/utils";

const packageManagers = ["pnpm", "npm", "yarn", "bun"] as const;

type PackageManager = (typeof packageManagers)[number];

const commandPrefix: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

export type ComponentCodeLanguage = "css" | "tsx";

export type ComponentCodeFile = {
  name: string;
  language: ComponentCodeLanguage;
  source: string;
};

export type ComponentCodeVariant = {
  value: string;
  label: string;
  files: ComponentCodeFile[];
};

type ComponentShowcaseProps = {
  name: string;
  codeVariants: ComponentCodeVariant[];
  installTarget: string;
  targetPath: string;
  dependencies?: string[];
};

export function ComponentShowcase({
  name,
  codeVariants,
  installTarget,
  targetPath,
  dependencies = [],
}: ComponentShowcaseProps) {
  return (
    <div className="flex min-w-0 flex-col gap-12">
      <ComponentPreviewCard name={name} codeVariants={codeVariants} />
      <InstallationPanel
        installTarget={installTarget}
        targetPath={targetPath}
        dependencies={dependencies}
      />
    </div>
  );
}

function ComponentPreviewCard({
  name,
  codeVariants,
}: {
  name: string;
  codeVariants: ComponentCodeVariant[];
}) {
  const variants: ComponentCodeVariant[] =
    codeVariants.length > 0
      ? codeVariants
      : [
          {
            value: "motion",
            label: "Motion",
            files: [{ name: `${name}.tsx`, language: "tsx", source: "" }],
          },
        ];

  return (
    <section
      data-slot="component-preview"
      className="group relative min-w-0 overflow-hidden rounded-xl border bg-background"
    >
      <div className="flex min-h-[288px] items-center justify-center p-10">
        <RegistryPreview name={name} />
      </div>
      <div
        data-slot="code"
        className="relative min-w-0 overflow-hidden border-t bg-muted/30"
      >
        <Tabs defaultValue={variants[0].value} className="min-w-0 gap-0">
          <TabsList
            variant="line"
            aria-label="Code examples"
            className="h-10 w-full justify-start gap-6 rounded-none border-b bg-transparent px-5 py-0 group-data-horizontal/tabs:h-10"
          >
            {variants.map((variant) => (
              <TabsTrigger
                key={variant.value}
                value={variant.value}
                className="h-10 flex-none px-0 py-0"
              >
                {variant.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {variants.map((variant) => (
            <TabsContent
              key={variant.value}
              value={variant.value}
              className="min-w-0"
            >
              <CodeFileTabs files={variant.files} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function CodeFileTabs({ files }: { files: ComponentCodeFile[] }) {
  const resolvedFiles: ComponentCodeFile[] =
    files.length > 0
      ? files
      : [{ name: "component.tsx", language: "tsx", source: "" }];

  if (resolvedFiles.length === 1) {
    return <CodeFileBlock file={resolvedFiles[0]} />;
  }

  return (
    <Tabs defaultValue={resolvedFiles[0].name} className="min-w-0 gap-0">
      <div className="no-scrollbar flex min-h-10 items-center overflow-x-auto border-b px-5">
        <TabsList
          aria-label="CSS only files"
          className="bg-background/80"
        >
          {resolvedFiles.map((file) => (
            <TabsTrigger
              key={file.name}
              value={file.name}
              className="flex-none px-2.5"
            >
              {file.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {resolvedFiles.map((file) => (
        <TabsContent key={file.name} value={file.name} className="min-w-0">
          <CodeFileBlock file={file} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CodeFileBlock({ file }: { file: ComponentCodeFile }) {
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const code = useMemo(() => file.source.trimEnd(), [file.source]);
  const lines = useMemo(() => code.split("\n"), [code]);
  const visibleLines = isCodeVisible ? lines : lines.slice(0, 4);

  return (
    <div
      data-code-visible={isCodeVisible}
      className="relative min-w-0 overflow-hidden"
    >
      {isCodeVisible ? (
        <CopyButton
          value={code}
          aria-label={`Copy ${file.name} source code`}
          title="Copy code"
          className="absolute right-3 top-3 z-10"
        />
      ) : null}
      <pre
        className={cn(
          "no-scrollbar overflow-x-auto px-6 py-4 text-sm leading-6",
          isCodeVisible && "max-h-72 overflow-y-auto pr-16"
        )}
      >
        <code className="block min-w-full font-mono">
          {visibleLines.map((line, index) => (
            <span key={`${index}-${line}`} className="flex min-w-max">
              <span className="w-10 shrink-0 select-none pr-5 text-right text-muted-foreground/70">
                {index + 1}
              </span>
              <span className="whitespace-pre text-foreground/80">
                <HighlightedLine line={line} language={file.language} />
              </span>
            </span>
          ))}
        </code>
      </pre>
      {!isCodeVisible ? (
        <div className="absolute inset-0 flex items-center justify-center pb-4">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCodeVisible(true)}
            className="relative z-10 bg-background"
          >
            View Code
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function InstallationPanel({
  installTarget,
  targetPath,
  dependencies,
}: {
  installTarget: string;
  targetPath: string;
  dependencies: string[];
}) {
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
  const command = `${commandPrefix[packageManager]} shadcn@latest add ${installTarget}`;

  return (
    <section className="min-w-0 flex flex-col gap-5">
      <h2 className="text-2xl font-semibold tracking-tight">Installation</h2>
      <Tabs defaultValue="command" className="min-w-0 gap-5">
        <TabsList
          variant="line"
          aria-label="Installation options"
          className="h-10 w-full justify-start gap-6 rounded-none border-b bg-transparent p-0 group-data-horizontal/tabs:h-10"
        >
          <TabsTrigger value="command" className="h-10 flex-none px-0 py-0">
            Command
          </TabsTrigger>
          <TabsTrigger value="manual" className="h-10 flex-none px-0 py-0">
            Manual
          </TabsTrigger>
        </TabsList>
        <TabsContent value="command" className="min-w-0">
          <CommandBlock
            command={command}
            packageManager={packageManager}
            onPackageManagerChange={setPackageManager}
          />
        </TabsContent>
        <TabsContent value="manual" className="min-w-0">
          <ManualInstall targetPath={targetPath} dependencies={dependencies} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function CommandBlock({
  command,
  packageManager,
  onPackageManagerChange,
}: {
  command: string;
  packageManager: PackageManager;
  onPackageManagerChange: (packageManager: PackageManager) => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-muted/50">
      <div className="flex min-h-11 items-center gap-3 border-b px-3">
        <Terminal className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-1">
          {packageManagers.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onPackageManagerChange(item)}
              data-active={packageManager === item}
              className="inline-flex h-7 items-center rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground data-[active=true]:border data-[active=true]:bg-background data-[active=true]:text-foreground"
            >
              {item}
            </button>
          ))}
        </div>
        <CopyButton
          value={command}
          variant="ghost"
          className="ml-auto"
          aria-label="Copy installation command"
          title="Copy command"
        />
      </div>
      <pre className="no-scrollbar overflow-x-auto px-4 py-4 text-sm">
        <code className="font-mono">{command}</code>
      </pre>
    </div>
  );
}

function ManualInstall({
  targetPath,
  dependencies,
}: {
  targetPath: string;
  dependencies: string[];
}) {
  return (
    <div className="rounded-xl border bg-background p-4 text-sm">
      <div className="flex flex-col gap-3">
        <div>
          <div className="font-medium">Copy the component file</div>
          <p className="mt-1 text-muted-foreground">
            Place the registry source at{" "}
            <code className="font-mono">{targetPath}</code>.
          </p>
        </div>
        {dependencies.length > 0 ? (
          <div>
            <div className="font-medium">Install dependencies</div>
            <p className="mt-1 font-mono text-muted-foreground">
              {dependencies.join(" ")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HighlightedLine({
  line,
  language,
}: {
  line: string;
  language: ComponentCodeLanguage;
}) {
  const trimmedLine = line.trimStart();

  if (
    trimmedLine.startsWith("//") ||
    trimmedLine.startsWith("/*") ||
    trimmedLine.startsWith("*")
  ) {
    return <span className="text-muted-foreground">{line}</span>;
  }

  const parts =
    language === "css"
      ? line.split(
          /(@keyframes|\b(?:animation|from|to|opacity|transform|transition|display|grid|overflow|inline-size|block-size)\b)/g
        )
      : line.split(
          /(\b(?:import|export|from|function|return|const|let|type|async|await|try|catch)\b)/g
        );

  const keywordPattern =
    language === "css"
      ? /^(@keyframes|animation|from|to|opacity|transform|transition|display|grid|overflow|inline-size|block-size)$/
      : /^(import|export|from|function|return|const|let|type|async|await|try|catch)$/;

  return (
    <>
      {parts.map((part, index) =>
        keywordPattern.test(part) ? (
          <span key={`${index}-${part}`} className="text-rose-500">
            {part}
          </span>
        ) : (
          <span key={`${index}-${part}`}>{part}</span>
        )
      )}
    </>
  );
}
