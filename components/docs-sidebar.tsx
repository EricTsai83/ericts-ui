"use client";

import Link from "next/link";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Folder, Item, Root, Separator } from "fumadocs-core/page-tree";
import { useTreeContext } from "fumadocs-ui/contexts/tree";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  type SidebarProviderProps,
} from "fumadocs-ui/layouts/docs/slots/sidebar";

import { primaryNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type NavGroup = {
  title: string;
  items: NavItem[];
};

type NavItem = {
  title: ReactNode;
  url: string;
  disabled?: boolean;
};

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
  const { open, setOpen } = useSidebar();
  const { slots } = useDocsLayout();
  const { root } = useTreeContext();
  const groups = buildGroups(root);
  const SearchTrigger = slots.searchTrigger ? slots.searchTrigger.sm : undefined;

  return (
    <>
      <DesktopSidebar groups={groups} />
      <MobileMenuButton open={open} onClick={() => setOpen(!open)} />
      <MobileSidebar
        groups={groups}
        open={open}
        onOpenChange={setOpen}
        SearchTrigger={SearchTrigger}
      />
    </>
  );
}

function DesktopSidebar({ groups }: { groups: NavGroup[] }) {
  return (
    <aside
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-(--fd-sidebar-width) shrink-0 justify-self-end overflow-hidden bg-background text-foreground [grid-area:sidebar] md:block"
      aria-label="Documentation sidebar"
    >
      <nav className="flex h-full min-h-0 flex-col gap-9 overflow-y-auto px-4 py-10 text-sm">
        <SidebarGroups groups={groups} variant="desktop" />
      </nav>
    </aside>
  );
}

function MobileMenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="fixed left-4 top-2.5 z-50 inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      {open ? (
        <X className="size-4" aria-hidden="true" />
      ) : (
        <Menu className="size-4" aria-hidden="true" />
      )}
      Menu
    </button>
  );
}

function MobileSidebar({
  groups,
  open,
  onOpenChange,
  SearchTrigger,
}: {
  groups: NavGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  SearchTrigger?: ComponentType<{
    className?: string;
    hideIfDisabled?: boolean;
  }>;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-y-auto border-t border-border bg-background text-foreground md:hidden">
      <nav className="px-4 pb-12 pt-5">
        <div className="mb-6 flex items-center justify-end gap-2">
          {SearchTrigger ? (
            <SearchTrigger
              hideIfDisabled
              className="inline-flex size-9 items-center justify-center rounded-md text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            />
          ) : (
            <Search
              className="size-5 text-foreground/80"
              aria-hidden="true"
            />
          )}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Menu</p>
        <div className="mb-12 flex flex-col gap-4">
          {primaryNavItems.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="text-2xl font-semibold leading-none text-foreground transition-colors hover:text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <SidebarGroups
          groups={groups}
          variant="mobile"
          onNavigate={() => onOpenChange(false)}
        />
      </nav>
    </div>
  );
}

function SidebarGroups({
  groups,
  variant,
  onNavigate,
}: {
  groups: NavGroup[];
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
  item: NavItem;
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

function buildGroups(root: Root | Folder): NavGroup[] {
  const groups: NavGroup[] = [];
  let current: NavGroup = { title: "Sections", items: [] };

  const flush = () => {
    if (current.items.length > 0) {
      groups.push(current);
    }
  };

  for (const node of root.children) {
    if (node.type === "separator") {
      flush();
      current = { title: nodeTitle(node, "Section"), items: [] };
      continue;
    }

    if (node.type === "folder") {
      flush();
      groups.push(folderToGroup(node));
      current = { title: "Sections", items: [] };
      continue;
    }

    current.items.push(pageToItem(node));
  }

  flush();

  return groups.length > 0 ? groups : [{ title: "Sections", items: [] }];
}

function folderToGroup(folder: Folder): NavGroup {
  const items: NavItem[] = [];

  if (folder.index) {
    items.push(pageToItem(folder.index));
  }

  for (const child of folder.children) {
    if (child.type === "page") {
      items.push(pageToItem(child));
    }
  }

  return {
    title: nodeTitle(folder, "Components"),
    items,
  };
}

function pageToItem(item: Item): NavItem {
  return {
    title: item.name,
    url: item.url,
  };
}

function nodeTitle(node: Folder | Separator, fallback: string): string {
  return typeof node.name === "string" ? node.name : fallback;
}
