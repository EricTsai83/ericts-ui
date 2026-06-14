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

const mobilePrimaryItems = [
  { title: "Home", url: "/" },
  { title: "Docs", url: "/docs" },
  { title: "Components", url: "/blocks" },
  { title: "Blocks", url: "/blocks" },
  { title: "Charts", url: "/blocks" },
  { title: "Directory", url: "/blocks" },
  { title: "Create", url: "/docs/installation" },
];

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
      <MobileMenuButton onClick={() => setOpen(true)} />
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
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[220px] shrink-0 overflow-y-auto border-r bg-background [grid-area:sidebar] md:block"
      aria-label="Documentation sidebar"
    >
      <nav className="flex min-h-full flex-col gap-9 px-4 py-10 text-sm">
        <SidebarGroups groups={groups} variant="desktop" />
      </nav>
    </aside>
  );
}

function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="fixed left-4 top-16 z-30 inline-flex h-9 items-center gap-2 rounded-md border bg-background/95 px-3 text-sm font-medium shadow-sm backdrop-blur md:hidden"
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu className="size-4" aria-hidden="true" />
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black text-white md:hidden">
      <div className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-white/10 bg-black/95 px-4 backdrop-blur">
        <button
          type="button"
          className="-ml-1 inline-flex h-9 items-center gap-2 rounded-md px-1 text-xl font-medium"
          onClick={() => onOpenChange(false)}
          aria-label="Close menu"
        >
          <X className="size-5" aria-hidden="true" />
          Menu
        </button>
        <div className="flex items-center gap-2">
          {SearchTrigger ? (
            <SearchTrigger
              hideIfDisabled
              className="inline-flex size-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10"
            />
          ) : (
            <Search className="size-5 text-white/80" aria-hidden="true" />
          )}
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-full bg-white px-3 text-sm font-medium text-black"
            onClick={() => onOpenChange(false)}
          >
            New
          </Link>
        </div>
      </div>
      <nav className="px-4 pb-12 pt-5">
        <p className="mb-4 text-sm text-white/55">Menu</p>
        <div className="mb-12 flex flex-col gap-4">
          {mobilePrimaryItems.map((item) => (
            <Link
              key={`${item.title}-${item.url}`}
              href={item.url}
              className="text-2xl font-semibold leading-none text-white"
              onClick={() => onOpenChange(false)}
            >
              {item.title}
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
          variant === "desktop" && "mb-1 text-sm text-muted-foreground",
          variant === "mobile" && "mb-3 text-sm text-white/55",
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
          "rounded-md px-2 py-1.5 font-medium text-foreground hover:bg-muted",
        variant === "desktop" && active && "bg-muted",
        variant === "mobile" && "text-2xl font-semibold leading-none text-white",
        variant === "mobile" && active && "text-white",
        item.disabled && "pointer-events-none opacity-35",
      )}
    >
      {item.title}
      {variant === "mobile" && active ? (
        <span className="ml-2 inline-block size-2 rounded-full bg-blue-500 align-middle" />
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
