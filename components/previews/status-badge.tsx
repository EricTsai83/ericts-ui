"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  StatusBadge,
  type StatusBadgeStatus,
} from "@/registry/base/ui/status-badge";

const statusBadgeFlow: {
  label: string;
  detail: string;
  status: StatusBadgeStatus;
}[] = [
  {
    label: "Draft",
    detail: "Release notes are being prepared.",
    status: "neutral",
  },
  {
    label: "Queued",
    detail: "The release is waiting for a deploy window.",
    status: "info",
  },
  {
    label: "Reviewing",
    detail: "Changes are waiting for approval.",
    status: "warning",
  },
  {
    label: "Deploying",
    detail: "The release is rolling out.",
    status: "loading",
  },
  {
    label: "Failed",
    detail: "A health check failed during rollout.",
    status: "danger",
  },
  {
    label: "Published",
    detail: "The release is live in production.",
    status: "success",
  },
];

export default function Preview() {
  const [statusIndex, setStatusIndex] = useState(0);
  const activeStep = statusBadgeFlow[statusIndex];

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex min-h-32 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-lg border bg-background px-5 py-5 shadow-sm">
        <StatusBadge status={activeStep.status}>{activeStep.label}</StatusBadge>
        <div className="flex min-h-5 items-center justify-center">
          <p className="text-sm text-muted-foreground">{activeStep.detail}</p>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {statusBadgeFlow.map((step, index) => (
            <span
              key={step.label}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                index <= statusIndex ? "bg-primary" : "bg-muted-foreground/25",
              )}
            />
          ))}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setStatusIndex((index) => (index + 1) % statusBadgeFlow.length)
        }
      >
        Advance release
      </Button>
    </div>
  );
}
