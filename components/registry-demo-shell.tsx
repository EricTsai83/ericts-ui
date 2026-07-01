"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "fumadocs-ui/provider/base";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { RegistryPreview } from "@/components/registry-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";

export type RegistryDemoNavigationItem = Pick<
  RegistryDisplayItem,
  "name" | "title" | "category" | "viewHref"
>;

export type RegistryDemoNavigation = {
  previous?: RegistryDemoNavigationItem;
  next?: RegistryDemoNavigationItem;
  previousCategory?: RegistryDemoNavigationItem;
  nextCategory?: RegistryDemoNavigationItem;
};

export function RegistryDemoShell({
  item,
  navigation,
  variant,
}: {
  item: RegistryDisplayItem;
  navigation: RegistryDemoNavigation;
  variant: string;
}) {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const itemPageLabel = getItemPageLabel(item.kind);
  const prefetchHrefs = useMemo(
    () =>
      uniqueStrings([
        navigation.previous?.viewHref,
        navigation.next?.viewHref,
        navigation.previousCategory?.viewHref,
        navigation.nextCategory?.viewHref,
      ]).filter((href) => href !== item.viewHref),
    [
      item.viewHref,
      navigation.next,
      navigation.nextCategory,
      navigation.previous,
      navigation.previousCategory,
    ],
  );

  useEffect(() => {
    for (const href of prefetchHrefs) {
      prefetchRoute(router, href);
    }
  }, [prefetchHrefs, router]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isHelpOpen) {
        return;
      }

      if (event.key === "Escape") {
        if (shouldIgnoreEscapeShortcut(event)) {
          return;
        }

        event.preventDefault();
        router.push(item.href);
        return;
      }

      if (shouldIgnoreShortcut(event)) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        replaceNavigationItem(router, navigation.next);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        replaceNavigationItem(router, navigation.previous);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        replaceNavigationItem(router, navigation.nextCategory);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        replaceNavigationItem(router, navigation.previousCategory);
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        setIsHelpOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isHelpOpen,
    item.href,
    navigation.next,
    navigation.nextCategory,
    navigation.previous,
    navigation.previousCategory,
    router,
  ]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">{item.title} fullscreen preview</h1>

      <section className="relative flex flex-1 items-center justify-center overflow-auto p-5 pb-24 sm:p-8 sm:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)] dark:opacity-20"
        />
        <div
          className={cn(
            "z-10 flex w-full min-w-0 items-center justify-center",
            getViewportClassName(item.viewport),
          )}
        >
          <RegistryPreview name={item.name} variant={variant} />
        </div>
      </section>

      <DemoToolbar
        itemPageLabel={itemPageLabel}
        itemHref={item.href}
        navigation={navigation}
        onHelpOpen={() => setIsHelpOpen(true)}
      />

      <ShortcutDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </main>
  );
}

function DemoToolbar({
  itemPageLabel,
  itemHref,
  navigation,
  onHelpOpen,
}: {
  itemPageLabel: string;
  itemHref: string;
  navigation: RegistryDemoNavigation;
  onHelpOpen: () => void;
}) {
  return (
    <nav
      aria-label="Preview controls"
      className="fixed bottom-3 right-3 z-30 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-end gap-1 rounded-lg border bg-popover/95 p-1 text-popover-foreground shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-popover/85 sm:bottom-4 sm:right-4"
    >
      <ToolbarLink
        href={itemHref}
        ariaLabel={`Exit fullscreen to ${itemPageLabel.toLowerCase()}`}
        title="Exit fullscreen"
        shortcut="esc"
        label="exit fullscreen"
      />
      <ToolbarSeparator />
      <NavigationButton
        label="previous"
        ariaLabel="Previous item"
        shortcut="←"
        item={navigation.previous}
      />
      <NavigationButton
        label="next"
        ariaLabel="Next item"
        shortcut="→"
        item={navigation.next}
      />
      <ToolbarSeparator />
      <NavigationButton
        label="previous group"
        ariaLabel="Previous category"
        shortcut="↑"
        item={navigation.previousCategory}
      />
      <NavigationButton
        label="next group"
        ariaLabel="Next category"
        shortcut="↓"
        item={navigation.nextCategory}
      />
      <ToolbarSeparator />
      <ThemeToolbarButton />
      <ToolbarButton
        ariaLabel="Show keyboard shortcuts"
        title="Keyboard shortcuts"
        shortcut="?"
        label="keys"
        onClick={onHelpOpen}
      />
    </nav>
  );
}

function ThemeToolbarButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ToolbarButton
      ariaLabel="Toggle theme"
      title="Toggle theme"
      shortcut="D"
      label="theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}

function ToolbarLink({
  href,
  ariaLabel,
  title,
  shortcut,
  label,
}: {
  href: string;
  ariaLabel: string;
  title: string;
  shortcut: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className={toolbarCommandClassName}
    >
      <ToolbarShortcut>{shortcut}</ToolbarShortcut>
      <ToolbarCommandLabel>{label}</ToolbarCommandLabel>
    </Link>
  );
}

function NavigationButton({
  label,
  ariaLabel,
  shortcut,
  item,
}: {
  label: string;
  ariaLabel: string;
  shortcut: string;
  item?: RegistryDemoNavigationItem;
}) {
  const resolvedLabel = item ? `${ariaLabel}: ${item.title}` : ariaLabel;

  if (item) {
    return (
      <Link
        href={item.viewHref}
        replace
        aria-label={resolvedLabel}
        title={resolvedLabel}
        className={toolbarCommandClassName}
      >
        <ToolbarShortcut>{shortcut}</ToolbarShortcut>
        <ToolbarCommandLabel>{label}</ToolbarCommandLabel>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      disabled
      className={toolbarButtonClassName}
    >
      <ToolbarShortcut>{shortcut}</ToolbarShortcut>
      <ToolbarCommandLabel>{label}</ToolbarCommandLabel>
    </Button>
  );
}

function ToolbarButton({
  ariaLabel,
  title,
  shortcut,
  label,
  onClick,
}: {
  ariaLabel: string;
  title: string;
  shortcut: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={toolbarButtonClassName}
    >
      <ToolbarShortcut>{shortcut}</ToolbarShortcut>
      <ToolbarCommandLabel>{label}</ToolbarCommandLabel>
    </Button>
  );
}

function ToolbarShortcut({ children }: { children: ReactNode }) {
  return (
    <Kbd className="shrink-0 rounded-md font-mono text-[0.68rem] leading-none text-foreground shadow-[inset_0_-1px_0_var(--border)]">
      {children}
    </Kbd>
  );
}

function ToolbarCommandLabel({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap text-xs leading-none text-muted-foreground">
      {children}
    </span>
  );
}

function ToolbarSeparator() {
  return (
    <span
      aria-hidden="true"
      className="size-0.5 shrink-0 rounded-full bg-border"
    />
  );
}

const toolbarCommandClassName = cn(
  "inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 transition-colors",
  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const toolbarButtonClassName = cn(
  toolbarCommandClassName,
  "rounded-md border-0 bg-transparent text-popover-foreground hover:bg-muted hover:text-popover-foreground",
);

function ShortcutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts apply while focus is outside form fields and active
            overlay controls.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 text-sm">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 rounded-md bg-muted/50 px-3 py-2"
            >
              <Kbd className="font-mono text-xs font-medium text-foreground">
                {shortcut.key}
              </Kbd>
              <span className="text-muted-foreground">{shortcut.label}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const shortcuts = [
  { key: "ArrowRight", label: "Next item in this category" },
  { key: "ArrowLeft", label: "Previous item in this category" },
  { key: "ArrowDown", label: "First item in the next category" },
  { key: "ArrowUp", label: "First item in the previous category" },
  { key: "Esc", label: "Exit fullscreen" },
  { key: "D", label: "Toggle theme mode" },
  { key: "?", label: "Show this help" },
] as const;

function replaceNavigationItem(
  router: ReturnType<typeof useRouter>,
  item?: RegistryDemoNavigationItem,
) {
  if (!item) {
    return;
  }

  router.replace(item.viewHref);
}

function prefetchRoute(router: ReturnType<typeof useRouter>, href: string) {
  try {
    router.prefetch(href);
  } catch {
    // Prefetch is opportunistic; navigation still works without it.
  }
}

function shouldIgnoreShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }

  if (targetIsInsideOpenOverlay()) {
    return true;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "input",
        "select",
        "textarea",
        "[contenteditable='']",
        "[contenteditable='true']",
        "[role='textbox']",
      ].join(","),
    ),
  );
}

function shouldIgnoreEscapeShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }

  if (targetIsInsideOpenOverlay()) {
    return true;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "input",
        "select",
        "textarea",
        "[contenteditable='']",
        "[contenteditable='true']",
        "[role='textbox']",
      ].join(","),
    ),
  );
}

function targetIsInsideOpenOverlay() {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof Element)) {
    return false;
  }

  return Boolean(
    activeElement.closest("[data-slot='popover-content'], [role='dialog']"),
  );
}

function getViewportClassName(viewport = "centered") {
  if (viewport === "full") {
    return "max-w-none";
  }

  if (viewport === "wide") {
    return "max-w-6xl";
  }

  return "max-w-3xl";
}

function getItemPageLabel(kind: RegistryDisplayItem["kind"]) {
  if (kind === "hook") {
    return "Hook page";
  }

  if (kind === "block") {
    return "Block page";
  }

  return "Component page";
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
}
