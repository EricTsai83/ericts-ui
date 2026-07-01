"use client";

import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FilePlus2,
  FolderPlus,
  GripHorizontal,
  Mail,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  UserPlus,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useElementHeight } from "@/registry/base/hooks/use-element-height";
import {
  useElementSizeMap,
  type ElementSize,
} from "@/registry/base/hooks/use-element-size-map";
import { CopyButton } from "@/registry/base/ui/copy-button";
import { CheckAnimation } from "@/registry/base/ui/check-animation";
import {
  JitterAnimation,
  type JitterAnimationAxis,
} from "@/registry/base/ui/jitter-animation";
import { SqueezeAnimation } from "@/registry/base/ui/squeeze-animation";
import { FeedbackPopover } from "@/registry/base/ui/feedback-popover";
import { HighlightTabs } from "@/registry/base/ui/highlight-tabs";
import { TextMorph } from "@/registry/base/ui/text-morph";
import { MultiStep } from "@/registry/base/ui/multi-step";
import {
  AdaptiveDrawer,
  type AdaptiveDrawerPanel,
} from "@/registry/base/ui/adaptive-drawer";
import { StaggeredEntrance } from "@/registry/base/ui/staggered-entrance";
import {
  StatusBadge,
  type StatusBadgeStatus,
} from "@/registry/base/ui/status-badge";
import { StatusButton } from "@/registry/base/ui/status-button";
import { FloatingSelect } from "@/registry/base/ui/floating-select";
import { ExpandableToolbar } from "@/registry/base/ui/expandable-toolbar";
import { OTPInput, type OTPStatus } from "@/registry/base/ui/otp-input";
import {
  ExpandableTabs,
  type ExpandableTabItem,
} from "@/registry/base/ui/expandable-tabs";
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
import { SmoothHeight as CssOnlySmoothHeight } from "@/registry/base/css-only/smooth-height";
import { SmoothHeight as MotionSmoothHeight } from "@/registry/base/ui/smooth-height";

// Live previews for registry items, keyed by registry name. Each entry receives
// the active showcase variant so the preview can render the matching source.
// Items without an entry render nothing (the card still shows their metadata).
const previews: Record<string, (variant: string) => ReactNode> = {
  "smooth-height": (variant) => <SmoothHeightPreview variant={variant} />,
  "copy-button": () => <CopyButtonPreview />,
  "check-animation": () => <CheckAnimationPreview />,
  "jitter-animation": () => <JitterAnimationPreview />,
  "squeeze-animation": () => <SqueezeAnimationPreview />,
  "status-badge": () => <StatusBadgePreview />,
  "status-button": () => <StatusButtonPreview />,
  "floating-select": () => <FloatingSelectPreview />,
  "expandable-toolbar": () => <ExpandableToolbarPreview />,
  "otp-input": () => <OTPInputPreview />,
  "highlight-tabs": () => <HighlightTabsPreview />,
  "expandable-tabs": () => <ExpandableTabsPreview />,
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

function CheckAnimationPreview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div
          key={replayKey}
          className="mx-auto flex w-full max-w-xs items-center justify-center gap-8"
        >
          <CheckAnimation
            variant="square"
            size="lg"
            label="Checked"
            className="text-foreground"
          />
          <CheckAnimation
            variant="circle"
            size="lg"
            label="Verified"
            className="text-primary"
          />
        </div>
      )}
    </ReplayablePreview>
  );
}

function JitterAnimationPreview() {
  const [axis, setAxis] = useState<JitterAnimationAxis>("horizontal");

  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div
          key={`${replayKey}-${axis}`}
          className="mx-auto flex w-full max-w-xs flex-col items-center gap-10"
        >
          <div
            role="radiogroup"
            aria-label="Jitter axis"
            className="inline-flex rounded-lg border bg-muted/50 p-1"
          >
            {jitterAxisOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={axis === option.value}
                variant={axis === option.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setAxis(option.value)}
                className="min-w-20"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <JitterAnimation axis={axis} className="w-full max-w-24" />
        </div>
      )}
    </ReplayablePreview>
  );
}

const jitterAxisOptions: {
  label: string;
  value: JitterAnimationAxis;
}[] = [
  { label: "Horizontal", value: "horizontal" },
  { label: "Vertical", value: "vertical" },
  { label: "Both", value: "both" },
];

function SqueezeAnimationPreview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <SqueezeAnimation key={replayKey} className="w-full max-w-36" />
      )}
    </ReplayablePreview>
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
        <p className="mt-1 text-xs text-muted-foreground">3 recent changes</p>
      </div>
    </div>
  );
}

function ExpandableTabsPreview() {
  const [theme, setTheme] = useState("System");

  const items: ExpandableTabItem[] = [
    {
      id: "create",
      label: "Create",
      icon: <Plus className="size-4" />,
      items: [
        {
          id: "file",
          label: "New file",
          description: "Blank document",
          icon: <FilePlus2 className="size-4" />,
          shortcut: "⌘N",
        },
        {
          id: "folder",
          label: "New folder",
          icon: <FolderPlus className="size-4" />,
        },
        {
          id: "invite",
          label: "Invite teammate",
          icon: <UserPlus className="size-4" />,
        },
      ],
    },
    {
      id: "inbox",
      label: "Inbox",
      icon: <Bell className="size-4" />,
      items: [
        {
          id: "mentions",
          label: "Mentions",
          description: "2 new since yesterday",
        },
        {
          id: "assigned",
          label: "Assigned to you",
          description: "Triage queue",
        },
      ],
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Sun className="size-4" />,
      content: (
        <div className="flex w-56 flex-col gap-2 p-1">
          <p className="px-1 text-xs font-medium text-muted-foreground">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {["System", "Light", "Dark"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs font-medium transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  theme === option
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-foreground/5",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="size-4" />,
      items: [
        {
          id: "account",
          label: "Account",
          description: "Profile and security",
        },
        {
          id: "notifications",
          label: "Notifications",
          description: "Email and push",
        },
        {
          id: "shortcuts",
          label: "Keyboard shortcuts",
          shortcut: "?",
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-80 w-full flex-col items-center justify-end pb-2">
      <ExpandableTabs items={items} aria-label="Workspace quick actions" />
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
    (email) => !teammates.includes(email),
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
                  index <= stepIndex ? "bg-foreground" : "bg-muted",
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
                        : "bg-background hover:bg-muted/40",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{plan.name}</span>
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full border transition-colors",
                          selected &&
                            "border-foreground bg-foreground text-background",
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
                          : current,
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
                    remainingPool[0] ? [...current, remainingPool[0]] : current,
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
                invited to your {selectedPlanData?.name ?? "new"} workspace.
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

const demoValidOtp = "248917";
const demoExpiredOtp = "123456";
const maxOtpAttempts = 3;

function OTPInputPreview() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<OTPStatus>("idle");
  const [attemptsLeft, setAttemptsLeft] = useState(maxOtpAttempts);
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationTimer = useRef<number | null>(null);
  const isLocked = attemptsLeft === 0;

  useEffect(() => {
    return () => {
      if (verificationTimer.current) {
        window.clearTimeout(verificationTimer.current);
      }
    };
  }, []);

  const clearVerificationTimer = () => {
    if (!verificationTimer.current) return;

    window.clearTimeout(verificationTimer.current);
    verificationTimer.current = null;
  };

  const verify = (code: string) => {
    if (isVerifying || isLocked || status === "success") return;

    clearVerificationTimer();
    setIsVerifying(true);
    setStatus("idle");

    verificationTimer.current = window.setTimeout(() => {
      verificationTimer.current = null;
      setIsVerifying(false);

      if (code === demoValidOtp) {
        setStatus("success");
        return;
      }

      setValue("");
      setAttemptsLeft((current) => Math.max(current - 1, 0));
      setStatus("error");
    }, 650);
  };

  const pasteCode = (code: string) => {
    if (isVerifying || isLocked || status === "success") return;

    setValue(code);
    verify(code);
  };

  const reset = () => {
    clearVerificationTimer();
    setValue("");
    setStatus("idle");
    setAttemptsLeft(maxOtpAttempts);
    setIsVerifying(false);
  };

  const attemptsMessage =
    attemptsLeft === 1
      ? "1 attempt remaining."
      : `${attemptsLeft} attempts remaining.`;
  const errorMessage =
    attemptsLeft > 0
      ? `Code expired. ${attemptsMessage}`
      : "Code expired. No attempts remaining.";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
      <OTPInput
        label="Security code"
        value={value}
        onChange={(nextValue) => {
          setValue(nextValue);
          if (status === "error") {
            setStatus("idle");
          }
        }}
        onComplete={verify}
        status={status}
        disabled={isVerifying || isLocked}
        errorMessage={errorMessage}
      />

      <div
        role="group"
        aria-label="OTP demo actions"
        className="flex flex-wrap justify-center gap-2"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isVerifying || isLocked || status === "success"}
          onClick={() => pasteCode(demoValidOtp)}
        >
          Paste valid code
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isVerifying || isLocked || status === "success"}
          onClick={() => pasteCode(demoExpiredOtp)}
        >
          Paste expired code
        </Button>
        {status === "success" || isLocked ? (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}

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

function StatusBadgePreview() {
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

const floatingSelectOptions = [
  {
    value: "command",
    label: "Command",
  },
  {
    value: "design",
    label: "Design",
  },
  {
    value: "review",
    label: "Review",
  },
];

function FloatingSelectPreview() {
  const [value, setValue] = useState(floatingSelectOptions[0].value);

  return (
    <div className="flex min-h-48 w-full items-center justify-center">
      <FloatingSelect
        placement="inline"
        label="Mode"
        value={value}
        onValueChange={setValue}
        options={floatingSelectOptions}
      />
    </div>
  );
}

function ExpandableToolbarPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-32 w-full items-center justify-center">
      <ExpandableToolbar
        open={open}
        onOpenChange={setOpen}
        side="start"
        anchor="trigger"
        expandIcon={<ChevronsLeft aria-hidden />}
        collapseIcon={<ChevronsRight aria-hidden />}
        expandLabel="Show quick actions"
        collapseLabel="Hide quick actions"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="New file"
        >
          <FilePlus2 aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="New folder"
        >
          <FolderPlus aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Invite teammate"
        >
          <UserPlus aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Send invite"
        >
          <Mail aria-hidden />
        </Button>
      </ExpandableToolbar>
    </div>
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
