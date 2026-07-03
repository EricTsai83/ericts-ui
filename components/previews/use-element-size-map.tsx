"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import {
  DemoSegmentedControl,
  easeOutCubicTuple,
} from "@/components/previews/hook-demo-shared";
import { cn } from "@/lib/utils";
import {
  useElementSizeMap,
  type ElementSize,
} from "@/registry/base/hooks/use-element-size-map";

type ElementSizeMapPanelData = {
  id: string;
  label: string;
  title: string;
  meta: string;
  badge: string;
  className: string;
  rows: { label: string; value: string }[];
  footer?: string;
};

const elementSizeMapPanels: ElementSizeMapPanelData[] = [
  {
    id: "compact",
    label: "Compact",
    title: "Inbox",
    meta: "Focused triage",
    badge: "3",
    className: "w-56",
    rows: [
      { label: "Mentions", value: "12" },
      { label: "Assigned", value: "4" },
      { label: "Snoozed", value: "2" },
    ],
  },
  {
    id: "wide",
    label: "Wide",
    title: "Campaign health",
    meta: "Live segments",
    badge: "Live",
    className: "w-72",
    rows: [
      { label: "Activation", value: "68%" },
      { label: "Retention", value: "41%" },
      { label: "Expansion", value: "19%" },
    ],
    footer:
      "North America is pacing ahead of forecast after the pricing update.",
  },
  {
    id: "tall",
    label: "Tall",
    title: "Launch plan",
    meta: "Final sequence",
    badge: "6",
    className: "w-64",
    rows: [
      { label: "Freeze scope", value: "Done" },
      { label: "Notify beta", value: "9:00" },
      { label: "Publish docs", value: "10:30" },
      { label: "Enable flag", value: "11:00" },
      { label: "Read metrics", value: "14:00" },
    ],
    footer: "Owners are assigned for each launch window and rollback review.",
  },
];

const elementSizeMapFallbackSize = {
  width: 224,
  height: 168,
} satisfies ElementSize;

export default function Preview() {
  const [activeId, setActiveId] = useState<string>(elementSizeMapPanels[0].id);
  const { setMeasureRef, sizes } = useElementSizeMap<HTMLDivElement>();
  const shouldReduceMotion = useReducedMotion();
  const activePanel =
    elementSizeMapPanels.find((panel) => panel.id === activeId) ??
    elementSizeMapPanels[0];
  const activeSize = sizes[activePanel.id] ?? elementSizeMapFallbackSize;

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-4">
      <DemoSegmentedControl
        label="Measured panel"
        items={elementSizeMapPanels}
        value={activeId}
        onValueChange={setActiveId}
      />

      <div
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0"
      >
        {elementSizeMapPanels.map((panel) => (
          <div key={panel.id} ref={setMeasureRef(panel.id)} className="w-max">
            <ElementSizeMapPanel panel={panel} />
          </div>
        ))}
      </div>

      <motion.div
        animate={{ width: activeSize.width, height: activeSize.height }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.24, ease: easeOutCubicTuple }
        }
        className="relative overflow-hidden rounded-lg border bg-background shadow-sm"
      >
        <motion.div
          key={activePanel.id}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, scale: 0.98, filter: "blur(4px)" }
          }
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.18,
            ease: easeOutCubicTuple,
          }}
          className="absolute left-0 top-0"
          style={{ transformOrigin: "top left" }}
        >
          <ElementSizeMapPanel panel={activePanel} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function ElementSizeMapPanel({ panel }: { panel: ElementSizeMapPanelData }) {
  return (
    <div className={cn("flex flex-col gap-3 p-4", panel.className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{panel.title}</p>
          <p className="text-xs text-muted-foreground">{panel.meta}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {panel.badge}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {panel.rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-2.5 py-2 text-sm"
          >
            <span className="min-w-0 truncate text-foreground">
              {row.label}
            </span>
            <span className="shrink-0 font-medium text-muted-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {panel.footer ? (
        <p className="rounded-md border bg-background px-2.5 py-2 text-xs leading-5 text-muted-foreground">
          {panel.footer}
        </p>
      ) : null}
    </div>
  );
}
