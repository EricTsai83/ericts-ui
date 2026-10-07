"use client";

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { ArrowUp, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { CheckMark } from "./check-mark";
import "./expandable-subscribe.css";

export type ExpandableSubscribeProps = Omit<
  React.ComponentProps<"div">,
  "children" | "onSubmit" | "onError" | "defaultValue"
> & {
  /** Resolve after saving the email; reject to show the retry state. */
  onSubscribe: (email: string, signal: AbortSignal) => void | Promise<void>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (email: string) => void;
  /** Called when editing is cancelled by outside press, focus leaving, or Escape. */
  onCancel?: () => void;
  label?: string;
  placeholder?: string;
  inputLabel?: string;
  submitLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  disabled?: boolean;
  /** Expanded width in pixels, capped by the available container width. */
  expandedWidth?: number;
  transition?: Transition;
};

/** A compact email form. Success remains visible until the component is remounted. */
export function ExpandableSubscribe({
  onSubscribe,
  value,
  defaultValue = "",
  onValueChange,
  onCancel,
  label = "Email me",
  placeholder = "Your email",
  inputLabel = "Email address",
  submitLabel = "Subscribe",
  loadingLabel = "Subscribing…",
  successLabel = "You're on the list!",
  errorLabel = "Something went wrong. Please try again.",
  disabled = false,
  expandedWidth = 320,
  transition = { type: "spring", duration: 0.3, bounce: 0 },
  className,
  style,
  ref,
  onBlur,
  ...props
}: ExpandableSubscribeProps) {
  const [state, setState] = React.useState<"closed" | "editing" | "loading" | "success">("closed");
  const [localValue, setLocalValue] = React.useState(defaultValue);
  const [failed, setFailed] = React.useState(false);
  const email = value ?? localValue;
  const reduceMotion = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const requestRef = React.useRef<AbortController | null>(null);
  const cancelledRef = React.useRef(false);
  const restoreTriggerFocusRef = React.useRef(false);
  const errorId = React.useId();

  React.useEffect(() => () => requestRef.current?.abort(), []);

  React.useEffect(() => {
    if (state === "editing") {
      cancelledRef.current = false;
      inputRef.current?.focus();
    } else if (state === "closed" && restoreTriggerFocusRef.current) {
      restoreTriggerFocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [state]);

  const cancel = React.useCallback((restoreFocus = false) => {
    if (state !== "editing" || cancelledRef.current) return;
    // An outside pointer press can also cause blur in the same event cycle.
    cancelledRef.current = true;
    restoreTriggerFocusRef.current = restoreFocus;
    setLocalValue("");
    setFailed(false);
    setState("closed");
    onValueChange?.("");
    onCancel?.();
  }, [state, onValueChange, onCancel]);

  React.useEffect(() => {
    if (state !== "editing") return;
    const document = rootRef.current?.ownerDocument;
    const handleOutsidePress = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !event.composedPath().includes(root)) cancel();
    };
    document?.addEventListener("pointerdown", handleOutsidePress, true);
    return () => document?.removeEventListener("pointerdown", handleOutsidePress, true);
  }, [state, cancel]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || state !== "editing" || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setFailed(false);
    setState("loading");
    rootRef.current?.focus();
    try {
      await onSubscribe(email.trim(), controller.signal);
      if (!controller.signal.aborted) setState("success");
    } catch {
      if (!controller.signal.aborted) {
        setFailed(true);
        setState("editing");
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  const editing = state === "editing";
  const expanded = state !== "closed";
  const status = state === "loading" || state === "success";
  const fade = { duration: reduceMotion ? 0 : 0.15 };

  return (
    <div className={cn("relative max-w-full outline-none", className)} style={style} {...props}
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      tabIndex={-1}
      data-slot="expandable-subscribe"
      data-state={state}
      aria-busy={state === "loading"}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) cancel();
      }}
    >
      <motion.div
        layout={reduceMotion ? false : true}
        transition={transition}
        className="relative h-12 max-w-full overflow-hidden rounded-xl border border-input bg-secondary text-secondary-foreground"
        style={{ width: expanded ? expandedWidth : "max-content" }}
      >
        <motion.div layout="position" className="h-full" animate={{ opacity: expanded ? 0 : 1 }} transition={fade} inert={expanded}>
          <Button ref={triggerRef} type="button" variant="secondary" disabled={disabled}
            aria-expanded={expanded} onClick={() => setState("editing")}
            className="h-full rounded-xl px-5"
          >{label}</Button>
        </motion.div>

        <motion.form onSubmit={submit}
          className="absolute inset-0"
          animate={{ opacity: editing ? 1 : 0 }} transition={fade} inert={!editing}
          aria-hidden={!editing}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancel(true);
            }
          }}
        >
          <InputGroup className="h-full rounded-xl border-0">
            <InputGroupInput ref={inputRef} type="email" required autoComplete="email"
              name="email" aria-label={inputLabel} placeholder={placeholder}
              value={email} disabled={disabled || !editing}
              aria-describedby={failed ? errorId : undefined}
              onChange={(event) => {
                setLocalValue(event.target.value);
                onValueChange?.(event.target.value);
                setFailed(false);
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="secondary" size="icon-sm"
                aria-label={submitLabel} disabled={disabled || !editing}>
                <ArrowUp aria-hidden />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </motion.form>

        <motion.div aria-hidden className="pointer-events-none absolute inset-0 origin-right bg-muted"
          initial={false}
          animate={{ transform: status ? "scaleX(1)" : "scaleX(0)", opacity: status ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : transition}
        />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm"
          animate={{ opacity: status ? 1 : 0 }} transition={fade}>
          {state === "loading" ? (
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
          ) : state === "success" ? (
            <div data-slot="expandable-subscribe-confirmation" className="expandable-subscribe-confirmation flex min-w-0 items-center gap-2.5 px-4">
              <CheckMark variant="circle" size="md" strokeWidth={1.5} />
              <span data-slot="expandable-subscribe-success-label" className="expandable-subscribe-success-label truncate">{successLabel}</span>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
      <span role="status" className="sr-only">
        {state === "loading" ? loadingLabel : state === "success" ? successLabel : ""}
      </span>
      {failed && <p id={errorId} role="alert" className="absolute top-full mt-2 w-full text-xs text-destructive">{errorLabel}</p>}
    </div>
  );
}
