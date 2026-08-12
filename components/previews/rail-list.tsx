"use client";

import { useState } from "react";

import { RailList, type RailListItem } from "@/registry/base/ui/rail-list";

const chapters: RailListItem[] = [
  { value: "overview", label: "Overview" },
  { value: "process", label: "Process" },
  { value: "materials", label: "Materials" },
  { value: "gallery", label: "Gallery" },
];

const summaries: Record<string, string> = {
  overview: "Where the collection starts and what holds it together.",
  process: "Sketches, samples, and the sequence between them.",
  materials: "Sourcing notes and the palette they arrived in.",
  gallery: "The finished pieces, photographed in daylight.",
};

export default function Preview() {
  const [value, setValue] = useState(chapters[0].value);

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="rounded-lg border">
        <RailList
          items={chapters}
          value={value}
          onValueChange={setValue}
          aria-label="Chapters"
          className="border-b"
        />
        <p className="px-4 py-6 text-sm text-muted-foreground">
          {summaries[value]}
        </p>
      </div>
      <div className="rounded-lg border">
        <p className="px-4 py-6 text-sm text-muted-foreground">
          {summaries[value]}
        </p>
        <RailList
          items={chapters}
          value={value}
          onValueChange={setValue}
          aria-label="Chapters, indicator on top"
          edge="top"
          className="border-t"
        />
      </div>
    </div>
  );
}
