"use client";

import * as React from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from "motion/react";

import { CheckAnimation } from "@/components/ui/check-animation";
import { cn } from "@/lib/utils";

export type OTPStatus = "idle" | "error" | "success";

export interface OTPInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "defaultValue" | "onChange"
  > {
  /** Number of slots. Default 6. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fires once every slot is filled. */
  onComplete?: (value: string) => void;
  /** Optional label rendered above the slots. */
  label?: string;
  /** Helper text shown below the slots while idle. */
  hint?: string;
  /** Message shown below the slots when status is "success". */
  successMessage?: string;
  /** Message shown below the slots when status is "error". */
  errorMessage?: string;
  /** External validation feedback. "error" shakes, "success" draws a check. */
  status?: OTPStatus;
  /** Render dots instead of the typed digits. */
  mask?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessible label for the underlying input. */
  "aria-label"?: string;
  /** Accessible label for the success indicator. */
  successIndicatorLabel?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function OTPInput({
  length = 6,
  value: controlledValue,
  defaultValue = "",
  onChange,
  onComplete,
  label,
  hint,
  successMessage,
  errorMessage,
  status = "idle",
  mask = false,
  disabled = false,
  autoFocus = false,
  "aria-label": ariaLabel = "One-time passcode",
  successIndicatorLabel = "Code verified",
  className,
  ...props
}: OTPInputProps) {
  const slotCount = normalizeLength(length);
  const uid = React.useId();
  const shouldReduceMotion = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const slotsRef = React.useRef<HTMLDivElement>(null);
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

  const commit = React.useCallback(
    (next: string[]) => {
      const wasComplete = visibleSlots.every(isFilled);
      setSlots(next);

      const str = next.join("");
      onChange?.(str);

      // Fire only on the empty -> full transition, not every edit of a full code.
      if (!wasComplete && next.every(isFilled)) {
        onComplete?.(str);
      }
    },
    [onChange, onComplete, visibleSlots],
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
  // Keystrokes go through onKeyDown and paste through onPaste.
  const onChangeNative = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const digits = sanitize(event.target.value, slotCount);
    if (!digits) return;

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
          className="text-sm font-medium text-foreground"
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
          ref={inputRef}
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

        <div ref={slotsRef} className="flex items-center gap-2">
          {Array.from({ length: slotCount }, (_, index) => {
            const char = visibleSlots[index] ?? "";
            const isActive = index === activeIndex;

            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length slot grid, never reordered.
                key={`${uid}-${index}`}
                data-active={isActive}
                data-filled={char !== ""}
                className={cn(
                  "relative grid h-14 w-12 place-items-center overflow-hidden rounded-xl border text-xl font-semibold tabular-nums transition-colors duration-200",
                  showSuccess
                    ? "border-emerald-500/60 text-foreground"
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

        <AnimatePresence>
          {showSuccess ? (
            <motion.span
              initial={
                shouldReduceMotion ? { opacity: 0 } : { scale: 0.7, opacity: 0 }
              }
              animate={{ scale: 1, opacity: 1 }}
              exit={
                shouldReduceMotion ? { opacity: 0 } : { scale: 0.7, opacity: 0 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 500, damping: 28, mass: 0.6 }
              }
              className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2"
            >
              <CheckAnimation
                variant="circle"
                label={successIndicatorLabel}
                className="text-primary"
              />
            </motion.span>
          ) : null}
        </AnimatePresence>
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
