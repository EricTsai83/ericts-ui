"use client";

import { useState } from "react";

import { FloatingSelect } from "@/registry/base/ui/floating-select";

const floatingSelectOptions = [
  {
    value: "command",
    label: "Command",
  },
  {
    value: "design",
    label: "Design",
  },
  {
    value: "review",
    label: "Review",
  },
];

export default function Preview({ variant }: { variant: string }) {
  const [value, setValue] = useState(floatingSelectOptions[0].value);

  return (
    <div className="flex min-h-48 w-full items-center justify-center">
      <FloatingSelect
        placement="inline"
        label="Mode"
        value={value}
        onValueChange={setValue}
        options={floatingSelectOptions}
      />
    </div>
  );
}
