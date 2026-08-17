"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  isPathActive,
  NavLink,
  type NavLinkMatch,
} from "@/registry/base/ui/nav-link";

type DemoLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: NavLinkMatch;
  transition: "instant" | "slow";
};

const links: DemoLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: "exact",
    transition: "instant",
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
    icon: FolderKanban,
    match: "prefix",
    transition: "slow",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    match: "exact",
    transition: "instant",
  },
];

const demoPendingDelay = 150;
const demoSlowRouteDuration = 1100;

export default function Preview() {
  const [pathname, setPathname] = useState("/dashboard");
  const [pendingHref, setPendingHref] = useState<string>();
  const [visiblePendingHref, setVisiblePendingHref] = useState<string>();
  const pendingDelayTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeLink = links.find((link) =>
    isPathActive(pathname, link.href, link.match),
  );
  const currentUrl = `https://app.example.com${pathname}`;

  const clearPendingTimers = useCallback(() => {
    if (pendingDelayTimerRef.current) {
      clearTimeout(pendingDelayTimerRef.current);
      pendingDelayTimerRef.current = undefined;
    }

    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = undefined;
    }
  }, []);

  const clearPendingNavigation = useCallback(() => {
    clearPendingTimers();
    setPendingHref(undefined);
    setVisiblePendingHref(undefined);
  }, [clearPendingTimers]);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) {
        clearPendingNavigation();
        return;
      }

      clearPendingNavigation();

      const transition = links.find((link) => link.href === href)?.transition;

      if (transition !== "slow") {
        setPathname(href);
        return;
      }

      setPendingHref(href);
      pendingDelayTimerRef.current = setTimeout(() => {
        setVisiblePendingHref(href);
        pendingDelayTimerRef.current = undefined;
      }, demoPendingDelay);
      navigationTimerRef.current = setTimeout(() => {
        setPathname(href);
        setPendingHref(undefined);
        setVisiblePendingHref(undefined);
        navigationTimerRef.current = undefined;
      }, demoSlowRouteDuration);
    },
    [clearPendingNavigation, pathname],
  );

  useEffect(() => clearPendingTimers, [clearPendingTimers]);

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="flex h-9 items-center gap-2 border-b bg-muted/40 px-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-foreground/20" />
          <span className="size-2 rounded-full bg-foreground/20" />
          <span className="size-2 rounded-full bg-foreground/20" />
        </div>
        <code
          aria-label="Current demo URL"
          className="no-scrollbar min-w-0 flex-1 overflow-x-auto rounded bg-background px-2 py-1 text-left text-[11px] whitespace-nowrap text-muted-foreground ring-1 ring-border"
        >
          {currentUrl}
        </code>
      </div>

      <div className="grid sm:grid-cols-[10rem_1fr]">
        <nav
          aria-label="Demo workspace navigation"
          className="flex gap-1 border-b p-2 sm:flex-col sm:border-r sm:border-b-0"
        >
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.href}
                href={link.href}
                match={link.match}
                currentPathname={pathname}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(link.href);
                }}
                className={({ isActive }) =>
                  cn(
                    "group relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground outline-none transition-[color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:flex-none sm:justify-start",
                    isActive && "bg-muted text-foreground",
                  )
                }
              >
                {({ isActive, isPending }) => {
                  const showPending =
                    isPending || visiblePendingHref === link.href;

                  return (
                    <>
                      {showPending ? (
                        <LoaderCircle
                          aria-hidden="true"
                          className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
                        />
                      ) : (
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "size-4 shrink-0 transition-opacity duration-150 motion-reduce:transition-none",
                            isActive ? "opacity-100" : "opacity-55",
                          )}
                        />
                      )}
                      <span className="truncate">{link.label}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-3 bottom-0 h-0.5 origin-center rounded-full bg-foreground transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none sm:inset-y-2 sm:right-auto sm:left-0 sm:h-auto sm:w-0.5",
                          isActive
                            ? "scale-x-100 opacity-100 sm:scale-x-100 sm:scale-y-100"
                            : "scale-x-50 opacity-0 sm:scale-x-100 sm:scale-y-50",
                        )}
                      />
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        <section className="flex min-h-72 flex-col gap-4 p-5">
          <DemoRouteLinks
            pathname={pathname}
            visiblePendingHref={visiblePendingHref}
            onNavigate={navigate}
          />
          <DemoStateReadout
            pathname={pathname}
            activeLink={activeLink}
            isPending={Boolean(pendingHref)}
          />
          <Separator />
          <div aria-live="polite">
            {pathname === "/dashboard/projects" ? (
              <ProjectList
                pathname={pathname}
                onOpen={() => navigate("/dashboard/projects/acme")}
              />
            ) : pathname === "/dashboard/projects/acme" ? (
              <ProjectDetail
                pathname={pathname}
                onBack={() => navigate("/dashboard/projects")}
              />
            ) : (
              <SimplePage title={activeLink?.label ?? "Page"} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DemoRouteLinks({
  pathname,
  visiblePendingHref,
  onNavigate,
}: {
  pathname: string;
  visiblePendingHref?: string;
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Navigate
      </h3>
      <nav
        aria-label="Demo route links"
        className="grid grid-cols-3 gap-2"
      >
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.href}
              href={link.href}
              match={link.match}
              currentPathname={pathname}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(link.href);
              }}
              className={({ isActive }) =>
                cn(
                  buttonVariants({
                    variant: isActive ? "secondary" : "outline",
                    size: "sm",
                  }),
                  "min-w-0 px-1.5 sm:px-2.5",
                )
              }
            >
              {({ isPending }) => {
                const showPending =
                  isPending || visiblePendingHref === link.href;

                return (
                  <>
                    {showPending ? (
                      <LoaderCircle
                        aria-hidden="true"
                        data-icon="inline-start"
                        className="animate-spin motion-reduce:animate-none"
                      />
                    ) : (
                      <Icon aria-hidden="true" data-icon="inline-start" />
                    )}
                    <span className="truncate">{link.label}</span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

function DemoStateReadout({
  pathname,
  activeLink,
  isPending,
}: {
  pathname: string;
  activeLink?: DemoLink;
  isPending: boolean;
}) {
  const isExact = activeLink
    ? isPathActive(pathname, activeLink.href, "exact")
    : false;

  return (
    <dl
      aria-live="polite"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-border sm:grid-cols-4"
    >
      <ReadoutCell label="active" value={activeLink?.label ?? "none"} />
      <ReadoutCell label="match" value={activeLink?.match ?? "—"} />
      <ReadoutCell
        label="aria-current"
        value={activeLink ? (isExact ? "page" : "location") : "—"}
      />
      <ReadoutCell label="pending" value={isPending ? "true" : "false"} muted={!isPending} />
    </dl>
  );
}

function ReadoutCell({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 bg-background px-2.5 py-2">
      <dt className="truncate text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "truncate font-mono text-xs",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ProjectList({
  pathname,
  onOpen,
}: {
  pathname: string;
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold tracking-tight">Projects</h3>
      <NavLink
        href="/dashboard/projects/acme"
        match="exact"
        currentPathname={pathname}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-auto w-full justify-between py-3 text-left whitespace-normal",
        )}
        onClick={(event) => {
          event.preventDefault();
          onOpen();
        }}
      >
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="font-medium">Acme website</span>
          <span className="text-xs font-normal text-muted-foreground">
            View project details
          </span>
        </span>
        <ArrowRight data-icon="inline-end" />
      </NavLink>
    </div>
  );
}

function ProjectDetail({
  pathname,
  onBack,
}: {
  pathname: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <NavLink
        href="/dashboard/projects"
        match="exact"
        currentPathname={pathname}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 self-start",
        )}
        onClick={(event) => {
          event.preventDefault();
          onBack();
        }}
      >
        <ArrowLeft data-icon="inline-start" />
        All projects
      </NavLink>
      <h3 className="text-base font-semibold tracking-tight">Acme website</h3>
      <PagePlaceholder />
    </div>
  );
}

function SimplePage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <PagePlaceholder />
    </div>
  );
}

/** Stands in for page content so the demo reads as a page, without more prose. */
function PagePlaceholder() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      <span className="h-2 w-full rounded-full bg-muted" />
      <span className="h-2 w-4/5 rounded-full bg-muted" />
      <span className="h-2 w-2/3 rounded-full bg-muted" />
    </div>
  );
}
