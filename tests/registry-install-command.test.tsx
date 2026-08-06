// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { RegistryInstallCommand } from "@/components/registry-install-command";
import { PACKAGE_MANAGER_STORAGE_KEY } from "@/lib/use-package-manager";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("RegistryInstallCommand", () => {
  it("does not expose the server default before storage is ready", () => {
    const markup = renderToString(
      <RegistryInstallCommand name="copy-button" />,
    );

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("invisible");
  });

  it("switches the displayed command by package manager", () => {
    render(<RegistryInstallCommand name="copy-button" />);

    const pnpmTab = screen.getByRole("tab", { name: "pnpm" });

    expect(pnpmTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "npm" }));

    const npmTab = screen.getByRole("tab", { name: "npm" });

    expect(npmTab.getAttribute("aria-selected")).toBe("true");
    expect(window.localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY)).toBe(
      "npm",
    );
    expect(
      screen.getByText("npx shadcn@latest add @ericts/copy-button"),
    ).toBeTruthy();
  });

  it("restores a saved package manager preference", () => {
    window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, "bun");

    render(<RegistryInstallCommand name="copy-button" />);

    expect(
      screen.getByRole("tab", { name: "bun" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      screen.getByText("bunx --bun shadcn@latest add @ericts/copy-button"),
    ).toBeTruthy();
  });

  it("keeps package manager pickers in sync", () => {
    render(
      <>
        <RegistryInstallCommand name="copy-button" />
        <RegistryInstallCommand name="status-button" />
      </>,
    );

    fireEvent.click(screen.getAllByRole("tab", { name: "npm" })[0]);

    expect(
      screen
        .getAllByRole("tab", { name: "npm" })
        .every((tab) => tab.getAttribute("aria-selected") === "true"),
    ).toBe(true);
  });

  it("ignores an invalid saved preference", () => {
    window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, "invalid");

    render(<RegistryInstallCommand name="copy-button" />);

    expect(
      screen.getByRole("tab", { name: "pnpm" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("can render the public registry URL fallback command", () => {
    render(<RegistryInstallCommand name="copy-button" mode="url" />);

    expect(
      screen.getByText(
        "pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json",
      ),
    ).toBeTruthy();
  });
});
