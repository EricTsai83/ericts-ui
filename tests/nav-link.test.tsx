// @vitest-environment jsdom
import { createRef, type ComponentProps } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import NavLinkPreview from "@/components/previews/nav-link";
import {
  NavLink,
  NavLinkScript,
  isPathActive,
} from "@/registry/base/ui/nav-link";

const navigation = vi.hoisted(() => ({ pathname: "/", suspend: false }));
const linkStatus = vi.hoisted(() => ({ pending: false }));

vi.mock("next/navigation", () => ({
  usePathname: () => {
    if (navigation.suspend) {
      throw new Promise(() => undefined);
    }

    return navigation.pathname;
  },
}));

vi.mock("next/link", async () => {
  const { createElement } = await import("react");

  type MockLinkProps = Omit<ComponentProps<"a">, "href"> & {
    href: string | { pathname?: string | null };
  };

  return {
    default: ({ href, ...props }: MockLinkProps) =>
      createElement("a", {
        ...props,
        href: typeof href === "string" ? href : (href.pathname ?? ""),
      }),
    useLinkStatus: () => linkStatus,
  };
});

afterEach(() => {
  cleanup();
  navigation.pathname = "/";
  navigation.suspend = false;
  linkStatus.pending = false;
  vi.useRealTimers();
});

describe("isPathActive", () => {
  it("matches exactly by default", () => {
    expect(isPathActive("/components", "/components")).toBe(true);
    expect(isPathActive("/components/button", "/components")).toBe(false);
  });

  it("matches descendants under prefix without matching sibling prefixes", () => {
    expect(isPathActive("/components/button", "/components", "prefix")).toBe(
      true,
    );
    expect(isPathActive("/components-old", "/components", "prefix")).toBe(false);
  });

  it("always matches the root exactly", () => {
    expect(isPathActive("/", "/", "prefix")).toBe(true);
    expect(isPathActive("/components", "/", "prefix")).toBe(false);
  });

  it("normalizes trailing slashes", () => {
    expect(isPathActive("/components/", "/components")).toBe(true);
    expect(isPathActive("/components/button/", "/components/", "prefix")).toBe(
      true,
    );
  });
});

describe("NavLink", () => {
  it("sets active semantics and resolves render props", () => {
    navigation.pathname = "/components/button";

    render(
      <NavLink
        href="/components?view=grid#items"
        match="prefix"
        className={({ isActive }) => (isActive ? "active" : "inactive")}
      >
        {({ isActive }) => (isActive ? "Current components" : "Components")}
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "Current components" });

    expect(link.getAttribute("aria-current")).toBe("location");
    expect(link.hasAttribute("data-active")).toBe(true);
    expect(link.className).toBe("active");
    expect(link.dataset.navlinkHref).toBe("/components");
    expect(link.dataset.navlinkMatch).toBe("prefix");
  });

  it("defaults to exact, so a section link cannot highlight by accident", () => {
    navigation.pathname = "/components/button";

    render(<NavLink href="/components">Components</NavLink>);

    const link = screen.getByRole("link", { name: "Components" });

    expect(link.hasAttribute("data-active")).toBe(false);
    expect(link.hasAttribute("aria-current")).toBe(false);
    expect(link.dataset.navlinkMatch).toBe("exact");
  });

  it("exposes native pending state to function children", () => {
    linkStatus.pending = true;

    render(
      <NavLink href="/components" currentPathname="/components">
        {({ isActive, isExact, isPending }) =>
          `${isActive}-${isExact}-${isPending}`
        }
      </NavLink>,
    );

    expect(screen.getByRole("link", { name: "true-true-true" })).toBeTruthy();
  });

  it("uses page semantics for exact routes", () => {
    navigation.pathname = "/components";

    render(<NavLink href="/components">Components</NavLink>);

    expect(
      screen.getByRole("link", { name: "Components" }).getAttribute(
        "aria-current",
      ),
    ).toBe("page");
  });

  it("supports a controlled pathname without depending on router state", () => {
    navigation.pathname = "/elsewhere";

    render(
      <NavLink
        href="/components"
        match="prefix"
        currentPathname="/components/button"
      >
        {({ isActive, isExact }) =>
          `${isActive ? "active" : "inactive"}-${isExact ? "exact" : "nested"}`
        }
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "active-nested" });

    expect(link.getAttribute("aria-current")).toBe("location");
  });

  it("keeps a navigable inactive fallback when usePathname suspends", () => {
    navigation.suspend = true;

    render(<NavLink href="/components">Components</NavLink>);

    const link = screen.getByRole("link", { name: "Components" });

    expect(link.getAttribute("href")).toBe("/components");
    expect(link.hasAttribute("data-active")).toBe(false);
    expect(link.hasAttribute("aria-current")).toBe(false);
  });

  it("does not mark hrefs without a route identity as active", () => {
    navigation.pathname = "/";

    for (const [href, label] of [
      ["https://example.com/components", "External"],
      ["//example.com/components", "Protocol relative"],
      ["#features", "Hash"],
      ["?tab=overview", "Query"],
      ["components", "Relative"],
    ]) {
      cleanup();
      render(<NavLink href={href}>{label}</NavLink>);

      const link = screen.getByRole("link", { name: label });

      expect(link.hasAttribute("data-active")).toBe(false);
      expect(link.hasAttribute("aria-current")).toBe(false);
      expect(link.hasAttribute("data-navlink-href")).toBe(false);
    }
  });

  it("hides the first-paint script attributes from controlled links", () => {
    render(
      <NavLink
        href="/components"
        match="prefix"
        currentPathname="/components/button"
      >
        Components
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "Components" });

    expect(link.getAttribute("aria-current")).toBe("location");
    expect(link.hasAttribute("data-navlink-href")).toBe(false);
    expect(link.hasAttribute("data-navlink-match")).toBe(false);
  });

  it("forwards its ref and anchor props", () => {
    const ref = createRef<HTMLAnchorElement>();

    render(
      <NavLink ref={ref} href="/components" target="_blank">
        Components
      </NavLink>,
    );

    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ref.current?.dataset.slot).toBe("nav-link");
    expect(ref.current?.target).toBe("_blank");
  });

  it("renders the optional first-paint script with CSP nonce support", () => {
    const { container } = render(<NavLinkScript nonce="test-nonce" />);
    const script = container.querySelector("script");

    expect(script?.nonce).toBe("test-nonce");
    expect(script?.dataset.slot).toBe("nav-link-script");
    expect(script?.textContent).toContain("data-navlink-href");
    expect(script?.textContent).toContain("aria-current");
  });

  it("strips the configured basePath inside the first-paint script", () => {
    const { container } = render(<NavLinkScript basePath="/app" />);
    const source = container.querySelector("script")?.textContent ?? "";

    expect(source).toContain('normalize("/app")');

    const runScript = new Function("location", "document", source);
    const link = document.createElement("a");
    link.setAttribute("data-navlink-href", "/dashboard");
    link.setAttribute("data-navlink-match", "exact");

    runScript({ pathname: "/app/dashboard" }, {
      querySelectorAll: () => [link],
    });

    expect(link.getAttribute("aria-current")).toBe("page");
  });
});

describe("NavLink preview", () => {
  it("keeps fast routes instant and shows pending only for the slow route", () => {
    vi.useFakeTimers();
    const { container } = render(<NavLinkPreview />);

    const routeLinks = screen.getByRole("navigation", {
      name: "Demo route links",
    });
    const sidebar = screen.getByRole("navigation", {
      name: "Demo workspace navigation",
    });
    const readout = (label: string) =>
      screen.getByText(label).nextElementSibling?.textContent;

    fireEvent.click(within(routeLinks).getByRole("link", { name: "Settings" }));

    expect(screen.getByLabelText("Current demo URL").textContent).toBe(
      "https://app.example.com/dashboard/settings",
    );
    expect(container.querySelectorAll(".lucide-loader-circle")).toHaveLength(0);
    expect(
      within(sidebar)
        .getByRole("link", { name: "Settings" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(readout("active")).toBe("Settings");
    expect(readout("match")).toBe("exact");
    expect(readout("aria-current")).toBe("page");
    expect(readout("pending")).toBe("false");

    fireEvent.click(within(routeLinks).getByRole("link", { name: "Projects" }));

    expect(container.querySelectorAll(".lucide-loader-circle")).toHaveLength(0);
    expect(screen.getByLabelText("Current demo URL").textContent).toBe(
      "https://app.example.com/dashboard/settings",
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(container.querySelectorAll(".lucide-loader-circle")).toHaveLength(2);
    expect(
      within(sidebar)
        .getByRole("link", { name: "Settings" })
        .getAttribute("aria-current"),
    ).toBe("page");
    // The old route stays active while the next one is pending.
    expect(readout("active")).toBe("Settings");
    expect(readout("pending")).toBe("true");

    act(() => {
      vi.advanceTimersByTime(950);
    });

    expect(container.querySelectorAll(".lucide-loader-circle")).toHaveLength(0);
    expect(screen.getByLabelText("Current demo URL").textContent).toBe(
      "https://app.example.com/dashboard/projects",
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: /Acme website/,
      }),
    );

    expect(screen.getByLabelText("Current demo URL").textContent).toBe(
      "https://app.example.com/dashboard/projects/acme",
    );
    expect(
      within(sidebar)
        .getByRole("link", { name: "Projects" })
        .getAttribute("aria-current"),
    ).toBe("location");
    expect(readout("active")).toBe("Projects");
    expect(readout("match")).toBe("prefix");
    expect(readout("aria-current")).toBe("location");
  });
});
