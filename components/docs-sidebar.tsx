"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { useTreeContext } from "fumadocs-ui/contexts/tree";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  type SidebarProviderProps,
} from "fumadocs-ui/layouts/docs/slots/sidebar";

import {
  buildDocsGroups,
  type DocsNavGroup,
  type DocsNavItem,
} from "@/lib/docs-navigation";
import { cn } from "@/lib/utils";

export function CustomDocsSidebarProvider(props: SidebarProviderProps) {
  return <SidebarProvider {...props} />;
}

export function CustomDocsSidebarTrigger(props: ComponentProps<"button">) {
  return <SidebarTrigger {...props} />;
}

export function useCustomDocsSidebar() {
  return useSidebar();
}

export function CustomDocsSidebar() {
  const { root } = useTreeContext();
  const groups = buildDocsGroups(root);

  return <DesktopSidebar groups={groups} />;
}

function DesktopSidebar({ groups }: { groups: DocsNavGroup[] }) {
  return (
    <aside
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-(--fd-sidebar-width) shrink-0 justify-self-end overflow-hidden bg-background text-foreground [grid-area:sidebar] lg:block"
      aria-label="Documentation sidebar"
    >
      <nav className="flex h-full min-h-0 flex-col gap-9 overflow-y-auto px-4 py-10 text-sm">
        <SidebarGroups groups={groups} variant="desktop" />
      </nav>
    </aside>
  );
}

function SidebarGroups({
  groups,
  variant,
  onNavigate,
}: {
  groups: DocsNavGroup[];
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  return groups.map((group) => (
    <section key={group.title} className="flex flex-col gap-2">
      <h2
        className={cn(
          "font-normal",
          variant === "desktop" &&
            "mb-1 text-sm text-muted-foreground",
          variant === "mobile" && "mb-3 text-sm text-muted-foreground",
        )}
      >
        {group.title}
      </h2>
      <div className={cn("flex flex-col", variant === "mobile" ? "gap-4" : "gap-1")}>
        {group.items.map((item) => (
          <SidebarLink
            key={`${group.title}-${item.url}-${String(item.title)}`}
            item={item}
            variant={variant}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  ));
}

function SidebarLink({
  item,
  variant,
  onNavigate,
}: {
  item: DocsNavItem;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.url;

  return (
    <Link
      href={item.url}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "transition-colors",
        variant === "desktop" &&
          "self-start rounded-md px-2 py-1.5 text-foreground hover:bg-accent hover:text-accent-foreground",
        variant === "desktop" &&
          active &&
          "bg-accent font-semibold text-accent-foreground",
        variant === "mobile" &&
          "text-2xl font-semibold leading-none text-foreground hover:text-muted-foreground",
        variant === "mobile" && active && "text-foreground",
        item.disabled && "pointer-events-none opacity-35",
      )}
    >
      {item.title}
      {variant === "mobile" && active ? (
        <span className="ml-2 inline-block size-2 rounded-full bg-primary align-middle" />
      ) : null}
    </Link>
  );
}
