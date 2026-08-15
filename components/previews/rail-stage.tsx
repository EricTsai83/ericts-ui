"use client";

import {
  RailStage,
  type RailStageItem,
} from "@/registry/base/blocks/rail-stage";

const launchPhases = [
  {
    date: "May 08",
    title: "Identity lock",
    description: "Final type, color, and motion language",
    state: "Approved",
  },
  {
    date: "May 14",
    title: "Partner preview",
    description: "Private walkthrough for launch partners",
    state: "In progress",
  },
  {
    date: "May 21",
    title: "Public release",
    description: "Editorial story and product reveal",
    state: "Upcoming",
  },
] as const;

const channelBars = [42, 68, 51, 76, 62, 91, 73, 84] as const;

function RailLabel({ number, children }: { number: string; children: string }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="font-mono text-[10px] text-muted-foreground">
        {number}
      </span>
      <span className="truncate text-sm font-medium text-current">
        {children}
      </span>
    </span>
  );
}

function StageHeader({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Northstar / Spring 2026
        </p>
        <h3 className="truncate text-sm font-medium">{title}</h3>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
        {status}
      </div>
    </div>
  );
}

function DirectionStage() {
  return (
    <div className="grid min-h-[20rem] w-full sm:grid-cols-[minmax(0,0.9fr)_minmax(16rem,1.1fr)]">
      <div className="flex flex-col justify-between gap-6 border-b p-5 sm:border-r sm:border-b-0 sm:p-6">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Creative direction 01
          </p>
          <div className="flex flex-col gap-3">
            <h4 className="max-w-sm text-3xl leading-[0.95] font-medium tracking-[-0.045em] sm:text-4xl">
              Make room for the signal.
            </h4>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              A launch system built around generous space, decisive type, and
              one unmistakable focal point.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Deliverables</dt>
            <dd className="font-mono text-sm tabular-nums">24 / 28</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Confidence</dt>
            <dd className="font-mono text-sm tabular-nums">92%</dd>
          </div>
        </dl>
      </div>

      <div className="min-h-60 p-3 sm:p-4">
        <div className="relative flex h-full min-h-60 overflow-hidden rounded-md bg-primary p-5 text-primary-foreground">
          <div className="absolute -top-16 -right-14 size-64 rounded-full border border-primary-foreground/20" />
          <div className="absolute top-8 right-8 size-28 rounded-full border border-primary-foreground/20" />
          <div className="absolute right-[5.25rem] bottom-[5.25rem] size-3 rounded-full bg-chart-4" />
          <div className="flex w-full flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-primary-foreground/60">
              <span>Northstar systems</span>
              <span>Edition 04</span>
            </div>
            <div>
              <p className="text-[clamp(4.5rem,11vw,8rem)] leading-[0.72] font-semibold tracking-[-0.09em]">
                N<span className="text-chart-4">.</span>
              </p>
              <p className="mt-5 max-w-44 text-xs leading-5 text-primary-foreground/70">
                Quiet systems for ambitious teams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RolloutStage() {
  return (
    <div className="flex min-h-[20rem] w-full flex-col gap-3 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Release sequence
          </p>
          <h4 className="text-2xl font-medium tracking-[-0.035em]">
            Three moments, one story.
          </h4>
        </div>
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          68% complete
        </p>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[68%] rounded-full bg-primary" />
      </div>

      <ol className="grid flex-1 gap-1.5">
        {launchPhases.map((phase, index) => (
          <li
            key={phase.title}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-md border px-3 py-2 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {phase.date}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-medium">{phase.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {phase.description}
              </p>
            </div>
            <div className="col-start-2 flex items-center gap-2 text-xs text-muted-foreground sm:col-start-auto">
              <span
                aria-hidden="true"
                className={
                  index === 0
                    ? "size-1.5 rounded-full bg-chart-2"
                    : index === 1
                      ? "size-1.5 rounded-full bg-chart-4"
                      : "size-1.5 rounded-full bg-muted-foreground/40"
                }
              />
              {phase.state}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SignalsStage() {
  return (
    <div className="grid min-h-[20rem] w-full sm:grid-cols-[minmax(0,0.8fr)_minmax(18rem,1.2fr)]">
      <div className="flex flex-col justify-between gap-6 border-b p-5 sm:border-r sm:border-b-0 sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Audience signal
          </p>
          <p className="text-5xl font-medium tracking-[-0.06em] tabular-nums">
            38.4k
          </p>
          <p className="text-sm text-muted-foreground">
            Qualified visits this week
          </p>
        </div>

        <dl className="flex flex-col gap-3 border-t pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Save rate</dt>
            <dd className="font-mono text-sm tabular-nums">18.6%</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">Return visits</dt>
            <dd className="font-mono text-sm tabular-nums">12.9k</dd>
          </div>
        </dl>
      </div>

      <div className="flex min-h-60 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Weekly momentum</p>
            <p className="text-xs text-muted-foreground">Last 8 days</p>
          </div>
          <p className="font-mono text-xs text-chart-2">+24.8%</p>
        </div>

        <div className="flex flex-1 items-end gap-2 border-b px-1 pt-8">
          {channelBars.map((height, index) => (
            <div
              key={`${height}-${index}`}
              className="flex h-full flex-1 items-end"
            >
              <div
                className="w-full rounded-t-sm bg-primary/15 transition-colors duration-150 ease-out hover:bg-primary/30 motion-reduce:transition-none"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["Direct", "46%"],
            ["Editorial", "31%"],
            ["Partners", "23%"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 rounded-md bg-muted/60 p-3">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <span className="font-mono text-sm tabular-nums">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const items: RailStageItem[] = [
  {
    id: "direction",
    label: <RailLabel number="01">Direction</RailLabel>,
    header: <StageHeader title="Creative direction" status="Approved" />,
    content: <DirectionStage />,
  },
  {
    id: "rollout",
    label: <RailLabel number="02">Rollout</RailLabel>,
    header: <StageHeader title="Launch rollout" status="On track" />,
    content: <RolloutStage />,
  },
  {
    id: "signals",
    label: <RailLabel number="03">Signals</RailLabel>,
    header: <StageHeader title="Early signals" status="Live" />,
    content: <SignalsStage />,
  },
];

export default function Preview() {
  return (
    <RailStage
      items={items}
      railLabel="Northstar launch sections"
      railSide="start"
      railWidth={184}
      className="w-full max-w-4xl shadow-sm"
      headerClassName="flex h-14 items-center bg-background px-5 py-0 sm:px-6"
      railClassName="bg-muted/20"
      stageClassName="min-h-[20rem] items-stretch bg-background p-0 sm:p-0"
      tabClassName="h-14 min-w-40 px-4 font-sans text-sm normal-case tracking-normal sm:min-w-0"
    />
  );
}
