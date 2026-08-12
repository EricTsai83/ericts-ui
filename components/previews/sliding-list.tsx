"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import {
  SlidingList,
  type SlidingListItem,
} from "@/registry/base/ui/sliding-list";

const disciplines: SlidingListItem[] = [
  { value: "strategy", label: "Strategy" },
  { value: "identity", label: "Identity" },
  { value: "interface", label: "Interface" },
  { value: "motion", label: "Motion" },
];

const outcomes: SlidingListItem[] = [
  { value: "strategy", label: "Direction" },
  { value: "identity", label: "Systems" },
  { value: "interface", label: "Products" },
  { value: "motion", label: "Prototypes" },
];

const stages: Record<string, string> = {
  strategy: "Discover",
  identity: "Define",
  interface: "Design",
  motion: "Deliver",
};

export default function Preview() {
  const [value, setValue] = useState(disciplines[2].value);
  const activeIndex = useMemo(
    () => disciplines.findIndex((item) => item.value === value),
    [value],
  );

  return (
    <div className="grid w-full max-w-lg grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-8">
      <SlidingList
        items={disciplines}
        value={value}
        onValueChange={setValue}
        align="left"
        aria-label="Disciplines"
      />
      <div className="flex min-w-16 flex-col items-center gap-1 text-center">
        <span className="font-mono text-[0.6875rem] text-muted-foreground">
          {String(activeIndex + 1).padStart(2, "0")} / {" "}
          {String(disciplines.length).padStart(2, "0")}
        </span>
        <span className="text-sm font-medium">{stages[value]}</span>
      </div>
      <SlidingList
        items={outcomes}
        value={value}
        onValueChange={setValue}
        align="right"
        indicator={<Check />}
        aria-label="Outcomes"
      />
    </div>
  );
}
