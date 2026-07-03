"use client";

import { motion } from "motion/react";
import { useId, useState, type ReactNode } from "react";

import { easeOutCubicTuple } from "@/components/previews/hook-demo-shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReducedMotionDemoPreference = "no-preference" | "reduce";

const preferenceOptions: {
  value: ReducedMotionDemoPreference;
  label: string;
}[] = [
  { value: "no-preference", label: "Standard" },
  { value: "reduce", label: "Reduced" },
];

const previewRows = ["a", "b", "c", "d"];
const sidebarItems = ["overview", "activity", "settings", "members"];
const sidebarWidth = 144;

export default function Preview() {
  const [preference, setPreference] =
    useState<ReducedMotionDemoPreference>("no-preference");
  const shouldReduceMotion = preference === "reduce";
  const [isOpen, setIsOpen] = useState(false);
  const preferenceGroupName = useId();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
          <legend className="sr-only">Reduced motion preference</legend>
          {preferenceOptions.map((option) => (
            <label
              key={option.value}
              className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground has-[input:checked]:bg-background has-[input:checked]:text-foreground has-[input:checked]:shadow-sm has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring sm:flex-none"
            >
              <input
                type="radio"
                name={preferenceGroupName}
                value={option.value}
                checked={preference === option.value}
                onChange={() => {
                  setPreference(option.value);
                  setIsOpen(false);
                }}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((value) => !value)}
          className="self-start sm:self-auto"
        >
          {isOpen ? "Close sidebar" : "Open sidebar"}
        </Button>
      </div>

      <ReducedMotionSidebarDemo
        isOpen={isOpen}
        shouldReduceMotion={shouldReduceMotion}
      />
    </div>
  );
}

function ReducedMotionSidebarDemo({
  isOpen,
  shouldReduceMotion,
}: {
  isOpen: boolean;
  shouldReduceMotion: boolean;
}) {
  const gridTemplateColumns = `${isOpen ? sidebarWidth : 0}px minmax(0, 1fr)`;

  return (
    <SidebarDemoShell>
      <motion.div
        className="grid h-48 overflow-hidden bg-background"
        style={{ gridTemplateColumns }}
        animate={{ gridTemplateColumns }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.22, ease: easeOutCubicTuple }
        }
      >
        <ReducedMotionSidebarPane
          isOpen={isOpen}
          shouldReduceMotion={shouldReduceMotion}
        />
        <MainPane />
      </motion.div>
    </SidebarDemoShell>
  );
}

function SidebarDemoShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex h-9 items-center justify-between border-b bg-muted/40 px-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-muted-foreground/35" />
          <span className="size-2 rounded-full bg-muted-foreground/25" />
          <span className="size-2 rounded-full bg-muted-foreground/20" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Product list
        </span>
      </div>
      {children}
    </div>
  );
}

function ReducedMotionSidebarPane({
  isOpen,
  shouldReduceMotion,
}: {
  isOpen: boolean;
  shouldReduceMotion: boolean;
}) {
  const opacity = isOpen ? 1 : 0;

  return (
    <motion.div
      aria-hidden={!isOpen}
      className="min-w-0 overflow-hidden border-r bg-background"
      animate={{ opacity }}
      style={{ opacity, pointerEvents: isOpen ? "auto" : "none" }}
      transition={{
        duration: shouldReduceMotion ? 0.12 : 0.18,
        ease: easeOutCubicTuple,
      }}
    >
      <SidebarContent />
    </motion.div>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full w-36 flex-col">
      <div className="border-b px-3 py-2.5">
        <p className="text-xs font-medium">Sidebar</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {sidebarItems.map((item, index) => (
          <div
            key={item}
            className={cn(
              "h-7 rounded-md",
              index === 0 ? "bg-foreground/90" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MainPane() {
  return (
    <div aria-hidden="true" className="min-w-0 p-4">
      <div className="flex h-full min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="h-3 w-28 rounded-full bg-foreground/75" />
          <span className="h-2 w-52 max-w-full rounded-full bg-muted-foreground/30" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {previewRows.map((row) => (
            <span key={row} className="rounded-md border bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
