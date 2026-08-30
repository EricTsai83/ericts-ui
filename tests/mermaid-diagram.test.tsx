// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DiagramViewport,
  MermaidDiagram,
  type DiagramViewportControls,
} from "@/registry/base/blocks/mermaid-diagram";

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: mermaidMocks,
}));

beforeEach(() => {
  mermaidMocks.initialize.mockReset();
  mermaidMocks.render.mockReset();
  mermaidMocks.render.mockResolvedValue({
    svg: '<svg viewBox="0 0 100 100"><text>Rendered</text></svg>',
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(
      () =>
        ({
          matches: false,
          media: "(prefers-reduced-motion: reduce)",
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) as MediaQueryList,
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MermaidDiagram", () => {
  it("treats an empty chart as empty instead of loading forever", () => {
    render(<MermaidDiagram chart={"  \n"} />);

    expect(screen.getByText("No Mermaid source to render.")).toBeTruthy();
    expect(mermaidMocks.render).not.toHaveBeenCalled();
  });

  it("serializes rendering with strict, bounded configuration", async () => {
    render(<MermaidDiagram chart="flowchart LR\nA-->B" />);

    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());

    expect(mermaidMocks.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        maxEdges: 500,
        maxTextSize: 50_000,
        securityLevel: "strict",
        startOnLoad: false,
        suppressErrorRendering: true,
      }),
    );
    expect(mermaidMocks.render).toHaveBeenCalledTimes(1);
  });

  it("lets explicit labels override Markdown fence metadata", async () => {
    render(
      <MermaidDiagram
        chart="flowchart LR\nC-->D"
        title="Explicit title"
        caption="Explicit caption"
        classNames={{ title: "text-xl", caption: "text-sm" }}
        meta={'title="Fence title" caption="Fence caption"'}
      />,
    );

    await waitFor(() => expect(screen.getByText("Explicit title")).toBeTruthy());
    expect(screen.queryByText("Fence title")).toBeNull();
    expect(screen.getByText("Explicit caption")).toBeTruthy();

    const header = document.querySelector<HTMLElement>('[data-slot="mermaid-diagram-header"]');
    expect(header).toBeTruthy();
    expect(within(header!).getByRole("button", { name: "View diagram fullscreen" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Diagram information" })).toBeNull();
    expect(screen.getByText("Explicit title").className).not.toContain("uppercase");
    expect(screen.getByText("Explicit title").className).toContain("text-xl");
    expect(screen.getByText("Explicit title").className).not.toContain("text-base");
    expect(screen.getByText("Explicit caption").className).toContain("text-sm");
  });

  it("switches to the supplied responsive source only when its media query changes", async () => {
    let matches = false;
    const listeners = new Set<() => void>();
    const responsiveMedia = {
      get matches() {
        return matches;
      },
      media: "(max-width: 700px)",
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList;
    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) =>
        query === "(max-width: 700px)" ? responsiveMedia : reducedMotionMedia,
      ),
    );

    render(
      <MermaidDiagram
        chart={"flowchart LR\nWide --> Chart"}
        responsiveChart={{
          chart: "flowchart TB\nCompact --> Chart",
          query: "(max-width: 700px)",
        }}
      />,
    );

    await waitFor(() =>
      expect(mermaidMocks.render).toHaveBeenCalledWith(
        expect.any(String),
        "flowchart LR\nWide --> Chart",
      ),
    );

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener());
    });

    await waitFor(() =>
      expect(mermaidMocks.render).toHaveBeenCalledWith(
        expect.any(String),
        "flowchart TB\nCompact --> Chart",
      ),
    );
  });
});

describe("DiagramViewport", () => {
  it("exposes stable controls and clamps rapid zoom updates", () => {
    const controlsRef = createRef<DiagramViewportControls>();
    const { container } = render(
      <DiagramViewport controlsRef={controlsRef} minZoom={1} maxZoom={1.5} zoomStep={0.25}>
        diagram
      </DiagramViewport>,
    );

    act(() => {
      controlsRef.current?.zoomIn();
      controlsRef.current?.zoomIn();
      controlsRef.current?.zoomIn();
    });

    expect(
      container.querySelector<HTMLElement>("[data-mermaid-viewport-content]")?.style.transform,
    ).toBe("translate(0px, 0px) scale(1.5)");

    act(() => controlsRef.current?.reset());
    expect(
      container.querySelector<HTMLElement>("[data-mermaid-viewport-content]")?.style.transform,
    ).toBe("translate(0px, 0px) scale(1)");
  });
});
