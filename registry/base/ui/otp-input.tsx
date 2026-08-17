"use client";

import * as React from "react";
import {
  AnimatePresence,
  animate,
  motion,
  stagger,
  useReducedMotion,
} from "motion/react";

import { cn } from "@/lib/utils";

export type OTPStatus = "idle" | "error" | "success";

export interface OTPInputProps
  extends Omit<
    React.ComponentProps<"div">,
    "defaultValue" | "onChange"
  > {
  /** Number of slots. Default 6. */
  length?: number;
  value?: string;
  defaultValue?: string;
  /** @deprecated Use `onValueChange`. Kept as an alias. */
  onChange?: (value: string) => void;
  /** Called with the joined value after every edit. */
  onValueChange?: (value: string) => void;
  /** Fires once every slot is filled. */
  onComplete?: (value: string) => void;
  /** Optional label rendered above the slots. */
  label?: string;
  /** Helper text shown below the slots while idle. */
  hint?: string;
  /**
   * Message shown below the slots when status is "success".
   *
   * Success is otherwise carried by a colour change and a motion cue, and
   * motion is the first thing `prefers-reduced-motion` removes. This string is
   * what is left, and it is what the live region announces — pass it whenever
   * the field can reach "success".
   */
  successMessage?: string;
  /** Message shown below the slots when status is "error". */
  errorMessage?: string;
  /** External validation feedback. "error" shakes, "success" runs the wave. */
  status?: OTPStatus;
  /** Render dots instead of the typed digits. */
  mask?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /**
   * Ref to the underlying (visually hidden) input. `ref` points at the root
   * element, which is not focusable — use this to focus the field
   * programmatically, e.g. after a "resend code" action.
   */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Accessible label for the underlying input. */
  "aria-label"?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Success wave. The first slot answers immediately, so the perceived response
// is instant however long the tail runs.
//
// The lift is what the label spacing below is sized against: a slot travels
// this far toward the label at the peak, so `gap-2` plus the label's own
// `mb-2` keeps a hair of clearance there. Raising it means raising that too.
const SUCCESS_LIFT = -10;
const SUCCESS_SCALE = 1.04;
const SUCCESS_DURATION = 0.46;
const SUCCESS_STAGGER = 0.04;

// A toss, not two moves glued together. The apex sits before the midpoint, so
// the slot leaves quickly and takes its time coming down, and each half gets
// the curve that half actually needs: one easing across `[0, lift, 0]` applies
// itself to both segments, which snaps out of the apex as hard as it snapped
// into it and reads as a mechanism rather than a hop.
const SUCCESS_APEX = 0.36;
// Decelerating into the peak. Gentler than EASE_OUT, which is near-expo and
// arrives so early that the slot hangs at the top doing nothing.
const SUCCESS_RISE_EASE = [0.22, 0.61, 0.36, 1] as const;
// Accelerating out of the peak and landing soft — the part an ease-out cannot
// express, because it has already spent its speed.
const SUCCESS_FALL_EASE = [0.4, 0, 0.2, 1] as const;

export function OTPInput({
  length = 6,
  value: controlledValue,
  defaultValue = "",
  onChange,
  onValueChange,
  onComplete,
  label,
  hint,
  successMessage,
  errorMessage,
  status = "idle",
  mask = false,
  disabled = false,
  autoFocus = false,
  inputRef: consumerInputRef,
  "aria-label": ariaLabel = "One-time passcode",
  className,
  ...props
}: OTPInputProps) {
  const slotCount = normalizeLength(length);
  const uid = React.useId();
  const shouldReduceMotion = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const slotsRef = React.useRef<HTMLDivElement>(null);
  // The input drives every interaction internally, so the consumer's ref is
  // merged in rather than replacing it.
  const setInputRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(consumerInputRef, node);
    },
    [consumerInputRef],
  );
  const controlled = controlledValue !== undefined;

  // Source of truth is a fixed-length array, so a cleared middle slot stays an
  // in-place hole instead of collapsing later digits to the left.
  const [slots, setSlots] = React.useState<string[]>(() =>
    toSlots(controlled ? controlledValue : defaultValue, slotCount),
  );
  const [focused, setFocused] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const stateSlots = React.useMemo(
    () => Array.from({ length: slotCount }, (_, index) => slots[index] ?? ""),
    [slotCount, slots],
  );
  const stateJoined = stateSlots.join("");
  const controlledJoined = controlled
    ? sanitize(controlledValue, slotCount)
    : undefined;
  const hasControlledOverride =
    controlledJoined !== undefined && controlledJoined !== stateJoined;
  const visibleSlots = hasControlledOverride
    ? toSlots(controlledJoined, slotCount)
    : stateSlots;
  const complete = visibleSlots.every(isFilled);
  const activeSlot = Math.min(
    hasControlledOverride ? (controlledJoined ?? "").length : active,
    slotCount - 1,
  );

  // Sync internal state when a controlled parent changes `value` from outside
  // (e.g. clearing to "" after a failed verification). Without this, `active`
  // stays pinned and caret navigation is dead until the next digit re-syncs.
  const [prevControlledJoined, setPrevControlledJoined] =
    React.useState(controlledJoined);

  if (controlled && controlledJoined !== prevControlledJoined) {
    setPrevControlledJoined(controlledJoined);

    if (controlledJoined !== stateJoined) {
      setSlots(toSlots(controlledJoined, slotCount));
      setActive(Math.min((controlledJoined ?? "").length, slotCount - 1));
    }
  }

  const commit = React.useCallback(
    (next: string[]) => {
      const wasComplete = visibleSlots.every(isFilled);
      setSlots(next);

      const str = next.join("");
      onValueChange?.(str);
      onChange?.(str);

      // Fire only on the empty -> full transition, not every edit of a full code.
      if (!wasComplete && next.every(isFilled)) {
        onComplete?.(str);
      }
    },
    [onChange, onComplete, onValueChange, visibleSlots],
  );

  const clearSlot = React.useCallback(
    (index: number) => {
      const next = [...visibleSlots];
      next[index] = "";
      commit(next);
    },
    [commit, visibleSlots],
  );

  const slotFromClientX = React.useCallback(
    (clientX: number) => {
      const elements = slotsRef.current?.children;
      if (!elements) return 0;

      for (let index = 0; index < elements.length; index++) {
        if (clientX < elements[index].getBoundingClientRect().right) {
          return index;
        }
      }

      return slotCount - 1;
    },
    [slotCount],
  );

  // Single insertion path: one digit overwrites the active slot and advances; a
  // multi-digit chunk (paste / SMS autofill) fills forward from the active slot.
  const insert = React.useCallback(
    (raw: string, from = activeSlot) => {
      const digits = raw.replace(/\D/g, "");
      if (!digits) return;

      const next = [...visibleSlots];
      let index = from;

      for (const digit of digits) {
        if (index >= slotCount) break;
        next[index] = digit;
        index++;
      }

      commit(next);
      setActive(Math.min(index, slotCount - 1));
    },
    [activeSlot, commit, slotCount, visibleSlots],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key;

    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      insert(key);
    } else if (key === "Backspace") {
      event.preventDefault();

      // A filled slot clears in place; an empty slot steps back and clears there.
      if (visibleSlots[activeSlot]) {
        clearSlot(activeSlot);
      } else if (activeSlot > 0) {
        clearSlot(activeSlot - 1);
        setActive(activeSlot - 1);
      }
    } else if (key === "Delete") {
      event.preventDefault();
      clearSlot(activeSlot);
    } else if (key === "ArrowLeft") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (key === "ArrowRight") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, slotCount - 1));
    } else if (key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (key === "End") {
      event.preventDefault();
      setActive(slotCount - 1);
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // preventDefault suppresses duplicate native insertion; this path owns paste.
    event.preventDefault();
    insert(event.clipboardData.getData("text"), activeSlot);
  };

  // Autofill path: SMS one-time-code arrives as a whole value in one shot.
  // Physical keystrokes go through onKeyDown and paste through onPaste.
  const onChangeNative = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const digits = sanitize(event.target.value, slotCount);
    if (!digits) return;

    // Android soft keyboards report keydown as "Unidentified", so single
    // digits land here instead of onKeyDown. Treat them as normal typing at
    // the active slot; only multi-digit values are whole-code autofill.
    if (digits.length === 1) {
      insert(digits);
      return;
    }

    commit(toSlots(digits, slotCount));
    setActive(Math.min(digits.length, slotCount - 1));
  };

  // Error shake is imperative so it replays on every transition into "error".
  React.useEffect(() => {
    if (status !== "error" || shouldReduceMotion || !slotsRef.current) return;

    animate(
      slotsRef.current,
      { x: [0, -5, 5, -3, 3, -1, 0] },
      { duration: 0.45, ease: EASE_OUT },
    );
  }, [shouldReduceMotion, status]);

  // The success counterpart, and deliberately the shake's opposite in the same
  // vocabulary: the row refuses as one body on x, and accepts one slot at a
  // time on y, replaying the left-to-right order the code was entered in.
  //
  // Imperative for the same reason the shake is, and aimed at the slot boxes
  // rather than the digits inside them: those are Motion components already
  // driving `y` for their own entrance, and two owners of one property is a
  // fight rather than an animation.
  React.useEffect(() => {
    if (status !== "success" || shouldReduceMotion || !slotsRef.current) return;

    animate(
      Array.from(slotsRef.current.children),
      // The scale is what keeps it from reading as a rigid box on a rail. 4% of
      // a 48px slot is barely two pixels, but a hop that deforms at all is a
      // hop rather than a translation.
      { y: [0, SUCCESS_LIFT, 0], scale: [1, SUCCESS_SCALE, 1] },
      {
        duration: SUCCESS_DURATION,
        times: [0, SUCCESS_APEX, 1],
        ease: [SUCCESS_RISE_EASE, SUCCESS_FALL_EASE],
        delay: stagger(SUCCESS_STAGGER),
      },
    );
  }, [shouldReduceMotion, status]);

  const showSuccess = status === "success";
  const activeIndex = focused && !complete ? activeSlot : -1;
  const message = showSuccess
    ? successMessage
    : status === "error"
      ? errorMessage
      : hint;
  const hasMessageSlot = Boolean(hint || successMessage || errorMessage);
  const messageId = hasMessageSlot ? `${uid}-message` : undefined;

  return (
    <div
      data-slot="otp-input"
      className={cn("inline-flex flex-col gap-2", className)}
      {...props}
    >
      {label ? (
        <label
          htmlFor={`${uid}-input`}
          // `mb-2` on top of the container's `gap-2`. The slots rise into this
          // space on success, and 8px alone left the digits all but touching
          // the label at the peak. Only the gap above needs it — the wave
          // moves away from the message row below.
          className="mb-2 text-sm font-medium text-foreground"
        >
          {label}
        </label>
      ) : null}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: focus proxy for the real input below. */}
      <div
        className="relative inline-flex w-max"
        onMouseDown={(event) => {
          if (disabled) return;

          // Suppress the native click caret; we drive the active slot ourselves.
          event.preventDefault();

          const firstEmpty = visibleSlots.indexOf("");
          const cap = firstEmpty === -1 ? slotCount - 1 : firstEmpty;
          setActive(Math.min(slotFromClientX(event.clientX), cap));
          inputRef.current?.focus();
        }}
      >
        <input
          ref={setInputRef}
          id={`${uid}-input`}
          inputMode="numeric"
          autoComplete="one-time-code"
          // biome-ignore lint/a11y/noAutofocus: opt-in via prop for OTP-first screens.
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={messageId}
          aria-invalid={status === "error"}
          value=""
          maxLength={slotCount}
          onKeyDown={onKeyDown}
          onChange={onChangeNative}
          onPaste={onPaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-20 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
        />

        {/* Six slots at the desktop size need 328px, which no phone has left
            over once a page and a card have taken their padding. The narrow
            step drops that to 270px; the tap target is the whole row, so the
            shorter slots cost nothing in reachability. */}
        <div ref={slotsRef} className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: slotCount }, (_, index) => {
            const char = visibleSlots[index] ?? "";
            const isActive = index === activeIndex;

            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length slot grid, never reordered.
                key={`${uid}-${index}`}
                data-active={isActive}
                data-filled={char !== ""}
                // The border flip rides the same stagger as the lift, so the
                // two read as one gesture per slot rather than a wave passing
                // over six slots that all turned green at once.
                style={
                  showSuccess && !shouldReduceMotion
                    ? { transitionDelay: `${index * SUCCESS_STAGGER * 1000}ms` }
                    : undefined
                }
                className={cn(
                  "relative grid h-12 w-10 place-items-center overflow-hidden rounded-xl border text-lg font-semibold tabular-nums transition-colors duration-200 sm:h-14 sm:w-12 sm:text-xl",
                  showSuccess
                    ? "border-ericts-success/60 text-foreground"
                    : status === "error"
                      ? "border-destructive/60 text-foreground"
                      : char
                        ? "border-border text-foreground"
                        : "border-border text-muted-foreground",
                  isActive &&
                    !showSuccess &&
                    status !== "error" &&
                    "border-foreground",
                  disabled && "opacity-50",
                )}
              >
                {isActive && !showSuccess ? (
                  <motion.span
                    aria-hidden="true"
                    animate={
                      shouldReduceMotion ? undefined : { opacity: [1, 1, 0, 0] }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }
                    }
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-6 w-px -translate-y-1/2 bg-foreground",
                      char ? "right-3" : "left-1/2 -translate-x-1/2",
                    )}
                  />
                ) : null}

                <AnimatePresence initial={false}>
                  {char ? (
                    <motion.span
                      key={char}
                      initial={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { y: 14, opacity: 0, filter: "blur(4px)" }
                      }
                      animate={
                        shouldReduceMotion
                          ? { opacity: 1 }
                          : { y: 0, opacity: 1, filter: "blur(0px)" }
                      }
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { y: -14, opacity: 0, filter: "blur(4px)" }
                      }
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { duration: 0.22, ease: EASE_OUT }
                      }
                      className="absolute inset-0 grid place-items-center leading-none"
                    >
                      {mask ? "•" : char}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {hasMessageSlot ? (
        <p
          id={messageId}
          aria-live="polite"
          aria-hidden={message ? undefined : true}
          className={cn(
            "min-h-5 text-sm",
            showSuccess
              ? "text-muted-foreground"
              : status === "error"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          {message ?? "\u00a0"}
        </p>
      ) : null}
    </div>
  );
}

function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") {
    ref(node);
  } else if (ref) {
    (ref as React.RefObject<T | null>).current = node;
  }
}

function isFilled(value: string) {
  return value !== "";
}

function normalizeLength(length: number) {
  if (!Number.isFinite(length)) return 6;

  return Math.max(1, Math.floor(length));
}

function sanitize(raw: string | undefined, length: number) {
  return (raw ?? "").replace(/\D/g, "").slice(0, length);
}

function toSlots(raw: string | undefined, length: number) {
  const digits = sanitize(raw, length);

  return Array.from({ length }, (_, index) => digits[index] ?? "");
}
