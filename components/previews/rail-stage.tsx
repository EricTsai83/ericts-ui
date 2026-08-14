"use client";

import { RailStage, type RailStageItem } from "@/registry/base/ui/rail-stage";

const specimens = [
  {
    id: "summary",
    label: "Summary",
    title: "Summary",
    caption: "Totals for the current period",
    rows: [
      ["Sessions", "12,480"],
      ["Signups", "318"],
      ["Conversion", "2.5%"],
    ],
  },
  {
    id: "activity",
    label: "Activity",
    title: "Activity",
    caption: "Most recent events first",
    rows: [
      ["Deploy", "4m ago"],
      ["Invite sent", "1h ago"],
      ["Plan changed", "Yesterday"],
    ],
  },
  {
    id: "limits",
    label: "Limits",
    title: "Limits",
    caption: "Usage against the current plan",
    rows: [
      ["Seats", "8 / 10"],
      ["Projects", "23 / 50"],
      ["Storage", "4.1 / 10 GB"],
    ],
  },
];

const items: RailStageItem[] = specimens.map((specimen) => ({
  id: specimen.id,
  label: specimen.label,
  header: (
    <div className="flex min-w-0 flex-col gap-0.5">
      <h3 className="truncate text-base font-medium">{specimen.title}</h3>
      <p className="truncate text-sm leading-5 text-muted-foreground">
        {specimen.caption}
      </p>
    </div>
  ),
  content: (
    <dl className="w-full max-w-xs divide-y">
      {specimen.rows.map(([term, value]) => (
        <div key={term} className="flex items-baseline justify-between py-2">
          <dt className="text-sm text-muted-foreground">{term}</dt>
          <dd className="font-mono text-sm tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  ),
}));

export default function Preview() {
  return (
    <RailStage
      items={items}
      railLabel="Report sections"
      railWidth={168}
      className="w-full max-w-2xl"
      stageClassName="min-h-48 bg-background"
    />
  );
}
