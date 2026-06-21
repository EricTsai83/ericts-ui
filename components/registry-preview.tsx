"use client";

import {
  ArrowUpRight,
  Check,
  Eye,
  GripHorizontal,
  Mail,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  useEffect,
  useId,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/registry/base/ui/copy-button";
import { FeedbackPopover } from "@/registry/base/ui/feedback-popover";
import { HighlightTabs } from "@/registry/base/ui/highlight-tabs";
import { TextMorph } from "@/registry/base/ui/text-morph";
import { MultiStep } from "@/registry/base/ui/multi-step";
import {
  AdaptiveDrawer,
  type AdaptiveDrawerPanel,
} from "@/registry/base/ui/adaptive-drawer";
import { StaggeredEntrance } from "@/registry/base/ui/staggered-entrance";
import { StatusButton } from "@/registry/base/ui/status-button";
import { ExpandableModal } from "@/registry/base/ui/expandable-modal";
import {
  ContextCursor,
  ContextCursorTarget,
  type ContextCursorTargetAnimation,
} from "@/registry/base/ui/context-cursor";
import { SmoothHeight as CssOnlySmoothHeight } from "@/registry/base/css-only/smooth-height";
import { SmoothHeight as MotionSmoothHeight } from "@/registry/base/ui/smooth-height";

// Live previews for registry items, keyed by registry name. Each entry receives
// the active showcase variant so the preview can render the matching source.
// Items without an entry render nothing (the card still shows their metadata).
const previews: Record<string, (variant: string) => ReactNode> = {
  "smooth-height": (variant) => <SmoothHeightPreview variant={variant} />,
  "copy-button": () => <CopyButtonPreview />,
  "status-button": () => <StatusButtonPreview />,
  "highlight-tabs": () => <HighlightTabsPreview />,
  "text-morph": () => <TextMorphPreview />,
  "expandable-modal": () => <ExpandableModalPreview />,
  "context-cursor": () => <ContextCursorPreview />,
  "feedback-popover": () => <FeedbackPopoverPreview />,
  "multi-step": () => <MultiStepPreview />,
  "adaptive-drawer": () => <AdaptiveDrawerPreview />,
  "staggered-entrance": () => <StaggeredEntrancePreview />,
  "use-reduced-motion": () => <UseReducedMotionPreview />,
};

export function RegistryPreview({
  name,
  variant = "motion",
}: {
  name: string;
  variant?: string;
}) {
  return previews[name]?.(variant) ?? null;
}

function ReplayablePreview({
  children,
}: {
  children: (replayKey: number) => ReactNode;
}) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Replay preview"
        title="Replay preview"
        onClick={() => setReplayKey((key) => key + 1)}
        className="absolute right-3 top-3 z-10"
      >
        <RotateCcw aria-hidden />
      </Button>
      {children(replayKey)}
    </>
  );
}

function CopyButtonPreview() {
  return (
    <div className="flex items-center justify-center">
      <CopyButton
        value="outline"
        variant="outline"
        aria-label="Copy outline variant"
      />
    </div>
  );
}

function UseReducedMotionPreview() {
  const [preference, setPreference] =
    useState<ReducedMotionDemoPreference>("no-preference");
  const shouldReduceMotion = preference === "reduce";
  const [isOpen, setIsOpen] = useState(false);
  const preferenceGroupName = useId();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
          <legend className="sr-only">Reduced motion preference</legend>
          {preferenceOptions.map((option) => (
            <label
              key={option.value}
              className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground has-[input:checked]:bg-background has-[input:checked]:text-foreground has-[input:checked]:shadow-sm has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring sm:flex-none"
            >
              <input
                type="radio"
                name={preferenceGroupName}
                value={option.value}
                checked={preference === option.value}
                onChange={() => {
                  setPreference(option.value);
                  setIsOpen(false);
                }}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((value) => !value)}
          className="self-start sm:self-auto"
        >
          {isOpen ? "Close sidebar" : "Open sidebar"}
        </Button>
      </div>

      <ReducedMotionSidebarDemo
        isOpen={isOpen}
        shouldReduceMotion={shouldReduceMotion}
      />
    </div>
  );
}

function ReducedMotionSidebarDemo({
  isOpen,
  shouldReduceMotion,
}: {
  isOpen: boolean;
  shouldReduceMotion: boolean;
}) {
  const gridTemplateColumns = `${isOpen ? sidebarWidth : 0}px minmax(0, 1fr)`;

  return (
    <SidebarDemoShell>
      <motion.div
        className="grid h-48 overflow-hidden bg-background"
        style={{ gridTemplateColumns }}
        animate={{ gridTemplateColumns }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.22, ease: easeOutCubicTuple }
        }
      >
        <ReducedMotionSidebarPane
          isOpen={isOpen}
          shouldReduceMotion={shouldReduceMotion}
        />
        <MainPane />
      </motion.div>
    </SidebarDemoShell>
  );
}

function SidebarDemoShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex h-9 items-center justify-between border-b bg-muted/40 px-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-muted-foreground/35" />
          <span className="size-2 rounded-full bg-muted-foreground/25" />
          <span className="size-2 rounded-full bg-muted-foreground/20" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Product list
        </span>
      </div>
      {children}
    </div>
  );
}

function ReducedMotionSidebarPane({
  isOpen,
  shouldReduceMotion,
}: {
  isOpen: boolean;
  shouldReduceMotion: boolean;
}) {
  const opacity = isOpen ? 1 : 0;

  return (
    <motion.div
      aria-hidden={!isOpen}
      className="min-w-0 overflow-hidden border-r bg-background"
      animate={{ opacity }}
      style={{ opacity, pointerEvents: isOpen ? "auto" : "none" }}
      transition={{
        duration: shouldReduceMotion ? 0.12 : 0.18,
        ease: easeOutCubicTuple,
      }}
    >
      <SidebarContent />
    </motion.div>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full w-36 flex-col">
      <div className="border-b px-3 py-2.5">
        <p className="text-xs font-medium">Sidebar</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {sidebarItems.map((item, index) => (
          <div
            key={item}
            className={cn(
              "h-7 rounded-md",
              index === 0 ? "bg-foreground/90" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MainPane() {
  return (
    <div aria-hidden="true" className="min-w-0 p-4">
      <div className="flex h-full min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <span className="h-3 w-28 rounded-full bg-foreground/75" />
          <span className="h-2 w-52 max-w-full rounded-full bg-muted-foreground/30" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {previewRows.map((row) => (
            <span key={row} className="rounded-md border bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

const preferenceOptions: {
  value: ReducedMotionDemoPreference;
  label: string;
}[] = [
  { value: "no-preference", label: "Standard" },
  { value: "reduce", label: "Reduced" },
];
type ReducedMotionDemoPreference = "no-preference" | "reduce";

const previewRows = ["a", "b", "c", "d"];
const sidebarItems = ["overview", "activity", "settings", "members"];
const sidebarWidth = 144;
const easeOutCubicTuple = [0.215, 0.61, 0.355, 1] as const;

const highlightTabItems = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" },
];

function HighlightTabsPreview() {
  const [activeTab, setActiveTab] = useState(highlightTabItems[0].value);
  const activeLabel =
    highlightTabItems.find((tab) => tab.value === activeTab)?.label ??
    "Overview";

  return (
    <div className="flex flex-col items-center gap-4">
      <HighlightTabs
        tabs={highlightTabItems}
        value={activeTab}
        onValueChange={setActiveTab}
        aria-label="Workspace sections"
      />
      <div className="min-w-64 rounded-lg border bg-background px-4 py-3 text-center">
        <p className="text-sm font-medium">{activeLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          3 recent changes
        </p>
      </div>
    </div>
  );
}

const textMorphWords = ["Typescript", "Next.js", "React", "Convex", "Vercel"];

function TextMorphPreview() {
  const [index, setIndex] = useState(0);
  const activeWord = textMorphWords[index];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % textMorphWords.length);
    }, 2500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-lg border bg-background px-5 py-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Ship with motion</p>
        <p className="mt-1 font-mono text-4xl font-semibold tracking-normal">
          <TextMorph>{activeWord}</TextMorph>
        </p>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {textMorphWords.map((word, wordIndex) => (
          <span
            key={word}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              wordIndex === index ? "bg-foreground" : "bg-muted-foreground/25"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ExpandableModalPreview() {
  return (
    <div className="flex min-h-[28rem] w-full items-center justify-center">
      <ExpandableModal className="min-h-[28rem]" />
    </div>
  );
}

function ContextCursorPreview() {
  const largeTargetAnimation = {
    edgeFadeDistance: 56,
    opacity: { hidden: 0, visible: 1 },
    scale: { hidden: 0.96, visible: 1 },
    hideDelay: 120,
  } satisfies ContextCursorTargetAnimation;
  const compactTargetAnimation = {
    edgeFadeDistance: 22,
    opacity: { hidden: 0.08, visible: 1 },
    scale: { hidden: 0.98, visible: 1 },
    hideDelay: 80,
  } satisfies ContextCursorTargetAnimation;

  return (
    <ContextCursor className="w-full max-w-xl rounded-lg border bg-background p-3">
      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
        <ContextCursorTarget
          label="Open"
          variant="open"
          icon={<ArrowUpRight className="size-3.5" aria-hidden />}
          animation={largeTargetAnimation}
          className="rounded-md border bg-muted/40 p-4 transition-colors hover:bg-muted/70"
        >
          <div className="flex min-h-40 flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Quarterly report</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Revenue, retention, and activation summary.
                </p>
              </div>
              <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                PDF
              </span>
            </div>
            <div className="grid grid-cols-5 items-end gap-1.5" aria-hidden>
              {[42, 58, 51, 72, 64].map((height, index) => (
                <span
                  key={index}
                  className="rounded-sm bg-foreground/80"
                  style={{ height }}
                />
              ))}
            </div>
          </div>
        </ContextCursorTarget>

        <div className="flex flex-col gap-3">
          <ContextCursorTarget
            label="Drag"
            variant="drag"
            icon={<GripHorizontal className="size-3.5" aria-hidden />}
            animation={compactTargetAnimation}
            className="rounded-md border bg-background p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground"
                aria-hidden
              >
                <GripHorizontal className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Backlog column</p>
                <p className="text-xs text-muted-foreground">
                  Reorder workspace lanes
                </p>
              </div>
            </div>
          </ContextCursorTarget>

          <ContextCursorTarget
            label="Preview"
            variant="preview"
            icon={<Eye className="size-3.5" aria-hidden />}
            animation={compactTargetAnimation}
            className="rounded-md border bg-background p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md border bg-muted/40">
                <Eye className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Design brief</p>
                <p className="text-xs text-muted-foreground">
                  Show a quick file preview
                </p>
              </div>
            </div>
          </ContextCursorTarget>
        </div>
      </div>
    </ContextCursor>
  );
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For solo builders",
    perks: ["1 workspace", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For growing teams",
    perks: ["Unlimited workspaces", "Priority support", "Private registry"],
  },
  {
    id: "team",
    name: "Team",
    tagline: "For whole organizations",
    perks: [
      "Everything in Pro",
      "SSO & SCIM provisioning",
      "Audit logs",
      "Dedicated success manager",
    ],
  },
];

const seedTeammate = "ava@example.com";
const teammatePool = [
  "noah@example.com",
  "mia@example.com",
  "liam@example.com",
  "zoe@example.com",
];

const steps = [
  {
    title: "Choose your plan",
    description: "Pick a tier — the summary expands inline as you decide.",
  },
  {
    title: "Invite your team",
    description: "Add a few teammates. The dialog grows to fit every invite.",
  },
  {
    title: "You're all set",
    description: "A short final step, so the panel collapses back down.",
  },
];

type SmoothHeightComponent = ComponentType<{
  children: ReactNode;
  id?: string;
  innerClassName?: string;
  className?: string;
}>;

function SmoothHeightPreview({ variant }: { variant: string }) {
  const SmoothHeight: SmoothHeightComponent =
    variant === "css-only" ? CssOnlySmoothHeight : MotionSmoothHeight;
  const panelId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [teammates, setTeammates] = useState<string[]>([seedTeammate]);

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);
  const remainingPool = teammatePool.filter(
    (email) => !teammates.includes(email)
  );
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const canContinue = isFirstStep ? selectedPlan !== null : true;
  const currentStep = steps[stepIndex];

  return (
    <div
      role="dialog"
      aria-labelledby={`${panelId}-title`}
      aria-describedby={`${panelId}-description`}
      className="w-full max-w-md overflow-hidden rounded-lg border bg-background"
    >
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3
              id={`${panelId}-title`}
              className="truncate text-sm font-semibold"
            >
              Set up your workspace
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </p>
          </div>
          <div className="flex gap-1" aria-hidden>
            {steps.map((step, index) => (
              <span
                key={step.title}
                className={cn(
                  "h-1.5 w-5 rounded-full transition-colors",
                  index <= stepIndex ? "bg-foreground" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <SmoothHeight id={panelId} innerClassName="p-4">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold">{currentStep.title}</p>
            <p
              id={`${panelId}-description`}
              className="mt-1 text-sm leading-5 text-muted-foreground"
            >
              {currentStep.description}
            </p>
          </div>

          {stepIndex === 0 ? (
            <div className="flex flex-col gap-2">
              {plans.map((plan) => {
                const selected = plan.id === selectedPlan;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-foreground bg-muted/50"
                        : "bg-background hover:bg-muted/40"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{plan.name}</span>
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full border transition-colors",
                          selected &&
                            "border-foreground bg-foreground text-background"
                        )}
                        aria-hidden
                      >
                        {selected ? <Check className="size-3" /> : null}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {plan.tagline}
                    </span>
                  </button>
                );
              })}

              {selectedPlanData ? (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles className="size-3.5" aria-hidden />
                    Included in {selectedPlanData.name}
                  </p>
                  <ul className="mt-2 grid gap-1.5">
                    {selectedPlanData.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Check
                          className="size-3.5 shrink-0 text-foreground"
                          aria-hidden
                        />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="flex flex-col gap-2">
              {teammates.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
                >
                  <Mail
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTeammates((current) =>
                        current.length > 1
                          ? current.filter((value) => value !== email)
                          : current
                      )
                    }
                    disabled={teammates.length === 1}
                    aria-label={`Remove ${email}`}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setTeammates((current) =>
                    remainingPool[0] ? [...current, remainingPool[0]] : current
                  )
                }
                disabled={remainingPool.length === 0}
                className="flex items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
                {remainingPool.length === 0
                  ? "Everyone's invited"
                  : "Add another teammate"}
              </button>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <span
                className="flex size-10 items-center justify-center rounded-full bg-foreground text-background"
                aria-hidden
              >
                <Check className="size-5" />
              </span>
              <p className="text-sm font-medium">Workspace ready</p>
              <p className="text-xs leading-5 text-muted-foreground">
                {teammates.length} teammate{teammates.length === 1 ? "" : "s"}{" "}
                invited to your{" "}
                {selectedPlanData?.name ?? "new"} workspace.
              </p>
            </div>
          ) : null}
        </div>
      </SmoothHeight>

      <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFirstStep}
          onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
        >
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canContinue}
          onClick={() => {
            if (isLastStep) return;
            setStepIndex((value) => Math.min(value + 1, steps.length - 1));
          }}
        >
          {isLastStep ? "Confirm" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function StatusButtonPreview() {
  return (
    <div className="flex items-center justify-center">
      <StatusButton />
    </div>
  );
}

function FeedbackPopoverPreview() {
  return (
    <div className="flex min-h-72 w-full items-center justify-center">
      <FeedbackPopover />
    </div>
  );
}

function MultiStepPreview() {
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

function AdaptiveDrawerPreview() {
  return (
    <AdaptiveDrawer
      title="Adaptive drawer"
      description="Switch panels to watch the drawer resize."
      triggerLabel="Open drawer"
      panels={adaptiveDrawerPanels}
    />
  );
}

const adaptiveDrawerPanels: AdaptiveDrawerPanel[] = [
  {
    id: "compact",
    title: "Compact content",
    description: "A short panel keeps the sheet tight.",
    content: ({ setPanel }) => (
      <AdaptiveDrawerDemoActions
        activePanel="compact"
        setPanel={setPanel}
      />
    ),
  },
  {
    id: "list",
    title: "Taller content",
    description: "More rows make the same drawer grow smoothly.",
    content: ({ setPanel }) => (
      <div className="grid gap-3">
        <AdaptiveDrawerDemoActions activePanel="list" setPanel={setPanel} />
        <div className="grid gap-2">
          {["Design review", "Accessibility pass", "Motion timing", "QA notes"].map(
            (item) => (
              <div
                key={item}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                {item}
              </div>
            ),
          )}
        </div>
      </div>
    ),
  },
  {
    id: "detail",
    title: "Dense content",
    description: "The drawer adapts again when the content becomes deeper.",
    content: ({ setPanel }) => (
      <div className="grid gap-3">
        <AdaptiveDrawerDemoActions activePanel="detail" setPanel={setPanel} />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground"
            >
              Item {index + 1}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

function AdaptiveDrawerDemoActions({
  activePanel,
  setPanel,
}: {
  activePanel: string;
  setPanel?: (panel: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1">
      {adaptiveDrawerPanelOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setPanel?.(option.id)}
          className={cn(
            "h-8 rounded-md px-2 text-xs font-medium transition-colors",
            activePanel === option.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const adaptiveDrawerPanelOptions = [
  { id: "compact", label: "Small" },
  { id: "list", label: "Medium" },
  { id: "detail", label: "Large" },
];

const staggeredEntranceItems = [
  {
    label: "Deploy queued",
    value: "Production",
    meta: "2 min ago",
  },
  {
    label: "Review requested",
    value: "Checkout flow",
    meta: "12 min ago",
  },
  {
    label: "Incident resolved",
    value: "API latency",
    meta: "31 min ago",
  },
];

function StaggeredEntrancePreview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <StaggeredEntrance
          key={replayKey}
          items={staggeredEntranceItems}
          getItemKey={(item) => item.label}
          delay={90}
          duration={560}
          distance={12}
          className="flex w-full max-w-md flex-col gap-2"
          renderItem={(item) => (
            <div className="rounded-lg border bg-background px-4 py-3 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {item.value}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.meta}
                </span>
              </div>
            </div>
          )}
        />
      )}
    </ReplayablePreview>
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
