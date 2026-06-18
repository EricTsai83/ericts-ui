"use client";

import { Check, Copy, Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const lines = useMemo(() => source.trimEnd().split("\n"), [source]);
  const visibleLines = isCodeVisible ? lines : lines.slice(0, 6);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-background">
      <div className="flex min-h-[288px] items-center justify-center p-10">
        <RegistryPreview name={name} />
      </div>
      <div
        className={cn(
          "relative min-w-0 border-t bg-muted/30",
          isCodeVisible ? "max-h-[420px] overflow-auto" : "h-28 overflow-hidden"
        )}
      >
        <pre className="overflow-x-auto px-6 py-4 text-sm leading-6">
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <button
              type="button"
              onClick={() => setIsCodeVisible(true)}
              className="relative inline-flex h-8 items-center rounded-lg border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View Code
            </button>
          </div>
        ) : (
          <div className="sticky bottom-0 flex justify-center border-t bg-background/95 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={() => setIsCodeVisible(false)}
              className="inline-flex h-8 items-center rounded-lg border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Hide Code
            </button>
          </div>
        )}
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
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

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
        <button
          type="button"
          onClick={copyCommand}
          className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Copy installation command"
          title="Copy command"
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-sm">
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
