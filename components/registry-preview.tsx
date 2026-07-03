"use client";

import {
  ArrowUpRight,
  Eye,
  GripHorizontal,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReplayablePreview } from "@/components/previews/replayable-preview";
import SmoothHeightPreview from "@/components/previews/smooth-height";
import CopyButtonPreview from "@/components/previews/copy-button";
import CheckAnimationPreview from "@/components/previews/check-animation";
import JitterAnimationPreview from "@/components/previews/jitter-animation";
import SqueezeAnimationPreview from "@/components/previews/squeeze-animation";
import StatusBadgePreview from "@/components/previews/status-badge";
import StatusButtonPreview from "@/components/previews/status-button";
import FloatingSelectPreview from "@/components/previews/floating-select";
import ExpandableToolbarPreview from "@/components/previews/expandable-toolbar";
import OTPInputPreview from "@/components/previews/otp-input";
import HighlightTabsPreview from "@/components/previews/highlight-tabs";
import ExpandableTabsPreview from "@/components/previews/expandable-tabs";
import ExpandingButtonPreview from "@/components/previews/expanding-button";
import { useElementHeight } from "@/registry/base/hooks/use-element-height";
import {
  useElementSizeMap,
  type ElementSize,
} from "@/registry/base/hooks/use-element-size-map";
import { useScrollAnchor } from "@/registry/base/hooks/use-scroll-anchor";
import { FeedbackPopover } from "@/registry/base/ui/feedback-popover";
import { TextMorph } from "@/registry/base/ui/text-morph";
import { MultiStep } from "@/registry/base/ui/multi-step";
import {
  AdaptiveDrawer,
  type AdaptiveDrawerPanel,
} from "@/registry/base/ui/adaptive-drawer";
import { StaggeredEntrance } from "@/registry/base/ui/staggered-entrance";
import { ExpandableModal } from "@/registry/base/ui/expandable-modal";
import {
  ContextCursor,
  ContextCursorTarget,
  type ContextCursorTargetAnimation,
} from "@/registry/base/ui/context-cursor";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/registry/base/ui/navigation-menu";

// Live previews for registry items, keyed by registry name. Each entry receives
// the active showcase variant so the preview can render the matching source.
// Items without an entry render nothing (the card still shows their metadata).
const previews: Record<string, (variant: string) => ReactNode> = {
  "smooth-height": (variant) => <SmoothHeightPreview variant={variant} />,
  "copy-button": (variant) => <CopyButtonPreview variant={variant} />,
  "check-animation": (variant) => <CheckAnimationPreview variant={variant} />,
  "jitter-animation": (variant) => (
    <JitterAnimationPreview variant={variant} />
  ),
  "squeeze-animation": (variant) => (
    <SqueezeAnimationPreview variant={variant} />
  ),
  "status-badge": (variant) => <StatusBadgePreview variant={variant} />,
  "status-button": (variant) => <StatusButtonPreview variant={variant} />,
  "floating-select": (variant) => <FloatingSelectPreview variant={variant} />,
  "expandable-toolbar": (variant) => (
    <ExpandableToolbarPreview variant={variant} />
  ),
  "otp-input": (variant) => <OTPInputPreview variant={variant} />,
  "highlight-tabs": (variant) => <HighlightTabsPreview variant={variant} />,
  "expandable-tabs": (variant) => (
    <ExpandableTabsPreview variant={variant} />
  ),
  "expanding-button": (variant) => (
    <ExpandingButtonPreview variant={variant} />
  ),
  "navigation-menu": () => <NavigationMenuPreview />,
  "text-morph": () => <TextMorphPreview />,
  "expandable-modal": () => <ExpandableModalPreview />,
  "context-cursor": () => <ContextCursorPreview />,
  "feedback-popover": () => <FeedbackPopoverPreview />,
  "multi-step": () => <MultiStepPreview />,
  "adaptive-drawer": () => <AdaptiveDrawerPreview />,
  "staggered-entrance": () => <StaggeredEntrancePreview />,
  "use-reduced-motion": () => <UseReducedMotionPreview />,
  "use-element-height": () => <UseElementHeightPreview />,
  "use-element-size-map": () => <UseElementSizeMapPreview />,
  "use-scroll-anchor": () => <UseScrollAnchorPreview />,
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

export function hasRegistryPreview(name: string) {
  return name in previews;
}

export function getRegistryPreviewNames() {
  return Object.keys(previews);
}

export { PreviewCornerSlotProvider } from "@/components/previews/replayable-preview";

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

function UseElementHeightPreview() {
  const [activeId, setActiveId] = useState<string>(elementHeightPanels[0].id);
  const [measureRef, height] = useElementHeight<HTMLDivElement>();
  const shouldReduceMotion = useReducedMotion();
  const activePanel =
    elementHeightPanels.find((panel) => panel.id === activeId) ??
    elementHeightPanels[0];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <DemoSegmentedControl
        label="Panel height"
        items={elementHeightPanels}
        value={activeId}
        onValueChange={setActiveId}
      />

      <motion.div
        animate={{ height: height ?? "auto" }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.24, ease: easeOutCubicTuple }
        }
        className="overflow-hidden rounded-lg border bg-background"
      >
        <div ref={measureRef} className="p-4">
          <motion.div
            key={activePanel.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.18,
              ease: easeOutCubicTuple,
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activePanel.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activePanel.meta}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {activePanel.badge}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {activePanel.rows.map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-2 rounded-md bg-muted/45 px-2.5 py-2 text-sm text-foreground"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 truncate">{row}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function UseElementSizeMapPreview() {
  const [activeId, setActiveId] = useState<string>(elementSizeMapPanels[0].id);
  const { setMeasureRef, sizes } = useElementSizeMap<HTMLDivElement>();
  const shouldReduceMotion = useReducedMotion();
  const activePanel =
    elementSizeMapPanels.find((panel) => panel.id === activeId) ??
    elementSizeMapPanels[0];
  const activeSize = sizes[activePanel.id] ?? elementSizeMapFallbackSize;

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-4">
      <DemoSegmentedControl
        label="Measured panel"
        items={elementSizeMapPanels}
        value={activeId}
        onValueChange={setActiveId}
      />

      <div
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0"
      >
        {elementSizeMapPanels.map((panel) => (
          <div key={panel.id} ref={setMeasureRef(panel.id)} className="w-max">
            <ElementSizeMapPanel panel={panel} />
          </div>
        ))}
      </div>

      <motion.div
        animate={{ width: activeSize.width, height: activeSize.height }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.24, ease: easeOutCubicTuple }
        }
        className="relative overflow-hidden rounded-lg border bg-background shadow-sm"
      >
        <motion.div
          key={activePanel.id}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, scale: 0.98, filter: "blur(4px)" }
          }
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.18,
            ease: easeOutCubicTuple,
          }}
          className="absolute left-0 top-0"
          style={{ transformOrigin: "top left" }}
        >
          <ElementSizeMapPanel panel={activePanel} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function DemoSegmentedControl<T extends { id: string; label: string }>({
  label,
  items,
  value,
  onValueChange,
}: {
  label: string;
  items: readonly T[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap justify-center gap-1 rounded-lg border bg-muted/50 p-1"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={item.id === value}
          onClick={() => onValueChange(item.id)}
          className={cn(
            "h-8 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
            "hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            item.id === value && "bg-background text-foreground shadow-sm",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ElementSizeMapPanel({ panel }: { panel: ElementSizeMapPanelData }) {
  return (
    <div className={cn("flex flex-col gap-3 p-4", panel.className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{panel.title}</p>
          <p className="text-xs text-muted-foreground">{panel.meta}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {panel.badge}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {panel.rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-2.5 py-2 text-sm"
          >
            <span className="min-w-0 truncate text-foreground">
              {row.label}
            </span>
            <span className="shrink-0 font-medium text-muted-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {panel.footer ? (
        <p className="rounded-md border bg-background px-2.5 py-2 text-xs leading-5 text-muted-foreground">
          {panel.footer}
        </p>
      ) : null}
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

const elementHeightPanels = [
  {
    id: "brief",
    label: "Brief",
    title: "Daily pulse",
    meta: "3 pinned updates",
    badge: "Short",
    rows: [
      "Design review at 10:00",
      "Billing copy is ready",
      "Deploy note sent",
    ],
  },
  {
    id: "queue",
    label: "Queue",
    title: "Review queue",
    meta: "5 changes waiting",
    badge: "Medium",
    rows: [
      "Navigation labels",
      "Checkout empty state",
      "Webhook retry copy",
      "Team invite flow",
      "Audit log filters",
    ],
  },
  {
    id: "handoff",
    label: "Handoff",
    title: "Release handoff",
    meta: "Cross-functional checklist",
    badge: "Tall",
    rows: [
      "QA pass confirmed",
      "Migration notes attached",
      "Support macros updated",
      "Launch dashboard pinned",
      "Rollback owner assigned",
      "Metrics review scheduled",
    ],
  },
] as const;

type ElementSizeMapPanelData = {
  id: string;
  label: string;
  title: string;
  meta: string;
  badge: string;
  className: string;
  rows: { label: string; value: string }[];
  footer?: string;
};

const elementSizeMapPanels: ElementSizeMapPanelData[] = [
  {
    id: "compact",
    label: "Compact",
    title: "Inbox",
    meta: "Focused triage",
    badge: "3",
    className: "w-56",
    rows: [
      { label: "Mentions", value: "12" },
      { label: "Assigned", value: "4" },
      { label: "Snoozed", value: "2" },
    ],
  },
  {
    id: "wide",
    label: "Wide",
    title: "Campaign health",
    meta: "Live segments",
    badge: "Live",
    className: "w-72",
    rows: [
      { label: "Activation", value: "68%" },
      { label: "Retention", value: "41%" },
      { label: "Expansion", value: "19%" },
    ],
    footer:
      "North America is pacing ahead of forecast after the pricing update.",
  },
  {
    id: "tall",
    label: "Tall",
    title: "Launch plan",
    meta: "Final sequence",
    badge: "6",
    className: "w-64",
    rows: [
      { label: "Freeze scope", value: "Done" },
      { label: "Notify beta", value: "9:00" },
      { label: "Publish docs", value: "10:30" },
      { label: "Enable flag", value: "11:00" },
      { label: "Read metrics", value: "14:00" },
    ],
    footer: "Owners are assigned for each launch window and rollback review.",
  },
];

const elementSizeMapFallbackSize = {
  width: 224,
  height: 168,
} satisfies ElementSize;

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

const scrollAnchorSections = [
  "Overview",
  "Installation",
  "Quick start",
  "Theming",
  "Design tokens",
  "Layout",
  "Navigation",
  "Overlays",
  "Forms",
  "Feedback",
  "Motion",
  "Data display",
  "Accessibility",
  "Keyboard",
  "Performance",
  "Testing",
  "Deployment",
  "Migration",
  "Changelog",
].map((label, index) => ({
  id: `section-${index}`,
  label,
  meta: `§${index + 1}`,
}));

function UseScrollAnchorPreview() {
  const [activeId, setActiveId] = useState(scrollAnchorSections[0].id);
  const { containerRef } = useScrollAnchor<HTMLDivElement>({
    activeKey: activeId,
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">
        Pick a section — the selection glides to the upper third of the list.
      </p>
      <div
        ref={containerRef}
        className="no-scrollbar h-64 overflow-y-auto rounded-lg border bg-background p-1.5"
      >
        <div className="flex flex-col gap-1">
          {scrollAnchorSections.map((section) => {
            const active = section.id === activeId;

            return (
              <button
                key={section.id}
                type="button"
                data-scroll-anchor={active ? "" : undefined}
                aria-pressed={active}
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span className="truncate">{section.label}</span>
                <span className="text-xs opacity-70">{section.meta}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const componentItems = [
  {
    title: "Interactive primitives",
    description: "Menus, dialogs, drawers, tabs, and form controls.",
  },
  {
    title: "Motion patterns",
    description: "Feedback, layout changes, and state transitions.",
  },
  {
    title: "Client hooks",
    description: "Small utilities for preferences and browser behavior.",
  },
];

const resourceItems = [
  {
    title: "Installation",
    description: "Add registry items with your package runner.",
  },
  {
    title: "API reference",
    description: "Review props, slots, and composition details.",
  },
  {
    title: "Examples",
    description: "Preview behavior before copying code.",
  },
  {
    title: "Changelog",
    description: "Track updates before pulling a component again.",
  },
  {
    title: "Design notes",
    description: "Understand interaction and accessibility decisions.",
  },
  {
    title: "Support",
    description: "Find setup, theming, and troubleshooting docs.",
  },
];

function NavigationMenuPreview() {
  return (
    <div className="flex min-h-96 w-full items-start justify-center pt-4">
      <NavigationMenu>
        <NavigationMenuList className="rounded-lg border bg-background p-1 shadow-sm">
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[min(31rem,calc(100vw-2rem))] gap-2 p-3 sm:grid-cols-[0.8fr_1fr]">
                <li className="sm:row-span-3">
                  <NavigationMenuLink
                    href="#"
                    className="flex h-full min-h-44 flex-col justify-end rounded-md bg-primary p-5 text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary/90"
                  >
                    <span
                      className="mb-auto flex size-9 items-center justify-center rounded-md bg-primary-foreground/10"
                      aria-hidden="true"
                    >
                      <Sparkles className="size-4" />
                    </span>
                    <div className="mt-6 text-base font-semibold">
                      Registry components
                    </div>
                    <p className="mt-1 text-sm leading-5 text-primary-foreground/75">
                      Install copy-ready UI primitives through the shadcn CLI.
                    </p>
                  </NavigationMenuLink>
                </li>

                {componentItems.map((item) => (
                  <NavigationMenuPreviewItem
                    key={item.title}
                    title={item.title}
                  >
                    {item.description}
                  </NavigationMenuPreviewItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="resources">
            <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[min(35rem,calc(100vw-2rem))] gap-2 p-3 sm:grid-cols-2">
                {resourceItems.map((item) => (
                  <NavigationMenuPreviewItem
                    key={item.title}
                    title={item.title}
                  >
                    {item.description}
                  </NavigationMenuPreviewItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              href="#"
              className={cn(navigationMenuTriggerStyle(), "p-0 px-3 py-0")}
            >
              Docs
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

function NavigationMenuPreviewItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <li>
      <NavigationMenuLink href="#" className="p-3">
        <div className="text-sm font-medium leading-5">{title}</div>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {children}
        </p>
      </NavigationMenuLink>
    </li>
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
              wordIndex === index ? "bg-foreground" : "bg-muted-foreground/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ExpandableModalPreview() {
  return (
    <div className="flex min-h-112 w-full items-center justify-center">
      <ExpandableModal className="min-h-112" />
    </div>
  );
}

function ContextCursorPreview() {
  const largeTargetAnimation = {
    edgeFadeDistance: 40,
    opacity: { hidden: 0, visible: 1 },
    scale: { hidden: 0.4, visible: 1 },
    hideDelay: 150,
  } satisfies ContextCursorTargetAnimation;
  const compactTargetAnimation = {
    edgeFadeDistance: 26,
    opacity: { hidden: 0, visible: 1 },
    scale: { hidden: 0.4, visible: 1 },
    hideDelay: 140,
  } satisfies ContextCursorTargetAnimation;

  return (
    <ContextCursor className="w-full max-w-xl rounded-lg border bg-background p-3">
      <div className="grid gap-3 sm:grid-cols-2">
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
            className="flex-1 rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-full items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-md bg-muted text-muted-foreground"
                aria-hidden
              >
                <GripHorizontal className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-medium">Backlog column</p>
                <p className="text-sm text-muted-foreground">
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
            className="flex-1 rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-full items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-md border bg-muted/40">
                <Eye className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-medium">Design brief</p>
                <p className="text-sm text-muted-foreground">
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

function FeedbackPopoverPreview() {
  return (
    <div className="flex min-h-72 w-full items-center justify-center">
      <FeedbackPopover className="w-full justify-center [--feedback-popover-width:min(22rem,100%)]" />
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
      <AdaptiveDrawerDemoActions activePanel="compact" setPanel={setPanel} />
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
          {[
            "Design review",
            "Accessibility pass",
            "Motion timing",
            "QA notes",
          ].map((item) => (
            <div
              key={item}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {item}
            </div>
          ))}
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
