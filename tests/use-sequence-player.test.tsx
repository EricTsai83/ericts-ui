// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useSequencePlayer,
  type SequenceScript,
} from "@/registry/base/hooks/use-sequence-player";

// Sequence 0 plays two beats, sequence 1 plays one, so a full pass through both
// is short enough to assert beat by beat.
const SCRIPTS: readonly SequenceScript[] = [
  { steps: 2, stepMs: 100 },
  { steps: 1, stepMs: 100 },
];
const LEAD_IN_MS = 50;

function stubMatchMedia(prefersReducedMotion: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: prefersReducedMotion,
      media,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  );
}

function Harness() {
  const { containerProps, activeIndex, stepsFired, runs, isPlaying, takeOver } =
    useSequencePlayer({ sequences: SCRIPTS, leadInMs: LEAD_IN_MS });

  return (
    <div {...containerProps}>
      <output data-testid="active">{activeIndex}</output>
      <output data-testid="steps">{stepsFired}</output>
      <output data-testid="runs">{runs.join(",")}</output>
      <output data-testid="playing">{String(isPlaying)}</output>
      <button type="button" onClick={() => takeOver(1)}>
        take over
      </button>
    </div>
  );
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  stubMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * jsdom ships no IntersectionObserver, which the hook treats as "assume visible"
 * — the same fallback a consumer gets on an old browser. That is what makes these
 * timings assertable without faking an observer.
 */
describe("useSequencePlayer", () => {
  it("holds every sequence on its poster frame until the lead-in elapses", () => {
    render(<Harness />);

    expect(screen.getByTestId("runs").textContent).toBe("");
    expect(screen.getByTestId("steps").textContent).toBe("0");

    advance(LEAD_IN_MS - 1);
    expect(screen.getByTestId("runs").textContent).toBe("");

    advance(1);
    expect(screen.getByTestId("runs").textContent).toBe("1,0");
  });

  it("plays a sequence's beats, then hands the spotlight to the next", () => {
    render(<Harness />);

    advance(LEAD_IN_MS);
    expect(screen.getByTestId("active").textContent).toBe("0");
    expect(screen.getByTestId("steps").textContent).toBe("1");

    // Second beat of sequence 0 — still the same sequence.
    advance(100);
    expect(screen.getByTestId("active").textContent).toBe("0");
    expect(screen.getByTestId("runs").textContent).toBe("2,0");

    // Beats exhausted, so the spotlight moves on and fires sequence 1.
    advance(100);
    expect(screen.getByTestId("active").textContent).toBe("1");
    expect(screen.getByTestId("runs").textContent).toBe("2,1");

    // Sequence 1 has a single beat, so it wraps back to sequence 0.
    advance(100);
    expect(screen.getByTestId("active").textContent).toBe("0");
    expect(screen.getByTestId("runs").textContent).toBe("3,1");
  });

  it("never starts under reduced motion, leaving poster frames in place", () => {
    stubMatchMedia(true);
    render(<Harness />);

    expect(screen.getByTestId("playing").textContent).toBe("false");

    advance(LEAD_IN_MS + 500);
    expect(screen.getByTestId("runs").textContent).toBe("");
  });

  it("pauses while focus is inside and resumes once focus leaves", () => {
    render(<Harness />);

    advance(LEAD_IN_MS);
    const runsAfterFirstBeat = screen.getByTestId("runs").textContent;

    fireEvent.focus(screen.getByRole("button"));
    expect(screen.getByTestId("playing").textContent).toBe("false");

    advance(1000);
    expect(screen.getByTestId("runs").textContent).toBe(runsAfterFirstBeat);

    // relatedTarget outside the container is what counts as focus leaving.
    fireEvent.blur(screen.getByRole("button"), {
      relatedTarget: document.body,
    });
    expect(screen.getByTestId("playing").textContent).toBe("true");

    advance(100);
    expect(screen.getByTestId("runs").textContent).not.toBe(
      runsAfterFirstBeat,
    );
  });

  it("keeps replaying the taken sequence instead of advancing", () => {
    render(<Harness />);

    act(() => {
      screen.getByRole("button").click();
    });

    expect(screen.getByTestId("active").textContent).toBe("1");

    // Sequence 1 has one beat; left to itself the player would advance to 0.
    advance(100);
    expect(screen.getByTestId("active").textContent).toBe("1");

    advance(100);
    expect(screen.getByTestId("active").textContent).toBe("1");
  });

  it("releases the spotlight when the pointer leaves the container", () => {
    const { container } = render(<Harness />);
    const wall = container.firstElementChild as HTMLElement;

    act(() => {
      screen.getByRole("button").click();
    });
    expect(screen.getByTestId("active").textContent).toBe("1");

    fireEvent.pointerLeave(wall);

    // Back on auto, so sequence 1's single beat hands off to sequence 0.
    advance(100);
    expect(screen.getByTestId("active").textContent).toBe("0");
  });
});
