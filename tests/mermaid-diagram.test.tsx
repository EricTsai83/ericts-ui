// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

function getContentTransform(container: HTMLElement) {
  return container.querySelector<HTMLElement>("[data-mermaid-viewport-content]")?.style.transform;
}

function getTransformScale(container: HTMLElement) {
  const transform = getContentTransform(container) ?? "";
  const match = /scale\(([\d.]+)\)/.exec(transform);
  return match ? Number.parseFloat(match[1]) : null;
}

function stubAnimationFrames() {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  return () => {
    while (frames.length > 0) frames.shift()!(0);
  };
}

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
    const fullscreenButton = within(header!).getByRole("button", { name: "View diagram fullscreen" });
    expect(fullscreenButton).toBeTruthy();
    expect(fullscreenButton.closest('[data-slot="tooltip-trigger"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Diagram information" })).toBeNull();
    expect(screen.getByText("Explicit title").className).not.toContain("uppercase");
    expect(screen.getByText("Explicit title").className).toContain("capitalize");
    expect(screen.getByText("Explicit title").className).toContain("text-xl");
    expect(screen.getByText("Explicit title").className).not.toContain("text-base");
    expect(screen.getByText("Explicit caption").className).toContain("text-sm");
  });

  it("hides the caption when showCaption is false, even when supplied via fence metadata", async () => {
    render(
      <MermaidDiagram
        chart={"flowchart LR\nA --> B"}
        caption="Prop caption"
        meta={'caption="Fence caption"'}
        showCaption={false}
      />,
    );

    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());
    expect(screen.queryByText("Prop caption")).toBeNull();
    expect(screen.queryByText("Fence caption")).toBeNull();
    expect(document.querySelector('[data-slot="mermaid-diagram-caption"]')).toBeNull();
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

  it("does not re-render Mermaid when inline config and callback props change identity", async () => {
    const { rerender } = render(
      <MermaidDiagram
        chart={"flowchart LR\nA --> B"}
        config={{ theme: "forest" }}
        onRenderError={() => {}}
      />,
    );

    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());
    expect(mermaidMocks.render).toHaveBeenCalledTimes(1);

    rerender(
      <MermaidDiagram
        chart={"flowchart LR\nA --> B"}
        config={{ theme: "forest" }}
        onRenderError={() => {}}
      />,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mermaidMocks.render).toHaveBeenCalledTimes(1);
  });

  it("keeps showing the previous diagram while a new chart renders", async () => {
    const { rerender } = render(<MermaidDiagram chart={"flowchart LR\nA --> B"} />);
    await waitFor(() => expect(screen.getByText("Rendered")).toBeTruthy());

    let resolveSecond!: (result: { svg: string }) => void;
    mermaidMocks.render.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSecond = resolve; }),
    );

    rerender(<MermaidDiagram chart={"flowchart LR\nA --> C"} />);

    await waitFor(() => expect(screen.getByText("Loading")).toBeTruthy());
    expect(screen.getByText("Rendered")).toBeTruthy();
    expect(screen.queryByText("Rendering diagram…")).toBeNull();

    await act(async () => {
      resolveSecond({ svg: '<svg viewBox="0 0 100 100"><text>Second</text></svg>' });
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText("Second")).toBeTruthy());
    expect(screen.queryByText("Rendered")).toBeNull();
    expect(screen.queryByText("Loading")).toBeNull();
  });

  it("shows the error state, reports it, and runs the repair flow", async () => {
    mermaidMocks.render.mockRejectedValueOnce(new Error("Parse error on line 2"));
    const onRenderError = vi.fn();
    const onRepair = vi.fn().mockRejectedValueOnce(new Error("Repair backend offline"));

    render(
      <MermaidDiagram
        chart={"flowchart LR\nA --> B"}
        onRenderError={onRenderError}
        onRepair={onRepair}
      />,
    );

    await waitFor(() => expect(screen.getByText("Mermaid diagram could not render.")).toBeTruthy());
    expect(screen.getByText("Parse error on line 2")).toBeTruthy();
    expect(onRenderError).toHaveBeenCalledTimes(1);
    expect(document.querySelector("details code")?.textContent).toBe("flowchart LR\nA --> B");

    fireEvent.click(screen.getByRole("button", { name: "Repair diagram" }));

    await waitFor(() =>
      expect(onRepair).toHaveBeenCalledWith({
        chart: "flowchart LR\nA --> B",
        error: "Parse error on line 2",
      }),
    );
    await waitFor(() => expect(screen.getByText("Repair backend offline")).toBeTruthy());
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

    expect(getContentTransform(container)).toBe("translate(0px, 0px) scale(1.5)");

    act(() => controlsRef.current?.reset());
    expect(getContentTransform(container)).toBe("translate(0px, 0px) scale(1)");
  });

  it("zooms through a cancelable wheel event instead of scrolling the page", () => {
    const flushFrames = stubAnimationFrames();

    const { container } = render(<DiagramViewport>diagram</DiagramViewport>);
    const viewport = container.querySelector<HTMLElement>("[data-mermaid-viewport]")!;
    const wheelIn = new WheelEvent("wheel", { deltaY: -300, bubbles: true, cancelable: true });

    act(() => {
      viewport.dispatchEvent(wheelIn);
      flushFrames();
    });

    expect(wheelIn.defaultPrevented).toBe(true);
    const zoomedScale = getTransformScale(container);
    expect(zoomedScale).not.toBeNull();
    expect(zoomedScale!).toBeGreaterThan(1);

    act(() => {
      viewport.dispatchEvent(new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true }));
      flushFrames();
    });
    expect(getTransformScale(container)!).toBeLessThan(zoomedScale!);
  });

  it("supports keyboard panning, zooming, and reset", () => {
    const { container } = render(<DiagramViewport>diagram</DiagramViewport>);
    const viewport = container.querySelector<HTMLElement>("[data-mermaid-viewport]")!;

    expect(viewport.tabIndex).toBe(0);

    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    expect(getContentTransform(container)).toBe("translate(-40px, 0px) scale(1)");

    fireEvent.keyDown(viewport, { key: "ArrowUp", shiftKey: true });
    expect(getContentTransform(container)).toBe("translate(-40px, 120px) scale(1)");

    fireEvent.keyDown(viewport, { key: "+" });
    expect(getTransformScale(container)).toBe(1.25);

    fireEvent.keyDown(viewport, { key: "0" });
    expect(getContentTransform(container)).toBe("translate(0px, 0px) scale(1)");
  });

  it("pinch-zooms with two pointers", () => {
    const flushFrames = stubAnimationFrames();

    const { container } = render(<DiagramViewport>diagram</DiagramViewport>);
    const viewport = container.querySelector<HTMLElement>("[data-mermaid-viewport]")!;
    viewport.setPointerCapture = vi.fn();
    viewport.releasePointerCapture = vi.fn();
    viewport.hasPointerCapture = vi.fn(() => false);

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 0, clientY: 0, button: 0 });
    fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 0, clientY: 100, button: 0 });
    fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 0, clientY: 200 });
    act(() => flushFrames());

    expect(getTransformScale(container)).toBe(2);

    fireEvent.pointerUp(viewport, { pointerId: 2 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 30, clientY: 10 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });

    const transform = getContentTransform(container)!;
    expect(transform).toContain("translate(30px, 10px)");
  });
});
