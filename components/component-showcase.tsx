"use client";

import { Atom, CircleAlert, Terminal } from "lucide-react";
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
    <div className="flex min-w-0 max-w-full flex-col gap-12">
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
      className="group relative min-w-0 max-w-full overflow-hidden rounded-xl border bg-background"
    >
      <div className="flex min-h-[288px] items-center justify-center p-10">
        <RegistryPreview name={name} />
      </div>
      <div
        data-slot="code"
        className="relative min-w-0 max-w-full overflow-hidden border-t bg-muted/30"
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
                title={
                  variant.value === "css-only"
                    ? "CSS-only is manual: the install command adds the Motion version. Copy both files from this tab to avoid the animation dependency."
                    : undefined
                }
              >
                <span>{variant.label}</span>
                {variant.value === "css-only" ? (
                  <CircleAlert
                    data-icon="inline-end"
                    aria-label="CSS-only installs manually"
                    className="text-muted-foreground"
                  />
                ) : null}
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
  const resolvedFiles = useMemo<ComponentCodeFile[]>(
    () =>
      files.length > 0
        ? files
        : [{ name: "component.tsx", language: "tsx", source: "" }],
    [files],
  );
  const [activeFile, setActiveFile] = useState(resolvedFiles[0].name);
  const activeFileValue = resolvedFiles.some((file) => file.name === activeFile)
    ? activeFile
    : resolvedFiles[0].name;

  return (
    <Tabs
      value={activeFileValue}
      onValueChange={(value) => {
        if (value != null) {
          setActiveFile(String(value));
        }
      }}
      className="min-w-0 gap-0"
    >
      <div className="flex min-h-10 min-w-0 max-w-full items-end border-b bg-muted/60">
        <TabsList
          aria-label={
            resolvedFiles.length > 1 ? "Code files" : "Current code file"
          }
          className="no-scrollbar h-10 w-full max-w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-10"
        >
          {resolvedFiles.map((file, index) => {
            const isActive = file.name === activeFileValue;
            const isBeforeActive =
              resolvedFiles[index + 1]?.name === activeFileValue;
            const hasPreviousFile = index > 0;
            const hasNextFile = index < resolvedFiles.length - 1;

            return (
              <TabsTrigger
                key={file.name}
                value={file.name}
                className="relative h-10 min-w-32 max-w-60 flex-none justify-start rounded-none border-0 bg-muted/40 px-2.5 py-0 text-xs font-medium shadow-none transition-none hover:bg-background/70 data-active:bg-background data-active:text-foreground data-active:shadow-none after:hidden"
              >
                {isActive && hasPreviousFile ? (
                  <FileTabSeparator side="left" />
                ) : null}
                <FileTypeIcon language={file.language} />
                <span className="min-w-0 flex-1 truncate text-left">
                  {file.name}
                </span>
                {hasNextFile && !isBeforeActive ? (
                  <FileTabSeparator side="right" />
                ) : null}
              </TabsTrigger>
            );
          })}
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

function FileTabSeparator({ side }: { side: "left" | "right" }) {
  return (
    <span
      data-slot="file-tab-separator"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-2 w-px bg-border/70",
        side === "left" ? "left-0" : "right-0",
      )}
    />
  );
}

function FileTypeIcon({ language }: { language: ComponentCodeLanguage }) {
  if (language === "css") {
    return (
      <span
        aria-hidden="true"
        className="w-4 shrink-0 text-center font-mono text-sm font-semibold leading-none text-sky-500"
      >
        #
      </span>
    );
  }

  if (language === "tsx") {
    return (
      <Atom
        data-icon="inline-start"
        aria-hidden="true"
        className="text-sky-500"
      />
    );
  }

  return null;
}

function CodeFileBlock({ file }: { file: ComponentCodeFile }) {
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const code = useMemo(() => file.source.trimEnd(), [file.source]);
  const lines = useMemo(() => code.split("\n"), [code]);
  const visibleLines = isCodeVisible ? lines : lines.slice(0, 4);

  return (
    <div
      data-code-visible={isCodeVisible}
      className="relative min-w-0 max-w-full overflow-hidden bg-background"
    >
      {isCodeVisible ? (
        <CopyButton
          value={code}
          aria-label={`Copy ${file.name} source code`}
          title="Copy code"
          className="absolute right-3 top-3 z-10 bg-background"
        />
      ) : null}
      <pre
        className={cn(
          "no-scrollbar max-w-full overflow-x-auto px-4 py-4 text-sm leading-6",
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
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl bg-muted/50">
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
      <pre className="no-scrollbar max-w-full overflow-x-auto px-4 py-4 text-sm">
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
