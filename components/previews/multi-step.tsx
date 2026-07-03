"use client";

import { MultiStep } from "@/registry/base/ui/multi-step";

export default function Preview() {
  return (
    <div className="w-full max-w-md">
      <MultiStep
        steps={[
          {
            id: "intro",
            content: (
              <StepContent
                title="This is step one"
                lines={[256, 192, 320, 384]}
              />
            ),
          },
          {
            id: "details",
            content: (
              <StepContent title="This is step two" lines={[256, 192, 384]} />
            ),
          },
          {
            id: "finish",
            content: (
              <StepContent
                title="This is step three"
                lines={[256, 192, 128, 224, 384]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function StepContent({ title, lines }: { title: string; lines: number[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Usually in this step we would explain why this thing exists and what
          it does. Also, we would show a button to go to the next step.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {lines.map((width, index) => (
          <div
            key={`${width}-${index}`}
            className="h-3 max-w-full rounded-full bg-muted"
            style={{ width }}
          />
        ))}
      </div>
    </div>
  );
}
