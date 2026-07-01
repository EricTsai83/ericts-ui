"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  ComponentCodeFile,
  ComponentCodeVariant,
} from "@/components/component-showcase";
import { RegistryInstallCommand } from "@/components/registry-install-command";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { RegistryCodeModel } from "@/lib/registry-code";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/registry/base/ui/copy-button";

export function RegistryDemoCodeDrawer({
  item,
  codeModel,
  open,
  onOpenChange,
}: {
  item: RegistryDisplayItem;
  codeModel: RegistryCodeModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const defaultValue = codeModel.variants[0]?.value ?? "install";

  return (
    <aside
      data-registry-demo-drawer
      data-open={open}
      aria-hidden={!open}
      aria-label={`${item.title} code and installation`}
      inert={open ? undefined : true}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex max-h-[82vh] min-h-0 flex-col border-t bg-popover text-popover-foreground shadow-lg transition-transform duration-200 ease-out md:inset-x-auto md:inset-y-0 md:right-0 md:h-screen md:w-[min(560px,calc(100vw-2rem))] md:max-h-none md:border-l md:border-t-0",
        open
          ? "translate-y-0 md:translate-x-0"
          : "translate-y-full md:translate-x-full md:translate-y-0",
      )}
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b px-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">Code / Install</h2>
          <p className="truncate text-xs text-muted-foreground">{item.name}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close code drawer"
          onClick={() => onOpenChange(false)}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <Tabs defaultValue="install" className="min-h-0 flex-1 gap-0">
        <div className="no-scrollbar min-h-11 overflow-x-auto border-b px-3">
          <TabsList
            variant="line"
            aria-label="Code drawer sections"
            className="h-11 w-max justify-start gap-5 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-11"
          >
            <TabsTrigger value="install" className="h-11 flex-none px-0 py-0">
              Install
            </TabsTrigger>
            {codeModel.variants.map((variant) => (
              <TabsTrigger
                key={variant.value}
                value={variant.value}
                className="h-11 flex-none px-0 py-0"
              >
                {variant.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="install" className="min-w-0 p-4">
            <div className="flex flex-col gap-4">
              <RegistryInstallCommand installTarget={codeModel.installTarget} />
              <ManualInstallSummary codeModel={codeModel} />
            </div>
          </TabsContent>
          {codeModel.variants.map((variant) => (
            <TabsContent
              key={variant.value}
              value={variant.value || defaultValue}
              className="min-w-0"
            >
              <CodeVariantPanel variant={variant} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </aside>
  );
}

function ManualInstallSummary({
  codeModel,
}: {
  codeModel: RegistryCodeModel;
}) {
  return (
    <div className="rounded-lg border bg-background p-4 text-sm">
      <div className="flex flex-col gap-3">
        <div>
          <div className="font-medium">Target path</div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {codeModel.targetPath}
          </p>
        </div>
        {codeModel.dependencies.length > 0 ? (
          <div>
            <div className="font-medium">Dependencies</div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {codeModel.dependencies.join(" ")}
            </p>
          </div>
        ) : null}
        {codeModel.hasCssOnlyVariant ? (
          <p className="text-xs leading-5 text-muted-foreground">
            The command installs the Motion version. The CSS-only files are
            available in the CSS only tab.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CodeVariantPanel({ variant }: { variant: ComponentCodeVariant }) {
  if (variant.files.length <= 1) {
    const file = variant.files[0];

    return file ? <CodeFilePanel file={file} /> : null;
  }

  return <CodeFileTabs files={variant.files} />;
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
      <div className="no-scrollbar min-h-10 overflow-x-auto border-b bg-muted/40 px-3">
        <TabsList
          variant="line"
          aria-label="Code files"
          className="h-10 w-max justify-start gap-5 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-10"
        >
          {resolvedFiles.map((file) => (
            <TabsTrigger
              key={file.name}
              value={file.name}
              className="h-10 flex-none px-0 py-0"
            >
              {file.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {resolvedFiles.map((file) => (
        <TabsContent key={file.name} value={file.name} className="min-w-0">
          <CodeFilePanel file={file} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CodeFilePanel({ file }: { file: ComponentCodeFile }) {
  const code = file.source.trimEnd();

  return (
    <div className="relative min-w-0 bg-background">
      <CopyButton
        value={code}
        aria-label={`Copy ${file.name} source code`}
        title="Copy code"
        className="absolute right-3 top-3 z-10 bg-background"
      />
      <div className="min-w-0 [&_figure]:my-0 [&_pre]:max-h-none">
        {file.highlighted}
      </div>
    </div>
  );
}
