"use client";

import { BookOpen, MessageSquareText, Rows3 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  MorphingSegmentedControl,
  type MorphingSegmentedControlItem,
} from "@/registry/base/ui/morphing-segmented-control";

const items: MorphingSegmentedControlItem[] = [
  {
    value: "discuss",
    label: "Discuss",
    icon: <MessageSquareText className="size-4" />,
  },
  {
    value: "library",
    label: "Library",
    icon: <BookOpen className="size-4" />,
  },
  {
    value: "queue",
    label: "Queue",
    icon: <Rows3 className="size-4" />,
  },
];

const descriptions: Record<string, string> = {
  discuss: "Live questions and follow-up threads.",
  library: "Saved references and source material.",
  queue: "Open review items waiting for action.",
};

export default function Preview() {
  const [value, setValue] = useState(items[0].value);
  const activeItem = useMemo(
    () => items.find((item) => item.value === value) ?? items[0],
    [value],
  );

  return (
    <div className="flex w-full max-w-72 flex-col items-center gap-4">
      <MorphingSegmentedControl
        items={items}
        value={value}
        onValueChange={setValue}
        aria-label="Workspace mode"
      />
      <div className="w-full rounded-lg border bg-background px-4 py-3 text-center">
        <p className="text-sm font-medium">{activeItem.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {descriptions[activeItem.value]}
        </p>
      </div>
    </div>
  );
}
