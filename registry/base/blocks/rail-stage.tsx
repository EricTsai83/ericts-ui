"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

export type RailStageItem = {
  /** Stable identity; also the tab's value. */
  id: string;
  /** Rail entry. A node rather than a string so entries can carry an icon. */
  label: React.ReactNode;
  /** What the stage shows while this entry is selected. */
  content: React.ReactNode;
  /**
   * Optional strip pinned above the stage — a title, badges, a link out. Kept
   * per item so it can describe whatever is currently on stage.
   */
  header?: React.ReactNode;
};

export type RailStageProps = Omit<
  React.ComponentProps<"div">,
  "children" | "defaultValue" | "onChange"
> & {
  items: RailStageItem[];
  /** Controlled selection. Pair with `onValueChange`. */
  value?: string;
  /** Initial selection when uncontrolled. Defaults to the first item. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Which side the rail sits on once there is room for it. Defaults to "end". */
  railSide?: "start" | "end";
  /** Accessible name for the rail, which is a tab list. */
  railLabel?: string;
  /** Rail width once it sits beside the stage. Defaults to 220px. */
  railWidth?: number | string;
  /**
   * Arrow-key axis. Defaults to "vertical" to match the rail's wide layout; set
   * "horizontal" if you expect the collapsed strip to be the common case.
   */
  orientation?: "vertical" | "horizontal";
  railClassName?: string;
  tabClassName?: string;
  indicatorClassName?: string;
  stageClassName?: string;
  headerClassName?: string;
};

/**
 * A rail of choices beside a single stage: pick an entry, the stage shows it.
 *
 * Why this exists: a gallery of live examples wants one large surface, not a grid
 * of small ones — every small tile competes for the same attention and none of
 * them reads. Tabs solve that, except a stock horizontal strip runs out of room
 * past a handful of entries. A vertical rail scales to a dozen and still reads as
 * an index of what else there is.
 *
 * Built on Base UI's Tabs, so arrow-key navigation, roving focus, and the
 * `tablist` / `tab` / `tabpanel` wiring are the primitive's job, not ours.
 *
 * @example
 *   <RailStage
 *     railLabel="Examples"
 *     items={[
 *       { id: "chart", label: "Chart", header: <h3>Chart</h3>, content: <Chart /> },
 *       { id: "table", label: "Table", content: <Table /> },
 *     ]}
 *   />
 *
 * Notes:
 * - Below `sm` the rail becomes a horizontally scrollable strip above the stage,
 *   because a vertical rail plus a stage does not fit a phone. The selected entry
 *   is scrolled into view on change, so a selection made with the keyboard never
 *   lands off-screen. `orientation` stays whatever you set it to — the arrow-key
 *   axis cannot follow a media query without shipping one.
 * - The stage is `min-h-0 min-w-0` and clips, so content that animates its own
 *   size cannot stretch the shell and shift the page around it.
 * - Layout only: beyond a border and a divider the stage brings no background or
 *   backdrop of its own. Style it through `stageClassName`.
 */
export function RailStage({
  items,
  value,
  defaultValue,
  onValueChange,
  railSide = "end",
  railLabel,
  railWidth = 220,
  orientation = "vertical",
  className,
  style,
  railClassName,
  tabClassName,
  indicatorClassName,
  stageClassName,
  headerClassName,
  ...props
}: RailStageProps) {
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const firstId = items[0]?.id;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    () => defaultValue ?? firstId,
  );
  const isControlled = value !== undefined;
  const activeId = isControlled ? value : uncontrolledValue;
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  const handleValueChange = React.useCallback(
    (next: unknown) => {
      const nextId = String(next);

      if (!isControlled) {
        setUncontrolledValue(nextId);
      }

      onValueChange?.(nextId);
    },
    [isControlled, onValueChange],
  );

  const syncIndicator = React.useCallback(() => {
    const rail = railRef.current;
    const indicator = indicatorRef.current;
    const selected = rail?.querySelector<HTMLElement>(
      "[data-rail-stage-active]",
    );

    if (!rail || !indicator || !selected) return;

    const indicatorHeight = Math.max(selected.offsetHeight - 16, 0);
    const indicatorY =
      selected.offsetTop + (selected.offsetHeight - indicatorHeight) / 2;

    indicator.style.height = `${indicatorHeight}px`;
    indicator.style.transform = `translate3d(0, ${indicatorY}px, 0)`;
    indicator.dataset.active = "";
  }, []);

  React.useLayoutEffect(() => {
    const rail = railRef.current;
    const selected = rail?.querySelector<HTMLElement>(
      "[data-rail-stage-active]",
    );

    syncIndicator();

    if (!rail || !selected || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(syncIndicator);
    observer.observe(rail);
    observer.observe(selected);

    return () => observer.disconnect();
  }, [activeItem?.id, syncIndicator]);

  // Only meaningful in the collapsed strip: keep the selected entry visible when
  // selection moves by keyboard or from outside the component.
  React.useEffect(() => {
    const rail = railRef.current;

    if (!rail || rail.scrollWidth <= rail.clientWidth) return;

    const selected = rail.querySelector<HTMLElement>(
      "[data-rail-stage-active]",
    );

    if (!selected) return;

    rail.scrollTo({
      left: Math.max(selected.offsetLeft - 16, 0),
      behavior: "auto",
    });
  }, [activeItem?.id]);

  if (!activeItem) {
    return null;
  }

  return (
    <TabsPrimitive.Root
      {...props}
      data-slot="rail-stage"
      orientation={orientation}
      value={activeItem.id}
      onValueChange={handleValueChange}
      style={{
        ...style,
        ["--rail-stage-rail" as string]:
          typeof railWidth === "number" ? `${railWidth}px` : railWidth,
      }}
      className={cn(
        "grid min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground",
        railSide === "start"
          ? "sm:grid-cols-[var(--rail-stage-rail)_minmax(0,1fr)]"
          : "sm:grid-cols-[minmax(0,1fr)_var(--rail-stage-rail)]",
        className,
      )}
    >
      <div
        className={cn(
          "order-2 flex min-w-0 flex-col",
          railSide === "start" ? "sm:order-2" : "sm:order-1",
        )}
      >
        {activeItem.header ? (
          <div
            className={cn(
              "min-w-0 border-b bg-muted/20 px-4 py-3",
              headerClassName,
            )}
          >
            {activeItem.header}
          </div>
        ) : null}

        {items.map((item) => (
          <TabsPrimitive.Panel
            key={item.id}
            value={item.id}
            className={cn(
              "relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-4 outline-none sm:p-6",
              stageClassName,
            )}
          >
            {item.content}
          </TabsPrimitive.Panel>
        ))}
      </div>

      <TabsPrimitive.List
        ref={railRef}
        aria-label={railLabel}
        className={cn(
          "relative order-1 flex min-w-0 flex-nowrap overflow-x-auto overflow-y-hidden border-b",
          // Hide the strip's scrollbar without depending on a project utility.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "sm:flex-col sm:overflow-visible sm:border-b-0",
          railSide === "start"
            ? "sm:order-1 sm:border-r"
            : "sm:order-2 sm:border-l",
          railClassName,
        )}
      >
        <span
          ref={indicatorRef}
          aria-hidden="true"
          data-slot="rail-stage-indicator"
          className={cn(
            "pointer-events-none absolute top-0 hidden w-px bg-foreground opacity-0 will-change-transform",
            "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.645,0.045,0.355,1)]",
            "data-active:opacity-100 motion-reduce:transition-none sm:block",
            railSide === "start" ? "left-0" : "right-0",
            indicatorClassName,
          )}
        />

        {items.map((item) => (
          <TabsPrimitive.Tab
            key={item.id}
            value={item.id}
            data-rail-stage-active={
              item.id === activeItem.id ? "" : undefined
            }
            className={cn(
              "relative -mb-px flex h-11 min-w-44 flex-none items-center gap-2 border-b px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors",
              "hover:bg-muted/30 hover:text-foreground",
              "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              // The collapsed strip keeps a local underline; wide layouts use
              // the single measured indicator above so it can slide between tabs.
              "data-active:bg-muted/35 data-active:text-foreground",
              "data-active:after:absolute data-active:after:inset-x-4 data-active:after:bottom-0 data-active:after:h-px data-active:after:bg-foreground",
              "sm:min-w-0 sm:data-active:after:hidden",
              tabClassName,
            )}
          >
            <span className="min-w-0 truncate">{item.label}</span>
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
