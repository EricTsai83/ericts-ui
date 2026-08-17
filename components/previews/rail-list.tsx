"use client";

import { useState } from "react";

import { RailList, type RailListItem } from "@/registry/base/ui/rail-list";

const chapters: RailListItem[] = [
  { value: "overview", label: "Overview" },
  { value: "process", label: "Process" },
  { value: "materials", label: "Materials" },
  { value: "gallery", label: "Gallery" },
];

// Kept within a few characters of each other so every summary wraps to the same
// number of lines at phone widths — an uneven set moves the rail on selection.
const summaries: Record<string, string> = {
  overview: "Where the collection starts and what holds it together.",
  process: "Sketches, samples, and the sequence that connects them.",
  materials: "Sourcing notes and the palette each material arrived in.",
  gallery: "The finished pieces, each photographed in daylight.",
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
