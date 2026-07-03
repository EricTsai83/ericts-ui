"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import {
  DemoSegmentedControl,
  easeOutCubicTuple,
} from "@/components/previews/hook-demo-shared";
import { useElementHeight } from "@/registry/base/hooks/use-element-height";

const elementHeightPanels = [
  {
    id: "brief",
    label: "Brief",
    title: "Daily pulse",
    meta: "3 pinned updates",
    badge: "Short",
    rows: [
      "Design review at 10:00",
      "Billing copy is ready",
      "Deploy note sent",
    ],
  },
  {
    id: "queue",
    label: "Queue",
    title: "Review queue",
    meta: "5 changes waiting",
    badge: "Medium",
    rows: [
      "Navigation labels",
      "Checkout empty state",
      "Webhook retry copy",
      "Team invite flow",
      "Audit log filters",
    ],
  },
  {
    id: "handoff",
    label: "Handoff",
    title: "Release handoff",
    meta: "Cross-functional checklist",
    badge: "Tall",
    rows: [
      "QA pass confirmed",
      "Migration notes attached",
      "Support macros updated",
      "Launch dashboard pinned",
      "Rollback owner assigned",
      "Metrics review scheduled",
    ],
  },
] as const;

export default function Preview({ variant }: { variant: string }) {
  const [activeId, setActiveId] = useState<string>(elementHeightPanels[0].id);
  const [measureRef, height] = useElementHeight<HTMLDivElement>();
  const shouldReduceMotion = useReducedMotion();
  const activePanel =
    elementHeightPanels.find((panel) => panel.id === activeId) ??
    elementHeightPanels[0];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <DemoSegmentedControl
        label="Panel height"
        items={elementHeightPanels}
        value={activeId}
        onValueChange={setActiveId}
      />

      <motion.div
        animate={{ height: height ?? "auto" }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.24, ease: easeOutCubicTuple }
        }
        className="overflow-hidden rounded-lg border bg-background"
      >
        <div ref={measureRef} className="p-4">
          <motion.div
            key={activePanel.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.18,
              ease: easeOutCubicTuple,
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activePanel.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activePanel.meta}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {activePanel.badge}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {activePanel.rows.map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-2 rounded-md bg-muted/45 px-2.5 py-2 text-sm text-foreground"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 truncate">{row}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
