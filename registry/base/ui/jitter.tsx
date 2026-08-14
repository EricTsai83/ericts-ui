import * as React from "react";
import { AlarmClock } from "lucide-react";

import { cn } from "@/lib/utils";

import "./jitter.css";

export type JitterAxis = "both" | "horizontal" | "vertical";
export type JitterIconAxis = JitterAxis;

export type JitterProps = React.ComponentProps<"span"> & {
  /** The axis the content jitters on. Defaults to horizontal. */
  axis?: JitterAxis;
  /** Classes applied to the animated child wrapper. */
  targetClassName?: string;
};

export function Jitter({
  axis = "horizontal",
  className,
  children,
  targetClassName,
  ...props
}: JitterProps) {
  return (
    <span
      data-slot="jitter"
      data-axis={axis}
      className={cn("jitter inline-flex", className)}
      {...props}
    >
      <span
        data-slot="jitter-target"
        className={cn("jitter-target inline-flex", targetClassName)}
      >
        {children}
      </span>
    </span>
  );
}

export type JitterIconProps = React.ComponentProps<"div"> & {
  /** The axis the icon jitters on. Defaults to horizontal. */
  axis?: JitterAxis;
};

export function JitterIcon({
  axis = "horizontal",
  className,
  ...props
}: JitterIconProps) {
  return (
    <div
      data-slot="jitter-icon"
      data-axis={axis}
      className={cn(
        "jitter jitter-icon flex flex-col items-center text-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="jitter-icon-target"
        className="jitter-target w-full max-w-72"
      >
        <AlarmClock aria-hidden="true" className="h-auto w-full" />
      </div>
    </div>
  );
}
