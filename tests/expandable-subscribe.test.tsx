// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ExpandableSubscribe } from "@/registry/base/ui/expandable-subscribe";

// jsdom verifies behavior; drawing styles use the app's Next/PostCSS pipeline.
vi.mock("@/registry/base/ui/check-mark.css", () => ({}));
vi.mock("@/registry/base/ui/expandable-subscribe.css", () => ({}));

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(),
  })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("focuses the email input, prevents duplicate requests, and confirms completion", async () => {
  let finish: () => void = () => {};
  const subscribe = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
  const ref = createRef<HTMLDivElement>();
  const { container } = render(<ExpandableSubscribe ref={ref} onSubscribe={subscribe} />);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  const input = screen.getByRole("textbox", { name: "Email address" });
  expect(document.activeElement).toBe(input);
  fireEvent.change(input, { target: { value: "hello@example.com" } });
  const form = container.querySelector("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(subscribe).toHaveBeenCalledTimes(1);
  expect(subscribe.mock.calls[0]).toEqual(["hello@example.com", expect.any(AbortSignal)]);
  expect(ref.current?.dataset.state).toBe("loading");
  await act(async () => finish());
  expect(ref.current?.dataset.state).toBe("success");
  expect(screen.getByRole("status").textContent).toBe("You're on the list!");
  expect(container.querySelector('[data-slot="check-mark"]')?.getAttribute("data-variant")).toBe("circle");
});

it("retains the email and restores focus after rejection, then allows retry", async () => {
  const subscribe = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
  const { container } = render(<ExpandableSubscribe onSubscribe={subscribe} defaultValue="hello@example.com" />);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  await act(async () => fireEvent.submit(container.querySelector("form")!));
  expect(screen.getByRole("alert").textContent).toContain("try again");
  expect(document.activeElement).toBe(screen.getByRole("textbox"));
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("hello@example.com");
  await act(async () => fireEvent.submit(container.querySelector("form")!));
  expect(screen.getByRole("status").textContent).toBe("You're on the list!");
});

it("aborts an in-flight request when unmounted", () => {
  let signal: AbortSignal | undefined;
  const { container, unmount } = render(<ExpandableSubscribe onSubscribe={(_email, nextSignal) => {
    signal = nextSignal;
    return new Promise<void>(() => {});
  }} defaultValue="hello@example.com" />);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  fireEvent.submit(container.querySelector("form")!);
  unmount();
  expect(signal?.aborted).toBe(true);
});

it("returns focus on Escape and supports releasing controlled email state", () => {
  const onValueChange = vi.fn();
  const subscribe = vi.fn();
  const { rerender } = render(<ExpandableSubscribe value="controlled@example.com" onValueChange={onValueChange} onSubscribe={subscribe} />);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "new@example.com" } });
  expect(onValueChange).toHaveBeenCalledWith("new@example.com");
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("controlled@example.com");
  rerender(<ExpandableSubscribe onSubscribe={subscribe} />);
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("new@example.com");
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Email me" }));
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
});

it("clears the draft and cancels once on an outside press, even without a focus change", () => {
  const onCancel = vi.fn();
  const onValueChange = vi.fn();
  render(<ExpandableSubscribe onSubscribe={vi.fn()} onCancel={onCancel} onValueChange={onValueChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "draft@example.com" } });
  fireEvent.pointerDown(document.body);
  fireEvent.blur(input, { relatedTarget: null });
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenLastCalledWith("");
  expect(screen.getByRole("button", { name: "Email me" }).getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
});

it("keeps editing when focus moves to submit, and cancels when focus leaves the component", () => {
  const onCancel = vi.fn();
  render(<><ExpandableSubscribe onSubscribe={vi.fn()} onCancel={onCancel} defaultValue="draft@example.com" /><button>Outside</button></>);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  const submit = screen.getByRole("button", { name: "Subscribe" });
  act(() => submit.focus());
  expect(onCancel).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox")).toBeTruthy();
  const outside = screen.getByRole("button", { name: "Outside" });
  act(() => outside.focus());
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(outside);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
});

it("requests clearing controlled email on cancellation", () => {
  const onValueChange = vi.fn();
  render(<ExpandableSubscribe onSubscribe={vi.fn()} value="controlled@example.com" onValueChange={onValueChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  expect(onValueChange).toHaveBeenCalledWith("");
});

it("keeps a pending submission running when focus leaves", async () => {
  let finish: () => void = () => {};
  const onCancel = vi.fn();
  const { container } = render(<><ExpandableSubscribe onCancel={onCancel} defaultValue="hello@example.com" onSubscribe={() => new Promise<void>((resolve) => { finish = resolve; })} /><button>Outside</button></>);
  fireEvent.click(screen.getByRole("button", { name: "Email me" }));
  fireEvent.submit(container.querySelector("form")!);
  act(() => screen.getByRole("button", { name: "Outside" }).focus());
  fireEvent.pointerDown(document.body);
  expect(onCancel).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(screen.getByRole("status").textContent).toBe("You're on the list!");
});
