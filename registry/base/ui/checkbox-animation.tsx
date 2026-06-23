import * as React from "react";

import { cn } from "@/lib/utils";

import "./checkbox-animation.css";

export type CheckboxAnimationProps = React.ComponentPropsWithoutRef<"div">;

export function CheckboxAnimation({
  className,
  ...props
}: CheckboxAnimationProps) {
  return (
    <div
      data-slot="checkbox-animation"
      className={cn(
        "checkbox-animation flex flex-col items-center text-foreground",
        className,
      )}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="h-auto w-full max-w-80"
      >
        <path
          className="checkbox-animation-square"
          d="M 50,30 L 70,30 L 70,70 L 30,70 L 30,30 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          pathLength="100"
          strokeDasharray="100 100"
          strokeDashoffset="100"
        />
        <path
          className="checkbox-animation-checkmark"
          d="M 40,51 L 48,60 L 61,41"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          pathLength="100"
          strokeDasharray="100 100"
          strokeDashoffset="100"
        />
      </svg>
    </div>
  );
}
