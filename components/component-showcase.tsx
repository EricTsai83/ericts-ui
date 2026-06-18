"use client";

import { Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

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

type ComponentShowcaseProps = {
  name: string;
  source: string;
  installTarget: string;
  targetPath: string;
  dependencies?: string[];
};

export function ComponentShowcase({
  name,
  source,
  installTarget,
  targetPath,
  dependencies = [],
}: ComponentShowcaseProps) {
  return (
    <div className="flex min-w-0 flex-col gap-12">
      <ComponentPreviewCard name={name} source={source} />
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
  source,
}: {
  name: string;
  source: string;
}) {
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const code = useMemo(() => source.trimEnd(), [source]);
  const lines = useMemo(() => code.split("\n"), [code]);
  const visibleLines = isCodeVisible ? lines : lines.slice(0, 4);

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
        data-code-visible={isCodeVisible}
        className="relative min-w-0 overflow-hidden border-t bg-muted/30"
      >
        {isCodeVisible ? (
          <CopyButton
            value={code}
            aria-label="Copy component source code"
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
                  <HighlightedLine line={line} />
                </span>
              </span>
            ))}
          </code>
        </pre>
        {!isCodeVisible ? (
          <div className="absolute inset-0 flex items-center justify-center pb-4">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <button
              type="button"
              onClick={() => setIsCodeVisible(true)}
              className="relative inline-flex h-8 items-center rounded-lg border bg-background px-4 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View Code
            </button>
          </div>
        ) : null}
      </div>
    </section>
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
  const [mode, setMode] = useState<"command" | "manual">("command");
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
  const command = `${commandPrefix[packageManager]} shadcn@latest add ${installTarget}`;

  return (
    <section className="min-w-0 flex flex-col gap-5">
      <h2 className="text-2xl font-semibold tracking-tight">Installation</h2>
      <div className="flex gap-6 border-b">
        <TabButton isActive={mode === "command"} onClick={() => setMode("command")}>
          Command
        </TabButton>
        <TabButton isActive={mode === "manual"} onClick={() => setMode("manual")}>
          Manual
        </TabButton>
      </div>
      {mode === "command" ? (
        <CommandBlock
          command={command}
          packageManager={packageManager}
          onPackageManagerChange={setPackageManager}
        />
      ) : (
        <ManualInstall targetPath={targetPath} dependencies={dependencies} />
      )}
    </section>
  );
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={isActive}
      className="relative -mb-px h-10 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:border-b-2 data-[active=true]:border-foreground data-[active=true]:text-foreground"
    >
      {children}
    </button>
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

function HighlightedLine({ line }: { line: string }) {
  if (line.trimStart().startsWith("//")) {
    return <span className="text-muted-foreground">{line}</span>;
  }

  const parts = line.split(
    /(\b(?:import|export|from|function|return|const|let|type|async|await|try|catch)\b)/g
  );

  return (
    <>
      {parts.map((part, index) =>
        /^(import|export|from|function|return|const|let|type|async|await|try|catch)$/.test(
          part
        ) ? (
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
