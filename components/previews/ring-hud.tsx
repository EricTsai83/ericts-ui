"use client";

import { ArrowUp, Check, Flame, HardDrive, Headphones, Zap } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { RingHud, type RingHudControls, type RingHudPhase } from "@/registry/base/ui/ring-hud";

type Scenario = "charging" | "upload" | "goal" | "storage" | "connected";

type ScenarioConfig = {
  name: string;
  value: number;
  icon: ReactNode;
  label: (value: number) => string;
  ringClassName: string;
};

const scenarios: Record<Exclude<Scenario, "upload">, ScenarioConfig> = {
  charging: {
    name: "Charging",
    value: 54,
    icon: <Zap strokeWidth={1} fill="currentColor" />,
    label: (value) => `Charged ${value}%`,
    ringClassName: "text-[oklch(0.82_0.18_143)]",
  },
  goal: {
    name: "Daily goal",
    value: 82,
    icon: <Flame strokeWidth={1.75} />,
    label: (value) => `Daily goal ${value}%`,
    ringClassName: "text-orange-500",
  },
  storage: {
    name: "Storage",
    value: 92,
    icon: <HardDrive strokeWidth={1.75} />,
    label: (value) => `${value}% of storage used`,
    ringClassName: "text-red-500",
  },
  connected: {
    name: "Connected",
    value: 100,
    icon: <Headphones strokeWidth={1.75} />,
    label: () => "AirPods connected",
    ringClassName: "text-sky-500",
  },
};

const order: Scenario[] = ["charging", "upload", "goal", "storage", "connected"];

export default function Preview() {
  const [scenario, setScenario] = useState<Scenario>("charging");
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<RingHudPhase>("enter");
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const controlsRef = useRef<RingHudControls>(null);
  const pausedRef = useRef(false);

  // Simulated upload: the HUD holds open while progress streams in, and
  // the finite holdDuration it switches to once complete starts its exit.
  useEffect(() => {
    if (scenario !== "upload") return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setProgress((current) => Math.min(100, current + 6 + Math.round(Math.random() * 10)));
    }, 280);
    return () => window.clearInterval(id);
  }, [scenario, run]);

  const start = (next: Scenario) => {
    setScenario(next);
    setRun((current) => current + 1);
    setPhase("enter");
    setProgress(0);
    setPaused(false);
    pausedRef.current = false;
  };

  const togglePaused = () => {
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
    if (next) controlsRef.current?.pause();
    else controlsRef.current?.resume();
  };

  const uploaded = progress >= 100;
  const config: ScenarioConfig =
    scenario === "upload"
      ? {
          name: "Upload",
          value: progress,
          icon: uploaded ? <Check strokeWidth={2.25} /> : <ArrowUp strokeWidth={2.25} />,
          label: (value) => (uploaded ? "Upload complete" : `Uploading ${value}%`),
          ringClassName: "text-violet-500",
        }
      : scenarios[scenario];

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      <div className="flex flex-wrap justify-center gap-1.5">
        {order.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={item === scenario ? "default" : "outline"}
            onClick={() => start(item)}
          >
            {item === "upload" ? "Upload" : scenarios[item].name}
          </Button>
        ))}
      </div>

      <div className="grid h-72 w-60 place-items-center">
        <RingHud
          key={`${scenario}-${run}`}
          controlsRef={controlsRef}
          value={config.value}
          icon={config.icon}
          label={config.label}
          ringClassName={config.ringClassName}
          holdDuration={scenario === "upload" && !uploaded ? Infinity : undefined}
          onPhaseChange={setPhase}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" onClick={() => start(scenario)}>
          Replay
        </Button>
        <Button variant="outline" size="sm" disabled={phase === "done"} onClick={togglePaused}>
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={phase === "exit" || phase === "done"}
          onClick={() => controlsRef.current?.dismiss()}
        >
          Dismiss
        </Button>
        <span className="w-14 text-xs text-muted-foreground tabular-nums">{phase}</span>
      </div>
    </div>
  );
}
