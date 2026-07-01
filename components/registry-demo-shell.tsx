"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Code2,
  HelpCircle,
  Minimize2,
  Shuffle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { RegistryDemoCodeDrawer } from "@/components/registry-demo-code-drawer";
import { RegistryPreview } from "@/components/registry-preview";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RegistryCodeModel } from "@/lib/registry-code";
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
  randomItems: RegistryDemoNavigationItem[];
};

export function RegistryDemoShell({
  item,
  codeModel,
  navigation,
  variant,
}: {
  item: RegistryDisplayItem;
  codeModel: RegistryCodeModel;
  navigation: RegistryDemoNavigation;
  variant: string;
}) {
  const router = useRouter();
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const itemPageLabel = getItemPageLabel(item.kind);
  const randomItems = useMemo(
    () =>
      navigation.randomItems.filter(
        (navigationItem) => navigationItem.name !== item.name,
      ),
    [item.name, navigation.randomItems],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isHelpOpen) {
        return;
      }

      if (event.key === "Escape" && isCodeOpen) {
        event.preventDefault();
        setIsCodeOpen(false);
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

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        const randomItem =
          randomItems[Math.floor(Math.random() * randomItems.length)];

        if (randomItem) {
          router.replace(randomItem.viewHref);
        }
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        setIsCodeOpen((value) => !value);
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
    isCodeOpen,
    isHelpOpen,
    item.href,
    navigation.next,
    navigation.nextCategory,
    navigation.previous,
    navigation.previousCategory,
    randomItems,
    router,
  ]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-30 flex min-h-14 flex-wrap items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {item.kind}
            </span>
            <span className="truncate text-sm font-medium">{item.title}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {item.category} / {item.name}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <NavigationButton
            label="Previous item"
            item={navigation.previous}
            onNavigate={() => replaceNavigationItem(router, navigation.previous)}
          >
            <ArrowLeft aria-hidden="true" />
          </NavigationButton>
          <NavigationButton
            label="Next item"
            item={navigation.next}
            onNavigate={() => replaceNavigationItem(router, navigation.next)}
          >
            <ArrowRight aria-hidden="true" />
          </NavigationButton>
          <NavigationButton
            label="Previous category"
            item={navigation.previousCategory}
            onNavigate={() =>
              replaceNavigationItem(router, navigation.previousCategory)
            }
            className="hidden sm:inline-flex"
          >
            <ArrowUp aria-hidden="true" />
          </NavigationButton>
          <NavigationButton
            label="Next category"
            item={navigation.nextCategory}
            onNavigate={() =>
              replaceNavigationItem(router, navigation.nextCategory)
            }
            className="hidden sm:inline-flex"
          >
            <ArrowDown aria-hidden="true" />
          </NavigationButton>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Open random item"
            title="Random item"
            onClick={() => {
              const randomItem =
                randomItems[Math.floor(Math.random() * randomItems.length)];

              if (randomItem) {
                router.replace(randomItem.viewHref);
              }
            }}
            disabled={randomItems.length === 0}
          >
            <Shuffle aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant={isCodeOpen ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Toggle code drawer"
            title="Code / install"
            onClick={() => setIsCodeOpen((value) => !value)}
          >
            <Code2 aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle aria-hidden="true" />
          </Button>
          <Link
            href={item.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "sm:hidden",
            )}
            aria-label={`Open ${itemPageLabel.toLowerCase()}`}
            title={itemPageLabel}
          >
            <Minimize2 aria-hidden="true" />
          </Link>
          <Link
            href={item.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            {itemPageLabel}
          </Link>
        </div>
      </header>

      <section className="relative flex flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
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

      <RegistryDemoCodeDrawer
        item={item}
        codeModel={codeModel}
        open={isCodeOpen}
        onOpenChange={setIsCodeOpen}
      />

      <ShortcutDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </main>
  );
}

function NavigationButton({
  label,
  item,
  onNavigate,
  className,
  children,
}: {
  label: string;
  item?: RegistryDemoNavigationItem;
  onNavigate: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={item ? `${label}: ${item.title}` : label}
      title={item ? `${label}: ${item.title}` : label}
      onClick={onNavigate}
      disabled={!item}
      className={className}
    >
      {children}
    </Button>
  );
}

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
              <kbd className="font-mono text-xs font-medium text-foreground">
                {shortcut.key}
              </kbd>
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
  { key: "Esc", label: "Close code drawer, then open the detail page" },
  { key: "R", label: "Random item of this type" },
  { key: "C", label: "Toggle code / install drawer" },
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
