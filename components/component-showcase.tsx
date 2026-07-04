"use client";

import { Atom, Maximize2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { RegistryInstallCommand } from "@/components/registry-install-command";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CopyButton } from "@/registry/base/ui/copy-button";
import {
  PreviewCornerSlotProvider,
  RegistryPreview,
} from "@/components/registry-preview";
import { cn } from "@/lib/utils";

export type ComponentCodeLanguage = "css" | "ts" | "tsx";

export type ComponentCodeFile = {
  name: string;
  language: ComponentCodeLanguage;
  source: string;
  highlighted?: ReactNode;
};

export type ComponentCodeVariant = {
  value: string;
  label: string;
  files: ComponentCodeFile[];
};

type ComponentShowcaseProps = {
  name: string;
  type?: string;
  codeVariants: ComponentCodeVariant[];
  targetPath: string;
  dependencies?: string[];
  motionApiSnippets?: ComponentCodeFile[];
  fullscreenHref?: string;
};

export function ComponentShowcase({
  name,
  type,
  codeVariants,
  targetPath,
  dependencies = [],
  motionApiSnippets = [],
  fullscreenHref,
}: ComponentShowcaseProps) {
  if (type === "registry:hook") {
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-12">
        <HookPreview
          name={name}
          codeVariants={codeVariants}
          fullscreenHref={fullscreenHref}
        />
        <InstallationPanel
          name={name}
          targetPath={targetPath}
          dependencies={dependencies}
          hasCssOnlyVariant={false}
          motionApiSnippets={motionApiSnippets}
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-12">
      <ComponentPreviewCard
        name={name}
        codeVariants={codeVariants}
        fullscreenHref={fullscreenHref}
      />
      <InstallationPanel
        name={name}
        targetPath={targetPath}
        dependencies={dependencies}
        hasCssOnlyVariant={codeVariants.some(
          (variant) => variant.value === "css-only",
        )}
        motionApiSnippets={motionApiSnippets}
      />
    </div>
  );
}

function HookPreview({
  name,
  codeVariants,
  fullscreenHref,
}: {
  name: string;
  codeVariants: ComponentCodeVariant[];
  fullscreenHref?: string;
}) {
  const config = hookPreviewConfigs[name];
  const demoVariants = config?.demoVariants ?? hookDemoVariants;
  const defaultDemoVariant = demoVariants[0];

  return (
    <section className="flex min-w-0 flex-col gap-6">
      {config ? (
        <div className="flex max-w-3xl flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {config.title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {config.description}
          </p>
        </div>
      ) : null}
      {demoVariants.length > 1 && defaultDemoVariant ? (
        <Tabs defaultValue={defaultDemoVariant.value} className="min-w-0 gap-3">
          <TabsList aria-label="Demo implementation" className="w-fit">
            {demoVariants.map((variant) => (
              <TabsTrigger key={variant.value} value={variant.value}>
                {variant.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {demoVariants.map((variant) => (
            <TabsContent key={variant.value} value={variant.value}>
              <div className="relative overflow-hidden rounded-xl border bg-background">
                <div className="p-6">
                  <PreviewCornerSlotProvider
                    className={fullscreenHref ? "right-13 top-3" : "right-3 top-3"}
                  >
                    <RegistryPreview name={name} variant={variant.value} />
                  </PreviewCornerSlotProvider>
                </div>
                <PreviewFullscreenAction href={fullscreenHref} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="relative overflow-hidden rounded-xl border bg-background">
          <div className="p-6">
            <PreviewCornerSlotProvider
              className={fullscreenHref ? "right-13 top-3" : "right-3 top-3"}
            >
              <RegistryPreview name={name} variant={defaultDemoVariant?.value} />
            </PreviewCornerSlotProvider>
          </div>
          <PreviewFullscreenAction href={fullscreenHref} />
        </div>
      )}
      {codeVariants.length > 0 ? (
        <HookCodeVariants codeVariants={codeVariants} />
      ) : null}
    </section>
  );
}

function HookCodeVariants({
  codeVariants,
}: {
  codeVariants: ComponentCodeVariant[];
}) {
  const defaultCodeVariant = codeVariants[0];

  if (!defaultCodeVariant) {
    return null;
  }

  if (codeVariants.length === 1) {
    return <HookCodeVariantContent variant={defaultCodeVariant} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-base font-semibold">Code</h3>
      <Tabs defaultValue={defaultCodeVariant.value} className="min-w-0 gap-3">
        <TabsList
          variant="line"
          aria-label="Code examples"
          className="h-10 w-full justify-start gap-6 rounded-none border-b bg-transparent p-0 group-data-horizontal/tabs:h-10"
        >
          {codeVariants.map((variant) => (
            <TabsTrigger
              key={variant.value}
              value={variant.value}
              className="h-10 flex-none px-0 py-0"
            >
              {variant.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {codeVariants.map((variant) => (
          <TabsContent
            key={variant.value}
            value={variant.value}
            className="min-w-0"
          >
            <HookCodeVariantContent variant={variant} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function HookCodeVariantContent({
  variant,
}: {
  variant: ComponentCodeVariant;
}) {
  if (variant.files.length === 1) {
    return (
      <div className="min-w-0 [&_figure]:my-0">
        {variant.files[0]?.highlighted}
      </div>
    );
  }

  return <CodeFileTabs files={variant.files} />;
}

const hookDemoVariants = [
  { value: "usage", label: "Usage" },
] as const;

type HookPreviewConfig = {
  title: string;
  description: ReactNode;
  demoVariants?: typeof hookDemoVariants;
};

const hookPreviewConfigs: Partial<Record<
  string,
  HookPreviewConfig
>> = {
  "use-reduced-motion": {
    title: "Why this hook matters",
    description: (
      <>
        <code className="font-mono text-foreground">useReducedMotion</code>{" "}
        lets a component respect the user&apos;s{" "}
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
        >
          reduced-motion preference
        </a>{" "}
        without changing what the interface means. The local hook gives
        components the same preference signal without adding a motion-library
        dependency; the preview controls only simulate Standard and Reduced
        states so both paths can be compared on the page.
      </>
    ),
  },
  "use-element-height": {
    title: "Animate to real content height",
    description: (
      <>
        <code className="font-mono text-foreground">useElementHeight</code>{" "}
        measures one rendered element and gives a container a stable pixel
        height to animate toward. It is the right fit for accordions,
        collapsibles, step flows, drawers, and panels where the width is fixed
        but the content height changes.
      </>
    ),
  },
  "use-element-size-map": {
    title: "Measure multiple layouts before they become active",
    description: (
      <>
        <code className="font-mono text-foreground">useElementSizeMap</code>{" "}
        stores width and height by key, so a component can animate an outer
        shell, highlight, toolbar, or floating panel toward the measured size of
        the selected item. It is useful when inactive content still needs to
        define the next layout target.
      </>
    ),
  },
};

function ComponentPreviewCard({
  name,
  codeVariants,
  fullscreenHref,
}: {
  name: string;
  codeVariants: ComponentCodeVariant[];
  fullscreenHref?: string;
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
  const hasMultipleVariants = variants.length > 1;

  return (
    <section
      data-slot="component-preview"
      className="group relative min-w-0 max-w-full overflow-hidden rounded-xl border bg-background"
    >
      <Tabs defaultValue={variants[0].value} className="min-w-0 gap-0">
        {hasMultipleVariants ? (
          <div className="flex min-h-12 items-center border-b bg-muted/30 px-3 py-3">
            <TabsList
              aria-label="Implementation"
              className="max-w-full overflow-x-auto shadow-none sm:w-fit"
            >
              {variants.map((variant) => (
                <TabsTrigger
                  key={variant.value}
                  value={variant.value}
                  className="px-3"
                >
                  {variant.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ) : null}
        <div className="relative flex min-h-[288px] items-center justify-center p-10">
          <PreviewCornerSlotProvider
            className={fullscreenHref ? "right-13 top-3" : "right-3 top-3"}
          >
            {hasMultipleVariants ? (
              variants.map((variant) => (
                <TabsContent
                  key={variant.value}
                  value={variant.value}
                  className="flex w-full items-center justify-center"
                >
                  <RegistryPreview name={name} variant={variant.value} />
                </TabsContent>
              ))
            ) : (
              <TabsContent
                value={variants[0].value}
                className="flex w-full items-center justify-center"
              >
                <RegistryPreview name={name} variant={variants[0].value} />
              </TabsContent>
            )}
          </PreviewCornerSlotProvider>
          <PreviewFullscreenAction href={fullscreenHref} />
        </div>
        <div
          data-slot="code"
          className="relative min-w-0 max-w-full overflow-hidden border-t bg-muted/30"
        >
          {variants.map((variant) => (
            <TabsContent
              key={variant.value}
              value={variant.value}
              className="min-w-0"
            >
              <CodeFileTabs files={variant.files} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </section>
  );
}

function PreviewFullscreenAction({ href }: { href?: string }) {
  if (!href) {
    return null;
  }

  return (
    <Link
      href={href}
      title="Open fullscreen demo"
      aria-label="Open fullscreen demo"
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "absolute right-3 top-3 z-10 bg-background/80 backdrop-blur-sm",
      )}
    >
      <Maximize2 aria-hidden="true" />
    </Link>
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
                className="relative h-10 min-w-32 max-w-60 flex-none justify-start rounded-none border-0 bg-muted/40 px-3 py-0 text-xs font-medium shadow-none transition-none hover:bg-background/70 data-active:bg-background data-active:text-foreground data-active:shadow-none has-data-[icon=inline-start]:pl-3 after:hidden"
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
        data-icon="inline-start"
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

  if (language === "ts") {
    return (
      <span
        data-icon="inline-start"
        aria-hidden="true"
        className="w-4 shrink-0 text-center font-mono text-sm font-semibold leading-none text-sky-500"
      >
        ts
      </span>
    );
  }

  return null;
}

function CodeFileBlock({ file }: { file: ComponentCodeFile }) {
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const code = useMemo(() => file.source.trimEnd(), [file.source]);

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
      <div
        className={cn(
          "min-w-0 max-w-full",
          !isCodeVisible && "max-h-32 overflow-hidden"
        )}
      >
        {file.highlighted}
      </div>
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
  name,
  targetPath,
  dependencies,
  hasCssOnlyVariant,
  motionApiSnippets,
}: {
  name: string;
  targetPath: string;
  dependencies: string[];
  hasCssOnlyVariant: boolean;
  motionApiSnippets: ComponentCodeFile[];
}) {
  return (
    <section className="min-w-0 flex flex-col gap-5">
      <div className="flex max-w-3xl flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Installation</h2>
        {hasCssOnlyVariant ? (
          <p className="text-sm leading-6 text-muted-foreground">
            The command installs the Motion version. The CSS-only source is
            available above as a manual copy-paste variant when you want to
            avoid the animation dependency.
          </p>
        ) : null}
      </div>
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
          <RegistryInstallCommand name={name} />
        </TabsContent>
        <TabsContent value="manual" className="min-w-0">
          <ManualInstall targetPath={targetPath} dependencies={dependencies} />
        </TabsContent>
      </Tabs>
      {name === "use-reduced-motion" ? (
        <UseReducedMotionInstallationNotes snippets={motionApiSnippets} />
      ) : null}
    </section>
  );
}

function UseReducedMotionInstallationNotes({
  snippets,
}: {
  snippets: ComponentCodeFile[];
}) {
  const [reducedMotionSnippet, motionConfigSnippet] = snippets;

  return (
    <section className="flex max-w-3xl flex-col gap-6 border-t pt-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">Choose the right trade-off</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          The local hook does one job: it reads{" "}
          <code className="font-mono text-foreground">prefers-reduced-motion</code>{" "}
          with <code className="font-mono text-foreground">matchMedia</code>,
          syncs the current value after mount, and removes its change listener
          during cleanup. That gives components the same reduced-motion branch
          point as Motion&apos;s{" "}
          <code className="font-mono text-foreground">useReducedMotion</code>{" "}
          hook, without installing Motion or adding its bundle weight.
        </p>
      </div>
      <article className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
        <h4 className="text-base font-semibold text-foreground">Using Motion</h4>
        <p>
          If Motion already drives the component&apos;s animations, use
          Motion&apos;s{" "}
          <code className="font-mono text-foreground">useReducedMotion</code>{" "}
          instead. It keeps the decision inside the same API you use for
          variants, transitions, and animated values, which is usually clearer
          than mixing in a separate local hook.
        </p>
        {reducedMotionSnippet ? (
          <CodeSnippet snippet={reducedMotionSnippet} />
        ) : null}
        <p>
          For a larger Motion tree, set the preference once with{" "}
          <code className="font-mono text-foreground">MotionConfig</code>. This
          is useful when a parent should make every Motion child follow the
          user&apos;s device preference by default.
        </p>
        {motionConfigSnippet ? (
          <CodeSnippet snippet={motionConfigSnippet} />
        ) : null}
      </article>
    </section>
  );
}

function CodeSnippet({ snippet }: { snippet: ComponentCodeFile }) {
  return <div className="min-w-0 [&_figure]:my-0">{snippet.highlighted}</div>;
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
