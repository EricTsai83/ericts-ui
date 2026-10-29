// @vitest-environment jsdom
import { useLayoutEffect } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { useRegistryBrowseOrder } from "@/lib/use-registry-browse-order";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

function Order() {
  return <output>{useRegistryBrowseOrder() ?? "none"}</output>;
}

// Like Next's router: the URL is written only after the new route has rendered.
function UrlWriter({ href }: { href: string }) {
  useLayoutEffect(() => {
    window.history.pushState(null, "", href);
  }, [href]);
  return null;
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

it("follows client navigations in a component that stays mounted, like a layout", () => {
  window.history.replaceState(null, "", "/components/a#order=category");
  navigation.pathname = "/components/a";
  const view = render(
    <>
      <Order />
      <UrlWriter href="/components/a#order=category" />
    </>,
  );
  expect(screen.getByRole("status").textContent).toBe("category");

  navigation.pathname = "/components/b";
  view.rerender(
    <>
      <Order />
      <UrlWriter href="/components/b#order=alphabetical" />
    </>,
  );
  expect(screen.getByRole("status").textContent).toBe("alphabetical");
});
