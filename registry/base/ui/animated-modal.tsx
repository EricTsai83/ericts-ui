"use client";

import * as React from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";

import { cn } from "@/lib/utils";

export type AnimatedModalItem = {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  image: string;
  imageAlt?: string;
  actionLabel?: string;
};

export type AnimatedModalProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "onChange" | "value"
> & {
  items: readonly AnimatedModalItem[];
  value?: AnimatedModalItem | null;
  defaultValue?: AnimatedModalItem | null;
  onValueChange?: (item: AnimatedModalItem | null) => void;
  onAction?: (item: AnimatedModalItem) => void;
  actionLabel?: string;
  modalLabel?: string;
  listClassName?: string;
  itemClassName?: string;
};

const actionButtonClassName =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-transparent bg-primary bg-clip-padding px-2.5 pt-px text-[0.8rem] leading-[1.4285714286] font-medium whitespace-nowrap text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function AnimatedModal({
  items,
  value,
  defaultValue = null,
  onValueChange,
  onAction,
  actionLabel = "Open",
  modalLabel = "Item details",
  className,
  listClassName,
  itemClassName,
  ...props
}: AnimatedModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const reactId = React.useId();
  const titleId = `${reactId}-title`;
  const descriptionId = `${reactId}-description`;
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);
  const imageDecodePromises = React.useRef(new Map<string, Promise<void>>());
  const decodedImages = React.useRef(new Set<string>());
  const openRequestId = React.useRef(0);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState<AnimatedModalItem | null>(defaultValue);

  const activeItem = isControlled ? value : uncontrolledValue;

  const setActiveItem = React.useCallback(
    (nextItem: AnimatedModalItem | null) => {
      if (!isControlled) {
        setUncontrolledValue(nextItem);
      }

      onValueChange?.(nextItem);
    },
    [isControlled, onValueChange],
  );

  const decodeImage = React.useCallback((src: string) => {
    return new Promise<void>((resolve) => {
      const image = new Image();

      image.decoding = "sync";
      image.onload = () => {
        if (typeof image.decode === "function") {
          image.decode().then(resolve, resolve);
        } else {
          resolve();
        }
      };
      image.onerror = () => resolve();
      image.src = src;
    });
  }, []);

  const prepareImage = React.useCallback(
    (src: string) => {
      if (decodedImages.current.has(src)) {
        return Promise.resolve();
      }

      const cachedPromise = imageDecodePromises.current.get(src);

      if (cachedPromise) {
        return cachedPromise;
      }

      const promise = decodeImage(src).then(() => {
        decodedImages.current.add(src);
      });

      imageDecodePromises.current.set(src, promise);

      return promise;
    },
    [decodeImage],
  );

  const closeActiveItem = React.useCallback(() => {
    openRequestId.current += 1;
    setActiveItem(null);
  }, [setActiveItem]);

  const handleAction = React.useCallback(
    (item: AnimatedModalItem) => {
      onAction?.(item);
      closeActiveItem();
    },
    [closeActiveItem, onAction],
  );

  const openItem = React.useCallback(
    async (item: AnimatedModalItem) => {
      const requestId = openRequestId.current + 1;

      openRequestId.current = requestId;
      await prepareImage(item.image);

      if (openRequestId.current === requestId) {
        setActiveItem(item);
      }
    },
    [prepareImage, setActiveItem],
  );

  React.useEffect(() => {
    const decodePromises = imageDecodePromises.current;

    items.forEach((item) => {
      void prepareImage(item.image);
    });

    return () => {
      decodePromises.clear();
    };
  }, [items, prepareImage]);

  React.useEffect(() => {
    if (!activeItem) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeActiveItem();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          [
            "button:not([disabled])",
            "a[href]",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "[tabindex]:not([tabindex='-1'])",
          ].join(","),
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!activeElement || !dialog.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [activeItem, closeActiveItem]);

  const layoutTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ type: "spring", duration: 0.32, bounce: 0 } as const);
  const fadeTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ duration: 0.2, ease: [0.215, 0.61, 0.355, 1] } as const);

  return (
    <div
      data-slot="animated-modal"
      className={cn(
        "relative mx-auto flex w-full items-center justify-center",
        className,
      )}
      {...props}
    >
      <LayoutGroup id={reactId}>
        <AnimatePresence>
          {activeItem ? (
            <motion.div
              key="overlay"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              onClick={closeActiveItem}
              className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm"
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {activeItem ? (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeActiveItem();
                }
              }}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={modalLabel}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                className="relative w-full max-w-md outline-none"
              >
                <motion.div
                  layoutId={`card-${activeItem.id}`}
                  transition={layoutTransition}
                  className="w-full overflow-hidden rounded-xl border bg-background shadow-lg"
                >
                  <div className="flex items-start gap-3 border-b p-3">
                    <motion.img
                      layoutId={`image-${activeItem.id}`}
                      transition={layoutTransition}
                      src={activeItem.image}
                      alt={activeItem.imageAlt ?? ""}
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <motion.h2
                          id={titleId}
                          layoutId={`title-${activeItem.id}`}
                          transition={layoutTransition}
                          className="truncate text-sm font-semibold"
                        >
                          {activeItem.title}
                        </motion.h2>
                        <motion.p
                          id={descriptionId}
                          layoutId={`description-${activeItem.id}`}
                          transition={layoutTransition}
                          className="mt-1 text-sm leading-5 text-muted-foreground"
                        >
                          {activeItem.description}
                        </motion.p>
                      </div>
                      <motion.button
                        type="button"
                        layoutId={`button-${activeItem.id}`}
                        transition={layoutTransition}
                        onClick={() => handleAction(activeItem)}
                        className={actionButtonClassName}
                      >
                        {activeItem.actionLabel ?? actionLabel}
                      </motion.button>
                    </div>
                  </div>
                  <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion ? undefined : { opacity: 0, y: 4 }
                    }
                    transition={fadeTransition}
                    className="p-4 text-sm leading-6 text-muted-foreground"
                  >
                    {activeItem.content}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          ) : null}
        </AnimatePresence>

        <ul
          data-slot="animated-modal-list"
          aria-hidden={activeItem ? true : undefined}
          className={cn("flex w-full max-w-md flex-col gap-2", listClassName)}
        >
          {items.map((item) => (
            <li key={item.id}>
              <motion.div
                layoutId={`card-${item.id}`}
                transition={layoutTransition}
                onPointerEnter={() => void prepareImage(item.image)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50",
                  itemClassName,
                )}
              >
                <button
                  type="button"
                  onClick={() => void openItem(item)}
                  onFocus={() => void prepareImage(item.image)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <motion.img
                    layoutId={`image-${item.id}`}
                    transition={layoutTransition}
                    src={item.image}
                    alt={item.imageAlt ?? ""}
                    loading="eager"
                    decoding="sync"
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0">
                    <motion.span
                      layoutId={`title-${item.id}`}
                      transition={layoutTransition}
                      className="block truncate text-sm font-semibold"
                    >
                      {item.title}
                    </motion.span>
                    <motion.span
                      layoutId={`description-${item.id}`}
                      transition={layoutTransition}
                      className="mt-1 block truncate text-sm text-muted-foreground"
                    >
                      {item.description}
                    </motion.span>
                  </span>
                </button>
                <motion.button
                  type="button"
                  layoutId={`button-${item.id}`}
                  transition={layoutTransition}
                  onClick={() => void openItem(item)}
                  onFocus={() => void prepareImage(item.image)}
                  aria-label={`${item.actionLabel ?? actionLabel} ${item.title}`}
                  className={actionButtonClassName}
                >
                  {item.actionLabel ?? actionLabel}
                </motion.button>
              </motion.div>
            </li>
          ))}
        </ul>
      </LayoutGroup>
    </div>
  );
}
