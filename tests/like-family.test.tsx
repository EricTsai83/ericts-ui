// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

vi.mock("@/registry/base/ui/like.css", () => ({}));
vi.mock("@/registry/base/ui/like-burst.css", () => ({}));

import { Like, type LikeProps } from "@/registry/base/ui/like";
import { LikeBurst, type LikeBurstProps } from "@/registry/base/ui/like-burst";

afterEach(cleanup);

/**
 * `like` and `like-burst` are one control with two effects: the `like` stem
 * names the family, the suffix names the effect. They stay drop-in swaps for
 * each other, so a prop may exist on only one member when its effect alone
 * needs it — today that is Like's `fillOrigin`. Adding a prop to one member
 * means adding it to the other too, or listing it here as effect-specific.
 */
type SharedLikeProps = Omit<LikeProps, "fillOrigin">;

/**
 * Each member owns a heart colour token instead of borrowing `--destructive`,
 * because a like is not an error. Like Burst's token is deliberately its own,
 * a touch pinker than Like's, so the two may differ; Like Button inherits
 * Like's by installing Like.
 */
const colorSources = [
  ["like", "registry/base/ui/like.css", "--like-color", "ericts-like"],
  [
    "like-burst",
    "registry/base/ui/like-burst.css",
    "--like-burst-color",
    "ericts-like-burst",
  ],
] as const;

type RegistryItem = {
  name: string;
  registryDependencies?: string[];
  cssVars?: Record<"light" | "dark", Record<string, string>>;
};

function readRepoFile(file: string) {
  return readFileSync(path.join(process.cwd(), file), "utf8");
}

const members: Array<[string, (props: SharedLikeProps) => ReactElement]> = [
  ["like", (props) => <Like {...props} />],
  ["like-burst", (props) => <LikeBurst {...props} />],
];

describe("like family", () => {
  it("shares one prop API, apart from each effect's own props", () => {
    // Same names — mutual assignability alone would let an optional prop
    // slip onto one member — and the same types behind them.
    expectTypeOf<keyof LikeBurstProps>().toEqualTypeOf<keyof SharedLikeProps>();
    expectTypeOf<LikeBurstProps>().toExtend<SharedLikeProps>();
    expectTypeOf<SharedLikeProps>().toExtend<LikeBurstProps>();
  });

  it.each(members)("%s exposes the shared state contract", (_, renderMember) => {
    const onLikedChange = vi.fn();
    render(
      renderMember({
        likeLabel: "Like post",
        unlikeLabel: "Unlike post",
        onLikedChange,
      }),
    );

    const control = screen.getByRole("button", { name: "Like post" });
    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(control.getAttribute("data-liked")).toBe("false");
    expect(control.hasAttribute("data-icon-only")).toBe(true);

    fireEvent.click(control);

    expect(onLikedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Unlike post" })).toBe(control);
    expect(control.getAttribute("aria-pressed")).toBe("true");
    expect(control.getAttribute("data-liked")).toBe("true");
  });

  it("colours every member from its own token, never --destructive", () => {
    const registry = JSON.parse(readRepoFile("registry.json")) as {
      items: RegistryItem[];
    };
    const byName = new Map(registry.items.map((item) => [item.name, item]));
    const siteTheme = readRepoFile("app/globals.css");

    for (const [name, file, property, token] of colorSources) {
      const css = readRepoFile(file);

      expect(css, `${file} must read its own token`).toContain(
        `${property}: var(--${token});`,
      );
      expect(css, `${file} must not borrow --destructive`).not.toContain(
        "var(--destructive)",
      );

      // Installed with the item in both themes, and rendered by this site
      // with the same value, so the preview shows what the CLI installs.
      for (const theme of ["light", "dark"] as const) {
        const value = byName.get(name)?.cssVars?.[theme]?.[token];

        expect(value, `${name} declares ${token} for ${theme}`).toBeTruthy();
        expect(
          siteTheme.split(`--${token}: ${value};`).length - 1,
          `app/globals.css defines --${token}: ${value} in both themes`,
        ).toBe(2);
      }
    }

    expect(byName.get("like-button")?.registryDependencies).toContain(
      "https://ui.ericts.com/r/like.json",
    );
  });
});
