"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type MotionTransition = NonNullable<HTMLMotionProps<"div">["transition"]>;

const minPanelDuration = 0.15;
const maxPanelDuration = 0.27;
const drawerExitResetDelay = 220;
const heightChangeDurationDivisor = 500;
const heightChangeThreshold = 0.5;
const drawerTransitionClass =
  "![transition:transform_0.2s_cubic-bezier(0.165,0.84,0.44,1)]";

export type AdaptiveDrawerControls = {
  activePanel: string;
  setPanel: (panel: string) => void;
  close: () => void;
};

export type AdaptiveDrawerPanel = {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  content:
    | React.ReactNode
    | ((controls: AdaptiveDrawerControls) => React.ReactNode);
};

export type AdaptiveDrawerProps = {
  panels: AdaptiveDrawerPanel[];
  panel?: string;
  defaultPanel?: string;
  onPanelChange?: (panel: string) => void;
  resetOnClose?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  trigger?: React.ReactNode;
  triggerLabel?: React.ReactNode;
  closeLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  drawerClassName?: string;
  contentClassName?: string;
  heightTransition?: MotionTransition;
  panelTransition?: MotionTransition;
};

export function AdaptiveDrawer({
  panels,
  panel,
  defaultPanel,
  onPanelChange,
  resetOnClose = true,
  title = "Adaptive drawer",
  description,
  trigger,
  triggerLabel = "Open drawer",
  closeLabel = "Close drawer",
  open,
  defaultOpen = false,
  onOpenChange,
  drawerClassName,
  contentClassName,
  heightTransition,
  panelTransition,
}: AdaptiveDrawerProps) {
  const fallbackPanel = defaultPanel ?? panels[0]?.id ?? "";
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [uncontrolledPanel, setUncontrolledPanel] =
    React.useState(fallbackPanel);
  const [height, setHeight] = React.useState<number | null>(null);
  const [panelDuration, setPanelDuration] =
    React.useState(minPanelDuration);
  const [contentElement, setContentElement] =
    React.useState<HTMLDivElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const previousHeightRef = React.useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const isControlledOpen = open !== undefined;
  const isControlledPanel = panel !== undefined;
  const isOpen = isControlledOpen ? open : uncontrolledOpen;
  const activePanelId = isControlledPanel ? panel : uncontrolledPanel;
  const activePanel =
    panels.find((item) => item.id === activePanelId) ?? panels[0];

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlledOpen) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlledOpen, onOpenChange],
  );

  const setPanel = React.useCallback(
    (nextPanel: string) => {
      if (!panels.some((item) => item.id === nextPanel)) return;

      if (!isControlledPanel) {
        setUncontrolledPanel(nextPanel);
      }

      onPanelChange?.(nextPanel);
    },
    [isControlledPanel, onPanelChange, panels],
  );

  const controls = React.useMemo<AdaptiveDrawerControls>(
    () => ({
      activePanel: activePanel?.id ?? "",
      setPanel,
      close: () => setOpen(false),
    }),
    [activePanel?.id, setOpen, setPanel],
  );

  React.useEffect(() => {
    if (!isOpen) {
      const timer = window.setTimeout(() => {
        setHeight(null);
        setPanelDuration(shouldReduceMotion ? 0 : minPanelDuration);
        previousHeightRef.current = null;

        if (resetOnClose && !isControlledPanel) {
          setUncontrolledPanel(fallbackPanel);
        }
      }, drawerExitResetDelay);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [
    fallbackPanel,
    isControlledPanel,
    isOpen,
    resetOnClose,
    shouldReduceMotion,
  ]);

  React.useEffect(() => {
    if (!isOpen) return;

    const element = contentElement;

    if (!element) return;

    const measure = () => {
      const nextHeight = element.getBoundingClientRect().height;
      const previousHeight = previousHeightRef.current;

      if (nextHeight <= 0) return;

      setHeight((currentHeight) =>
        currentHeight !== null &&
        Math.abs(currentHeight - nextHeight) < heightChangeThreshold
          ? currentHeight
          : nextHeight,
      );

      if (shouldReduceMotion || !previousHeight || !nextHeight) {
        setPanelDuration(shouldReduceMotion ? 0 : minPanelDuration);
        previousHeightRef.current = nextHeight;
        return;
      }

      const heightDifference = Math.abs(nextHeight - previousHeight);
      const nextDuration = Math.min(
        Math.max(heightDifference / heightChangeDurationDivisor, minPanelDuration),
        maxPanelDuration,
      );

      setPanelDuration((currentDuration) =>
        Math.abs(currentDuration - nextDuration) < 0.01
          ? currentDuration
          : nextDuration,
      );
      previousHeightRef.current = nextHeight;
    };

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = window.requestAnimationFrame(measure);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
        }
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      observer.disconnect();
    };
  }, [activePanel?.id, contentElement, isOpen, shouldReduceMotion]);

  const resolvedHeightTransition: MotionTransition = shouldReduceMotion
    ? { duration: 0 }
    : heightTransition ?? { duration: 0.27, ease: [0.25, 1, 0.5, 1] };
  const resolvedPanelTransition: MotionTransition = shouldReduceMotion
    ? { duration: 0 }
    : panelTransition ?? {
        duration: panelDuration,
        ease: [0.26, 0.08, 0.25, 1],
      };

  if (!activePanel) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger ?? <Button type="button">{triggerLabel}</Button>}
      </DrawerTrigger>
      <DrawerContent
        className={cn(
          "inset-x-4 bottom-4 mx-auto max-w-sm overflow-hidden rounded-2xl border bg-background p-0",
          "data-[vaul-drawer-direction=bottom]:inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:rounded-2xl data-[vaul-drawer-direction=bottom]:border",
          drawerTransitionClass,
          drawerClassName,
        )}
      >
        <MotionConfig reducedMotion="user">
          <motion.div
            initial={false}
            animate={
              shouldReduceMotion ? { height: "auto" } : { height: height ?? 0 }
            }
            transition={resolvedHeightTransition}
            className="overflow-hidden"
          >
            <div
              ref={setContentElement}
              className={cn("px-6 pb-6 pt-5", contentClassName)}
            >
              <div className="grid grid-cols-[1fr_2rem] items-start gap-4">
                <div className="min-w-0">
                  <DrawerTitle className="text-base font-semibold">
                    {title}
                  </DrawerTitle>
                  {description ? (
                    <DrawerDescription className="mt-1">
                      {description}
                    </DrawerDescription>
                  ) : null}
                </div>
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={closeLabel}
                    className="rounded-full"
                  >
                    <X aria-hidden />
                  </Button>
                </DrawerClose>
              </div>

              <div className="relative mt-6 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={activePanel.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={resolvedPanelTransition}
                  >
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {activePanel.title}
                      </h3>
                      {activePanel.description ? (
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {activePanel.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-5">
                      {typeof activePanel.content === "function"
                        ? activePanel.content(controls)
                        : activePanel.content}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </MotionConfig>
      </DrawerContent>
    </Drawer>
  );
}
