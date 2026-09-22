"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import {
  ArrowUpRightIcon,
  CheckIcon,
  FileCodeIcon,
  GlobeIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { DemoTabs, type DemoTabsItem, type DemoTabsScene } from "./demo-tabs";

const scripts = {
  docs: {
    command: "atlas docs --quickstart",
    lines: [
      "Resolving project context…",
      "Found 12 endpoints",
      "Generating typed examples",
      "Documentation ready.",
    ],
    eyebrow: "YOUR FIRST REQUEST",
    title: "From question to working code.",
    description: "A small example. Everything you need to start.",
    icon: FileCodeIcon,
  },
  check: {
    command: "atlas check --strict",
    lines: [
      "Reading project configuration…",
      "Types verified · 24 modules",
      "All 18 checks passed",
      "Ready for production.",
    ],
    eyebrow: "CONFIDENCE, BUILT IN",
    title: "Catch it before you ship it.",
    description: "One check for everything that matters.",
    icon: ShieldCheckIcon,
  },
  deploy: {
    command: "atlas deploy --production",
    lines: [
      "Building production bundle…",
      "Uploading assets · 142 kB",
      "Propagating to the edge",
      "Live at demo.atlas.dev",
    ],
    eyebrow: "A SHORTER PATH TO LIVE",
    title: "Local idea. Global release.",
    description: "Your next release is one command away.",
    icon: GlobeIcon,
  },
} as const;

// Both columns read the same MotionValue. No independent delays or timers:
// pause, replay and tab changes stay synchronized, even halfway through a reveal.
function Beat({
  progress,
  at,
  children,
  className,
}: {
  progress: MotionValue<number>;
  at: number;
  children: React.ReactNode;
  className?: string;
}) {
  const opacity = useTransform(progress, [at, at + 0.06], [0, 1]);
  const transform = useTransform(
    progress,
    [at, at + 0.06],
    ["translateY(6px)", "translateY(0px)"],
  );
  return (
    <motion.div style={{ opacity, transform }} className={className}>
      {children}
    </motion.div>
  );
}

function DemoScene({
  kind,
  progress,
}: DemoTabsScene & { kind: keyof typeof scripts }) {
  const script = scripts[kind];
  const Icon = script.icon;
  return (
    <>
      <p className="sr-only">
        {script.title} {script.description} {script.lines.at(-1)}
      </p>
      <div
        aria-hidden="true"
        className="grid @min-[40rem]/demo:grid-cols-[0.95fr_1.05fr]"
      >
        <div className="flex min-h-64 flex-col gap-8 border-b p-6 @min-[40rem]/demo:min-h-[25rem] @min-[40rem]/demo:border-r @min-[40rem]/demo:border-b-0 @min-[40rem]/demo:p-8">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
            <span>TERMINAL</span>
            <span>~/project</span>
          </div>
          <div className="flex flex-col gap-5 font-mono text-xs leading-relaxed">
            <div className="flex gap-3">
              <span className="text-muted-foreground">$</span>
              <span>{script.command}</span>
            </div>
            <div className="flex flex-col gap-3">
              {script.lines.map((line, index) => (
                <Beat
                  key={line}
                  progress={progress}
                  at={0.1 + index * 0.18}
                  className="flex items-center gap-3"
                >
                  <span className="text-muted-foreground">
                    {index === 3 ? "✓" : "›"}
                  </span>
                  <span
                    className={
                      index === 3 ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {line}
                  </span>
                </Beat>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-5 font-mono text-[10px] tracking-wide text-muted-foreground">
            ATLAS CLI <span className="ml-2 opacity-50">v1.0.0</span>
          </div>
        </div>
        <div className="relative flex min-h-[25rem] flex-col items-center justify-center gap-7 overflow-hidden bg-muted/15 px-6 py-10 @min-[40rem]/demo:px-10">
          <div className="flex w-full max-w-72 flex-col gap-3">
            <span className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground">
              {script.eyebrow}
            </span>
            <h3 className="max-w-64 text-2xl leading-tight tracking-tight">
              {script.title}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {script.description}
            </p>
          </div>
          <Beat
            progress={progress}
            at={0.1}
            className="w-full max-w-72 rounded-lg border bg-background shadow-sm"
          >
            <div className="flex items-center gap-2 border-b px-4 py-3 text-xs">
              <Icon className="size-3.5 text-muted-foreground" />
              <span>
                {kind === "docs"
                  ? "quickstart.ts"
                  : kind === "check"
                    ? "Project health"
                    : "Production"}
              </span>
            </div>
            <div className="flex min-h-28 flex-col justify-center gap-3 p-4">
              {kind === "docs" ? (
                <>
                  <Beat
                    progress={progress}
                    at={0.28}
                    className="font-mono text-[11px] text-muted-foreground"
                  >
                    const client = atlas();
                  </Beat>
                  <Beat
                    progress={progress}
                    at={0.46}
                    className="font-mono text-[11px]"
                  >
                    await client.hello();
                  </Beat>
                  <Beat
                    progress={progress}
                    at={0.64}
                    className="flex items-center gap-2 text-[11px] text-muted-foreground"
                  >
                    <CheckIcon className="size-3" /> 200 OK · Hello, world.
                  </Beat>
                </>
              ) : kind === "check" ? (
                ["Type safety", "Dependencies", "Build integrity"].map(
                  (label, index) => (
                    <Beat
                      key={label}
                      progress={progress}
                      at={0.28 + index * 0.18}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <CheckIcon className="size-3.5" />
                    </Beat>
                  ),
                )
              ) : (
                <>
                  <Beat
                    progress={progress}
                    at={0.28}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">Build</span>
                    <span>Complete</span>
                  </Beat>
                  <Beat
                    progress={progress}
                    at={0.46}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">Regions</span>
                    <span>12 / 12</span>
                  </Beat>
                  <Beat
                    progress={progress}
                    at={0.64}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>demo.atlas.dev</span>
                    <ArrowUpRightIcon className="size-3.5" />
                  </Beat>
                </>
              )}
            </div>
          </Beat>
        </div>
      </div>
    </>
  );
}

const items: readonly DemoTabsItem[] = [
  {
    value: "docs",
    label: "docs",
    description: "Find your starting point",
    duration: 6500,
    render: (scene) => <DemoScene {...scene} kind="docs" />,
  },
  {
    value: "check",
    label: "check",
    description: "Ship with confidence",
    duration: 6000,
    render: (scene) => <DemoScene {...scene} kind="check" />,
  },
  {
    value: "deploy",
    label: "deploy",
    description: "Take it to production",
    duration: 6500,
    render: (scene) => <DemoScene {...scene} kind="deploy" />,
  },
];

export function DemoTabsExample() {
  return <DemoTabs items={items} />;
}
