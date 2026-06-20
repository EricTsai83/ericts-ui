"use client";

import { Check, Mail, Plus, Sparkles, X } from "lucide-react";
import { useId, useState, type ComponentType, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/registry/base/ui/copy-button";
import { Feedback } from "@/registry/base/ui/feedback";
import { HighlightTabs } from "@/registry/base/ui/highlight-tabs";
import { MultiStep } from "@/registry/base/ui/multi-step";
import { StatusButton } from "@/registry/base/ui/status-button";
import { AnimatedModal } from "@/registry/base/ui/animated-modal";
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
  "animated-modal": () => <AnimatedModalPreview />,
  feedback: () => <FeedbackPreview />,
  "multi-step": () => <MultiStepPreview />,
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

function AnimatedModalPreview() {
  return (
    <div className="flex min-h-[28rem] w-full items-center justify-center">
      <AnimatedModal className="min-h-[28rem]" />
    </div>
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

function FeedbackPreview() {
  return (
    <div className="flex min-h-72 w-full items-center justify-center">
      <Feedback />
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
