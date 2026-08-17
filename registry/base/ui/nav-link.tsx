"use client";

import type { Route } from "next";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Suspense,
  type ComponentProps,
  type ReactNode,
} from "react";

export type NavLinkMatch = "exact" | "prefix";

export type NavLinkActiveProps = {
  isActive: boolean;
  isExact: boolean;
};

export type NavLinkRenderProps = NavLinkActiveProps & {
  isPending: boolean;
};

export type NavLinkProps<T extends string = string> = Omit<
  ComponentProps<typeof Link>,
  "aria-current" | "children" | "className" | "href"
> & {
  /**
   * A typed Next.js route or an absolute URL. When `typedRoutes` is enabled,
   * invalid literal routes are reported by TypeScript.
   */
  href: Route<T> | URL;
  /**
   * Defaults to `exact`, so a link is active only on its own page. Opt into
   * `prefix` for a section link that should stay active on descendant routes.
   * The root route always matches exactly.
   */
  match?: NavLinkMatch;
  /**
   * Overrides `usePathname()`. Useful for previews, tests, rewrites, and
   * routing layers that expose a canonical pathname.
   */
  currentPathname?: string;
  className?:
    | string
    | ((props: NavLinkActiveProps) => string | undefined);
  children?: ReactNode | ((props: NavLinkRenderProps) => ReactNode);
};

/**
 * A Next.js App Router link with active, exact, and pending route state.
 *
 * `className` receives active route state. Function children additionally
 * receive `isPending` because `useLinkStatus()` must run inside the Link.
 */
export function NavLink<T extends string = string>({
  currentPathname,
  ...props
}: NavLinkProps<T>) {
  if (currentPathname !== undefined) {
    return <ResolvedNavLink {...props} pathname={currentPathname} controlled />;
  }

  return (
    <Suspense fallback={<NavLinkShell {...props} state={inactiveState} />}>
      <PathnameNavLink {...props} />
    </Suspense>
  );
}

type PathnameNavLinkProps<T extends string = string> = Omit<
  NavLinkProps<T>,
  "currentPathname"
>;

const inactiveState: NavLinkActiveProps = {
  isActive: false,
  isExact: false,
};

function PathnameNavLink<T extends string>(props: PathnameNavLinkProps<T>) {
  return <ResolvedNavLink {...props} pathname={usePathname()} />;
}

type NavLinkShellProps<T extends string = string> = PathnameNavLinkProps<T> & {
  state: NavLinkActiveProps;
  /** Skips the first-paint script, which cannot know the controlled pathname. */
  controlled?: boolean;
};

function ResolvedNavLink<T extends string>({
  href,
  match = "exact",
  pathname,
  ...props
}: Omit<NavLinkShellProps<T>, "state"> & { pathname: string }) {
  const targetPathname = getHrefPathname(href);
  const isExact = targetPathname
    ? isPathActive(pathname, targetPathname, "exact")
    : false;
  const isActive = targetPathname
    ? isPathActive(pathname, targetPathname, match)
    : false;

  return (
    <NavLinkShell
      {...props}
      href={href}
      match={match}
      state={{ isActive, isExact }}
    />
  );
}

function NavLinkShell<T extends string>({
  href,
  match = "exact",
  state,
  controlled,
  className,
  children,
  ...props
}: NavLinkShellProps<T>) {
  const targetPathname = controlled ? undefined : getHrefPathname(href);

  return (
    <Link
      {...props}
      href={href}
      aria-current={
        state.isActive ? (state.isExact ? "page" : "location") : undefined
      }
      data-slot="nav-link"
      data-active={state.isActive ? "" : undefined}
      data-navlink-href={targetPathname}
      data-navlink-match={targetPathname ? match : undefined}
      suppressHydrationWarning
      className={typeof className === "function" ? className(state) : className}
    >
      {typeof children === "function" ? (
        <NavLinkRenderChildren state={state} render={children} />
      ) : (
        children
      )}
    </Link>
  );
}

function NavLinkRenderChildren({
  state,
  render,
}: {
  state: NavLinkActiveProps;
  render: (props: NavLinkRenderProps) => ReactNode;
}) {
  const { pending } = useLinkStatus();

  return <>{render({ ...state, isPending: pending })}</>;
}

/**
 * Optional first-paint enhancement for CSS that targets `data-active` or
 * `aria-current`. Render it once at the end of the root layout body.
 *
 * Pass `basePath` when the app sets one in `next.config`, because
 * `location.pathname` includes it while `href` does not. Links using
 * `currentPathname` are skipped, since only the app knows that value.
 */
export function NavLinkScript({
  nonce,
  basePath,
}: {
  nonce?: string;
  basePath?: string;
}) {
  return (
    <script
      nonce={nonce}
      data-slot="nav-link-script"
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getNavLinkScript(basePath) }}
    />
  );
}

export function isPathActive(
  pathname: string,
  targetPathname: string,
  match: NavLinkMatch = "exact",
) {
  const current = normalizePathname(pathname);
  const target = normalizePathname(targetPathname);

  if (match === "exact" || target === "/") {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

/**
 * Returns a comparable pathname only for root-relative hrefs. Absolute URLs,
 * protocol-relative hrefs, relative segments, and bare `?`/`#` hrefs have no
 * route identity of their own and are never treated as active.
 */
function getHrefPathname<T extends string>(href: Route<T> | URL) {
  if (href instanceof URL || !href.startsWith("/") || href.startsWith("//")) {
    return undefined;
  }

  return normalizePathname(href);
}

function normalizePathname(pathname: string) {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || "/";

  if (pathOnly === "/") {
    return pathOnly;
  }

  return pathOnly.replace(/\/+$/, "") || "/";
}

function getNavLinkScript(basePath?: string) {
  return `(function(){
  function normalize(value) {
    var path = (value || '/').split(/[?#]/, 1)[0] || '/';
    return path === '/' ? path : path.replace(/\\/+$/, '') || '/';
  }

  var base = normalize(${JSON.stringify(basePath ?? "").replace(/</g, "\\u003c")});
  var pathname = normalize(location.pathname);

  if (base !== '/' && (pathname === base || pathname.indexOf(base + '/') === 0)) {
    pathname = normalize(pathname.slice(base.length));
  }

  document.querySelectorAll('[data-navlink-href]').forEach(function(link) {
    var target = normalize(link.getAttribute('data-navlink-href'));
    var match = link.getAttribute('data-navlink-match') || 'exact';
    var isExact = pathname === target;
    var isActive = match === 'exact' || target === '/'
      ? isExact
      : isExact || pathname.startsWith(target + '/');

    if (isActive) {
      link.setAttribute('data-active', '');
      link.setAttribute('aria-current', isExact ? 'page' : 'location');
    } else {
      link.removeAttribute('data-active');
      link.removeAttribute('aria-current');
    }
  });
})()`;
}
