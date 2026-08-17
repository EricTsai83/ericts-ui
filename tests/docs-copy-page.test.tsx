// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DocsCopyPage } from "@/components/docs-copy-page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DocsCopyPage", () => {
  it("fetches the raw Markdown on demand and confirms the successful copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => "# Installation" });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DocsCopyPage
        markdownPath="/docs/installation.md"
        url="https://ui.ericts.com/docs/installation"
      />,
    );

    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Copy Page" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/docs/installation.md");
      expect(writeText).toHaveBeenCalledWith("# Installation");
      expect(
        screen
          .getByRole("button", { name: "Copy Page" })
          .getAttribute("data-copied"),
      ).toBe("true");
    });

    expect(screen.getByRole("status").textContent).toBe(
      "Page copied to clipboard",
    );
  });

  it("offers the Markdown and AI page actions", async () => {
    render(
      <DocsCopyPage
        markdownPath="/docs/installation.md"
        url="https://ui.ericts.com/docs/installation"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "More page actions" }),
    );

    const markdownLink = await screen.findByRole("menuitem", {
      name: "View as Markdown",
    });

    expect(markdownLink.getAttribute("href")).toBe("/docs/installation.md");
    expect(
      screen
        .getByRole("menuitem", { name: "Open in v0" })
        .getAttribute("href"),
    ).toContain("https://v0.dev/chat?q=");
    expect(
      screen.getByRole("menuitem", { name: "Open in ChatGPT" }),
    ).toBeDefined();
    expect(
      screen.getByRole("menuitem", { name: "Open in Claude" }),
    ).toBeDefined();
  });
});
