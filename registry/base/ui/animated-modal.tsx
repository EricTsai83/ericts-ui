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
  longDescription: string;
  image: string;
  imageAlt?: string;
  actionLabel?: string;
};

export type AnimatedModalProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "onChange" | "value"
> & {
  items?: AnimatedModalItem[];
  value?: AnimatedModalItem | null;
  defaultValue?: AnimatedModalItem | null;
  onValueChange?: (item: AnimatedModalItem | null) => void;
  actionLabel?: string;
  modalLabel?: string;
  listClassName?: string;
  itemClassName?: string;
};

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const svgNamespace = ["http", "://www.w3.org/2000/svg"].join("");

const coverImages = {
  odyssey: svgDataUri(`
    <svg xmlns="${svgNamespace}" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="odyssey-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#0f172a"/>
          <stop offset="1" stop-color="#1e3a8a"/>
        </linearGradient>
        <linearGradient id="odyssey-planet" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#38bdf8"/>
          <stop offset="1" stop-color="#22c55e"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#odyssey-bg)"/>
      <circle cx="28" cy="29" r="2" fill="#e0f2fe"/>
      <circle cx="88" cy="25" r="1.8" fill="#fef3c7"/>
      <circle cx="96" cy="84" r="2.2" fill="#bfdbfe"/>
      <circle cx="60" cy="62" r="40" fill="#dbeafe" opacity=".18"/>
      <circle cx="60" cy="62" r="31" fill="#0f172a" stroke="#e0f2fe" stroke-width="6"/>
      <circle cx="60" cy="62" r="21" fill="url(#odyssey-planet)"/>
      <path d="M47 57c8 4 17 4 26 0v20H47z" fill="#0369a1" opacity=".35"/>
      <path d="M52 45l-9 14h34L68 45z" fill="#f8fafc"/>
      <path d="M52 45h16l6 37H46z" fill="#e2e8f0"/>
      <path d="M60 34l11 17H49z" fill="#f97316"/>
      <rect x="54" y="58" width="12" height="12" rx="3" fill="#0f172a"/>
      <path d="M49 82l-7 12h36l-7-12z" fill="#94a3b8"/>
    </svg>
  `),
  arcade: svgDataUri(`
    <svg xmlns="${svgNamespace}" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#052e16"/>
          <stop offset="1" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#bg)"/>
      <rect x="22" y="29" width="76" height="58" rx="15" fill="#ecfeff" opacity=".95"/>
      <rect x="31" y="39" width="58" height="25" rx="8" fill="#134e4a"/>
      <circle cx="43" cy="78" r="7" fill="#f97316"/>
      <circle cx="61" cy="78" r="7" fill="#e11d48"/>
      <path d="M35 52h18M44 43v18" stroke="#67e8f9" stroke-width="5" stroke-linecap="round"/>
      <path d="M68 49h11M73.5 43.5v11" stroke="#fef08a" stroke-width="4" stroke-linecap="round"/>
      <path d="M28 96h64" stroke="#99f6e4" stroke-width="6" stroke-linecap="round" opacity=".55"/>
    </svg>
  `),
  ghostTown: svgDataUri(`
    <svg xmlns="${svgNamespace}" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#1f2937"/>
          <stop offset="1" stop-color="#64748b"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#bg)"/>
      <path d="M18 85c14-12 25-9 39-1s28 5 45-8v26H18z" fill="#cbd5e1" opacity=".32"/>
      <path d="M30 74V42l17-12 17 12v32z" fill="#e5e7eb"/>
      <path d="M66 79V51l13-10 13 10v28z" fill="#cbd5e1"/>
      <rect x="39" y="55" width="11" height="19" rx="3" fill="#334155"/>
      <rect x="74" y="62" width="10" height="17" rx="3" fill="#475569"/>
      <circle cx="89" cy="27" r="10" fill="#f8fafc" opacity=".85"/>
      <path d="M21 91h78" stroke="#f8fafc" stroke-width="5" stroke-linecap="round" opacity=".45"/>
    </svg>
  `),
  treasure: svgDataUri(`
    <svg xmlns="${svgNamespace}" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#064e3b"/>
          <stop offset="1" stop-color="#84cc16"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#bg)"/>
      <path d="M19 92c11-21 19-39 43-52 15-8 30-9 39-5-12 10-16 25-12 47z" fill="#bbf7d0" opacity=".35"/>
      <rect x="31" y="56" width="58" height="30" rx="7" fill="#7c2d12"/>
      <path d="M31 61c0-16 13-28 29-28s29 12 29 28z" fill="#f59e0b"/>
      <rect x="31" y="62" width="58" height="9" fill="#facc15"/>
      <rect x="55" y="55" width="10" height="31" rx="3" fill="#fde68a"/>
      <circle cx="60" cy="70" r="5" fill="#451a03"/>
      <path d="M25 38c7 4 13 4 20 0M77 95c7-3 14-3 21 0" stroke="#ecfccb" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    </svg>
  `),
};

const defaultItems: AnimatedModalItem[] = [
  {
    id: "odyssey",
    title: "The Odyssey",
    description: "Explore unknown galaxies.",
    longDescription:
      "Encounter alien civilizations, navigate tense diplomacy, and make decisions that shift the balance of power across the galaxy.",
    image: coverImages.odyssey,
  },
  {
    id: "angry-rabbits",
    title: "Angry Rabbits",
    description: "They are coming for you.",
    longDescription:
      "Defend your base with quick aim and careful timing as the rabbits close in from every direction.",
    image: coverImages.arcade,
  },
  {
    id: "ghost-town",
    title: "Ghost Town",
    description: "Find the ghosts.",
    longDescription:
      "Search abandoned streets, follow subtle clues, and stay alert while the town shifts around you.",
    image: coverImages.ghostTown,
  },
  {
    id: "jungle-pirates",
    title: "Pirates in the Jungle",
    description: "Find the treasure.",
    longDescription:
      "Read the map, avoid traps, and race rival crews through dense jungle paths toward the hidden chest.",
    image: coverImages.treasure,
  },
];

const actionButtonClassName =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-transparent bg-primary bg-clip-padding px-2.5 pt-px text-[0.8rem] leading-[1.4285714286] font-medium whitespace-nowrap text-primary-foreground";

export function AnimatedModal({
  items = defaultItems,
  value,
  defaultValue = null,
  onValueChange,
  actionLabel = "Get",
  modalLabel = "Featured game",
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
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={modalLabel}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                layoutId={`card-${activeItem.id}`}
                transition={layoutTransition}
                className="w-full max-w-md overflow-hidden rounded-xl border bg-background shadow-lg"
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
                    <div className="flex shrink-0 items-center">
                      <motion.span
                        layoutId={`button-${activeItem.id}`}
                        transition={layoutTransition}
                        className={actionButtonClassName}
                      >
                        {activeItem.actionLabel ?? actionLabel}
                      </motion.span>
                    </div>
                  </div>
                </div>
                <motion.p
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
                  transition={fadeTransition}
                  className="p-4 text-sm leading-6 text-muted-foreground"
                >
                  {activeItem.longDescription}
                </motion.p>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        <ul
          data-slot="animated-modal-list"
          className={cn("flex w-full max-w-md flex-col gap-2", listClassName)}
        >
          {items.map((item) => (
            <li key={item.id}>
              <motion.button
                type="button"
                layoutId={`card-${item.id}`}
                transition={layoutTransition}
                onClick={() => void openItem(item)}
                onFocus={() => void prepareImage(item.image)}
                onPointerEnter={() => void prepareImage(item.image)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
                  itemClassName,
                )}
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
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
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
                  <motion.span
                    layoutId={`button-${item.id}`}
                    transition={layoutTransition}
                    className={actionButtonClassName}
                  >
                    {item.actionLabel ?? actionLabel}
                  </motion.span>
                </div>
              </motion.button>
            </li>
          ))}
        </ul>
      </LayoutGroup>
    </div>
  );
}
