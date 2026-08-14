"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Countdown,
  CountUp,
  type TimerHandle,
} from "@/registry/base/ui/timer";

const COUNTDOWN_DURATION = 11 * 60 * 60 + 42 * 60 + 17;

export default function Preview() {
  const countdownRef = useRef<TimerHandle>(null);

  return (
    <div className="flex w-full max-w-lg flex-col border-y">
      <div className="flex flex-col gap-4 border-b py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Countdown</p>
          <p className="text-sm text-muted-foreground">Filled digit slots</p>
        </div>
        <Countdown
          controlsRef={countdownRef}
          duration={COUNTDOWN_DURATION}
          className="gap-2 text-2xl font-medium"
          valueClassName="gap-1"
          digitClassName="w-7 rounded-md bg-muted py-1.5"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => countdownRef.current?.pause()}
        >
          Pause
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => countdownRef.current?.resume()}
        >
          Resume
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => countdownRef.current?.reset()}
        >
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => countdownRef.current?.restart()}
        >
          Restart
        </Button>
      </div>

      <div className="flex flex-col gap-4 border-b py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Count up</p>
          <p className="text-sm text-muted-foreground">
            Animated outlined digits
          </p>
        </div>
        <CountUp
          startAt={42 * 60 + 17}
          className="gap-2 text-xl font-medium"
          valueClassName="gap-1"
          digitClassName="w-7 rounded-md border py-1.5"
        />
      </div>

      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Compact</p>
          <p className="text-sm text-muted-foreground">Static minimal timer</p>
        </div>
        <Countdown
          duration={5 * 60}
          animated={false}
          className="gap-1.5 text-sm font-medium"
          separatorClassName="text-xs"
        />
      </div>
    </div>
  );
}
