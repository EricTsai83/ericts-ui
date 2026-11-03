"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Power, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  StrokeTrace,
  StrokeTraceBorder,
  type StrokeTraceMode,
} from "@/registry/base/ui/stroke-trace";

function Demo({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action: ReactNode;
  className: string;
  children: ReactNode;
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <div
        className={cn(
          "flex h-60 items-center justify-center rounded-2xl border",
          className,
        )}
      >
        {children}
      </div>
      <figcaption className="flex items-center justify-between gap-3 px-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        {action}
      </figcaption>
    </figure>
  );
}

/** Each stroke sets its own timing, so the dot lands after the name is written. */
const timing = (duration: number, delay = 0) =>
  ({
    "--stroke-trace-duration": `${duration}ms`,
    animationDelay: `${delay}ms`,
  }) as CSSProperties;

function Signature() {
  const [replay, setReplay] = useState(0);

  return (
    <Demo
      title="Signature"
      className="bg-background text-foreground"
      action={
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Replay signature"
          onClick={() => setReplay((value) => value + 1)}
        >
          <RotateCcw aria-hidden />
        </Button>
      }
    >
      <StrokeTrace
        key={replay}
        viewBox="0 0 300 140"
        className="w-72 max-w-full stroke-3"
      >
        <g transform="skewX(-14) translate(24 0)">
          <path
            style={timing(2600)}
            d="M70 30C58 14 22 20 28 42C32 54 48 56 56 52C30 58 8 76 18 96C28 114 66 104 80 86C86 78 90 70 94 64C96 76 92 88 94 96C98 80 108 66 122 70C114 76 118 90 126 90C132 90 136 78 140 68C138 80 136 94 144 96C152 98 160 84 164 76C168 66 182 60 190 68C178 62 164 74 166 88C168 102 192 96 204 84C222 66 244 50 258 56C274 64 258 92 216 106C170 122 80 122 20 110"
          />
          <path style={timing(120, 2650)} d="M143 50l1 1" />
        </g>
      </StrokeTrace>
    </Demo>
  );
}

function NeonSign() {
  const [on, setOn] = useState(true);

  return (
    <Demo
      title="Neon sign"
      className="border-transparent bg-[radial-gradient(circle_at_50%_40%,#23263f,#12131f)] text-[#ff4fd8]"
      action={
        <Button
          size="sm"
          variant="outline"
          aria-pressed={on}
          onClick={() => setOn((value) => !value)}
        >
          <Power data-icon="inline-start" aria-hidden />
          {on ? "Turn off" : "Turn on"}
        </Button>
      }
    >
      <StrokeTrace
        active={on}
        exitDirection="forward"
        exitDuration={450}
        variant="neon"
        stagger={160}
        duration={650}
        viewBox="0 0 220 110"
        role="img"
        aria-hidden={false}
        aria-label={on ? "Open" : "Closed"}
        className="w-64 max-w-full stroke-5"
      >
        <rect
          x="6"
          y="6"
          width="208"
          height="98"
          rx="20"
          className="text-[#22d3ff]"
        />
        <ellipse cx="44" cy="55" rx="18" ry="24" />
        <path d="M76 79V31H90C102 31 106 38 106 45S102 59 90 59H76" />
        <path d="M146 31H122V79H146M122 55H140" />
        <path d="M162 79V31L190 79V31" />
      </StrokeTrace>
    </Demo>
  );
}

const modes: { value: StrokeTraceMode; label: string }[] = [
  { value: "draw", label: "Draw" },
  { value: "trace", label: "Trace" },
  { value: "loop", label: "Loop" },
  { value: "orbit", label: "Orbit" },
];

function ModesPlayground() {
  const [mode, setMode] = useState<StrokeTraceMode>("draw");
  const [active, setActive] = useState(true);
  const [track, setTrack] = useState(true);
  const [replay, setReplay] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        aria-label="Animation mode"
        value={[mode]}
        variant="outline"
        size="sm"
        spacing={0}
        onValueChange={(values) => {
          const next = modes.find((item) => item.value === values[0]);
          if (next) {
            setMode(next.value);
            setActive(true);
            setReplay((value) => value + 1);
          }
        }}
      >
        {modes.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="grid grid-cols-2 gap-3">
        {(["line", "neon"] as const).map((variant) => (
          <figure
            key={variant}
            className={cn(
              "flex min-w-0 flex-col rounded-xl border p-4",
              variant === "neon"
                ? "border-transparent bg-[#12131f] text-[#ff4fd8]"
                : "bg-background text-foreground",
            )}
          >
            <figcaption className="text-xs">
              {variant === "neon" ? "Neon glow" : "Plain line"}
            </figcaption>
            <StrokeTrace
              key={`${mode}-${replay}`}
              active={active}
              mode={mode}
              variant={variant}
              track={track}
              duration={1600}
              viewBox="0 0 200 140"
              className="my-3 h-36 w-full stroke-4"
            >
              <rect x="28" y="26" width="144" height="88" rx="24" />
              <path d="M70 70L92 88L132 50" />
            </StrokeTrace>
          </figure>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={active ? "secondary" : "outline"}
          aria-pressed={active}
          onClick={() => setActive((value) => !value)}
        >
          <Power data-icon="inline-start" aria-hidden />
          {active ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setActive(true);
            setReplay((value) => value + 1);
          }}
        >
          <RotateCcw data-icon="inline-start" aria-hidden />
          Replay
        </Button>
        <label className="ml-auto flex min-h-9 cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={track}
            onChange={(event) => setTrack(event.target.checked)}
            className="size-4 accent-current"
          />
          Show track
        </label>
      </div>
    </div>
  );
}

function BorderPlayground() {
  const id = useId();
  const [enabled, setEnabled] = useState(false);
  const [focused, setFocused] = useState(false);
  const [duration, setDuration] = useState(1400);
  const [exitDuration, setExitDuration] = useState(600);
  const active = enabled || focused;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {(["reverse", "forward"] as const).map((direction) => (
          <div
            key={direction}
            className="min-w-0 rounded-xl border bg-muted/20 p-4"
          >
            <label
              htmlFor={`${id}-${direction}`}
              className="text-xs font-medium"
            >
              {direction === "reverse"
                ? "Reverse · retract"
                : "Forward · clear ahead"}
            </label>
            <div className="relative mt-4 rounded-[12px]">
              <Input
                id={`${id}-${direction}`}
                aria-label={`${direction} border example`}
                placeholder="Project name"
                className="h-11 rounded-[12px] bg-background"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <StrokeTraceBorder
                active={active}
                radius={12}
                duration={duration}
                exitDuration={exitDuration}
                exitDirection={direction}
                className="text-primary"
              />
            </div>
          </div>
        ))}
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Border animation timing</legend>
        <label className="flex flex-col gap-2 text-xs">
          <span className="flex justify-between gap-3">
            Draw time <output className="tabular-nums">{duration} ms</output>
          </span>
          <input
            aria-label="Draw duration"
            type="range"
            min={200}
            max={2400}
            step={100}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="w-full accent-current"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs">
          <span className="flex justify-between gap-3">
            Exit time{" "}
            <output className="tabular-nums">{exitDuration} ms</output>
          </span>
          <input
            aria-label="Exit duration"
            type="range"
            min={100}
            max={1600}
            step={100}
            value={exitDuration}
            onChange={(event) => setExitDuration(Number(event.target.value))}
            className="w-full accent-current"
          />
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant={enabled ? "secondary" : "outline"}
          aria-pressed={enabled}
          onClick={() => setEnabled((value) => !value)}
        >
          <Power data-icon="inline-start" aria-hidden />
          {enabled ? "Clear borders" : "Draw borders"}
        </Button>
        <span className="text-xs text-muted-foreground" role="status">
          {active ? "Drawing enabled" : "Ready to draw"}
        </span>
      </div>
    </div>
  );
}

export default function Preview() {
  return (
    <Tabs defaultValue="modes" className="w-full max-w-3xl gap-5">
      <TabsList aria-label="Stroke Trace capabilities" className="max-w-full">
        <TabsTrigger value="modes">Four modes</TabsTrigger>
        <TabsTrigger value="borders">Interactive borders</TabsTrigger>
        <TabsTrigger value="artwork">SVG artwork</TabsTrigger>
      </TabsList>
      <TabsContent value="modes">
        <ModesPlayground />
      </TabsContent>
      <TabsContent value="borders">
        <BorderPlayground />
      </TabsContent>
      <TabsContent value="artwork">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Signature />
          <NeonSign />
        </div>
      </TabsContent>
    </Tabs>
  );
}
