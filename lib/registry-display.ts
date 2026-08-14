import { getRegistryItem, type RegistryItem } from "@/lib/registry";

export type RegistryDisplayKind = "component" | "block" | "hook";
export type RegistryDisplayViewport = "centered" | "wide" | "full";

export type RegistryDisplayItemConfig = {
  name: string;
  kind: RegistryDisplayKind;
  category: string;
  browsable?: boolean;
  viewport?: RegistryDisplayViewport;
  defaultVariant?: string;
};

export type RegistryDisplayItem = RegistryDisplayItemConfig & {
  title: string;
  description?: string;
  href: string;
  viewHref: string;
  registryUrl: string;
  installKind: RegistryDisplayKind;
  tags: string[];
  effects: string[];
};

export type RegistryDisplayCategory = {
  slug: string;
  kind: RegistryDisplayKind;
  label: string;
  description: string;
};

export type RegistryDisplayNavigationGroup = {
  category: string;
  label: string;
  items: RegistryDisplayItem[];
};

/**
 * The registry's one taxonomy. `registry.json` items carry the same slug as
 * their first `categories` entry, so the published payload and this site's
 * information architecture cannot drift; `pnpm display:check` enforces it.
 *
 * Two rules keep the list honest. Categories describe *what an item is*, never
 * *that it animates* — every item here animates, so an "animation" category
 * sorts nothing. And a category only exists once something occupies it: the
 * list previously carried ten empty buckets inherited from a generic app-blocks
 * template (auth, dashboard, commerce…), which advertised a scope this registry
 * never had.
 *
 * Ordered concrete → abstract, which is the order groups render on the homepage
 * and in the demo browser's category jumps.
 */
const registryDisplayCategories = [
  {
    slug: "action",
    kind: "component",
    label: "Actions",
    description: "Buttons whose motion reports what the action is doing.",
  },
  {
    slug: "form",
    kind: "component",
    label: "Form",
    description: "Inputs and form controls for focused interaction states.",
  },
  {
    slug: "navigation",
    kind: "component",
    label: "Tabs & Navigation",
    description:
      "Tab lists, selectable rails, and menus with roving focus and a moving indicator.",
  },
  {
    slug: "overlay",
    kind: "component",
    label: "Overlays",
    description:
      "Dialogs, drawers, popovers, and panels that float above the page.",
  },
  {
    slug: "display",
    kind: "component",
    label: "Display",
    description:
      "Read-only output — status, text, and elapsed time — where motion carries the change.",
  },
  {
    slug: "container",
    kind: "component",
    label: "Containers",
    description:
      "Surfaces that measure their own content and animate as it changes.",
  },
  {
    slug: "effect",
    kind: "component",
    label: "Effects",
    description:
      "Content-agnostic wrappers that add motion to whatever you nest inside them.",
  },
  {
    slug: "marketing",
    kind: "block",
    label: "Marketing",
    description: "Full-page scroll heroes and scene galleries.",
  },
  {
    slug: "accessibility",
    kind: "hook",
    label: "Accessibility",
    description: "Hooks that adapt interfaces to user preferences.",
  },
  {
    slug: "measurement",
    kind: "hook",
    label: "Measurement",
    description: "Hooks for measuring rendered element dimensions.",
  },
  {
    slug: "motion",
    kind: "hook",
    label: "Motion",
    description: "Hooks that drive scroll-linked and eased movement.",
  },
] as const satisfies readonly RegistryDisplayCategory[];

const registryDisplayItemConfigs = [
  { name: "copy-button", kind: "component", category: "action" },
  { name: "status-button", kind: "component", category: "action" },
  { name: "expandable-toggle-button", kind: "component", category: "action" },
  { name: "play-button", kind: "component", category: "action" },
  { name: "otp-input", kind: "component", category: "form" },
  { name: "floating-select", kind: "component", category: "form" },
  { name: "adaptive-switch", kind: "component", category: "form" },
  { name: "expandable-slider", kind: "component", category: "form" },
  { name: "highlight-tabs", kind: "component", category: "navigation" },
  { name: "sliding-list", kind: "component", category: "navigation" },
  { name: "rail-list", kind: "component", category: "navigation" },
  {
    name: "rail-stage",
    kind: "component",
    category: "navigation",
    viewport: "wide",
  },
  {
    name: "expandable-segmented-tabs",
    kind: "component",
    category: "navigation",
  },
  {
    name: "expandable-tabs",
    kind: "component",
    category: "navigation",
    viewport: "wide",
  },
  {
    name: "navigation-menu",
    kind: "component",
    category: "navigation",
    viewport: "wide",
  },
  {
    name: "expandable-panel",
    kind: "component",
    category: "overlay",
    viewport: "wide",
  },
  { name: "expandable-dialog", kind: "component", category: "overlay" },
  { name: "adaptive-drawer", kind: "component", category: "overlay" },
  { name: "feedback-popover", kind: "component", category: "overlay" },
  { name: "floating-shortcut-button", kind: "component", category: "overlay" },
  { name: "status-badge", kind: "component", category: "display" },
  { name: "check-mark", kind: "component", category: "display" },
  { name: "timer", kind: "component", category: "display" },
  { name: "text-morph", kind: "component", category: "display" },
  {
    name: "smooth-height",
    kind: "component",
    category: "container",
    defaultVariant: "motion",
  },
  { name: "multi-step", kind: "component", category: "container" },
  {
    name: "expandable-toolbar",
    kind: "component",
    category: "container",
    viewport: "wide",
  },
  { name: "jitter", kind: "component", category: "effect" },
  { name: "squeeze", kind: "component", category: "effect" },
  { name: "heartbeat", kind: "component", category: "effect" },
  { name: "projected-shadow", kind: "component", category: "effect" },
  { name: "staggered-entrance", kind: "component", category: "effect" },
  {
    name: "context-cursor",
    kind: "component",
    category: "effect",
    viewport: "wide",
  },
  { name: "use-reduced-motion", kind: "hook", category: "accessibility" },
  { name: "use-element-height", kind: "hook", category: "measurement" },
  {
    name: "use-element-size-map",
    kind: "hook",
    category: "measurement",
    viewport: "wide",
  },
  { name: "use-scroll-anchor", kind: "hook", category: "motion" },
  { name: "use-scroll-progress", kind: "hook", category: "motion" },
  { name: "use-sequence-player", kind: "hook", category: "motion" },
  {
    name: "scroll-expand",
    kind: "block",
    category: "marketing",
    viewport: "full",
  },
  {
    name: "ripple-scene",
    kind: "block",
    category: "marketing",
    viewport: "full",
  },
  {
    name: "vertical-scene",
    kind: "block",
    category: "marketing",
    viewport: "full",
  },
] as const satisfies readonly RegistryDisplayItemConfig[];

const registryDisplayItems = registryDisplayItemConfigs
  .map((config) => createDisplayItem(config))
  .filter((item): item is RegistryDisplayItem => Boolean(item));

const registryDisplayItemByName = new Map(
  registryDisplayItems.map((item) => [item.name, item]),
);

export function getRegistryDisplayItems(
  kind?: RegistryDisplayKind,
): RegistryDisplayItem[] {
  if (!kind) {
    return registryDisplayItems;
  }

  return registryDisplayItems.filter((item) => item.kind === kind);
}

export function getRegistryDisplayItem(name: string) {
  return registryDisplayItemByName.get(name);
}

export function getRegistryDisplayCategories(kind: RegistryDisplayKind) {
  return getRegistryDisplayCategoryDetails(kind).map(
    (category) => category.slug,
  );
}

export function getRegistryDisplayCategoryDetails(
  kind: RegistryDisplayKind,
): RegistryDisplayCategory[] {
  return registryDisplayCategories.filter((category) => category.kind === kind);
}

export function getRegistryDisplayItemsByCategory(
  kind: RegistryDisplayKind,
  category: string,
) {
  return registryDisplayItems.filter(
    (item) => item.kind === kind && item.category === category,
  );
}

export function getRegistryDisplayNavigationGroups(
  kind: RegistryDisplayKind,
): RegistryDisplayNavigationGroup[] {
  return getRegistryDisplayCategoryDetails(kind)
    .map((category) => ({
      category: category.slug,
      label: category.label,
      items: getRegistryDisplayItemsByCategory(kind, category.slug).filter(
        (item) => item.browsable !== false,
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getRegistryDisplayNavigation(name: string) {
  const item = getRegistryDisplayItem(name);

  if (!item) {
    return undefined;
  }

  const navigationItems = getRegistryDisplayItems(item.kind).filter(
    (displayItem) => displayItem.browsable !== false,
  );
  const previousCategory = getRelativeCategoryFirstItem(item, -1);
  const nextCategory = getRelativeCategoryFirstItem(item, 1);

  return {
    item,
    previous: getRelativeItem(navigationItems, name, -1),
    next: getRelativeItem(navigationItems, name, 1),
    previousCategory,
    nextCategory,
  };
}

export function getRegistryDisplayViewHref(name: string, style = "base") {
  const item = getRegistryDisplayItem(name);

  if (!item || style !== "base") {
    return "";
  }

  return `/view/${style}/${item.name}`;
}

export function isRegistryDisplayItem(name: string) {
  return registryDisplayItemByName.has(name);
}

function createDisplayItem(
  config: RegistryDisplayItemConfig,
): RegistryDisplayItem | undefined {
  const item = getRegistryItem(config.name);

  if (!item) {
    return undefined;
  }

  return {
    ...config,
    title: item.title ?? item.name,
    description: item.description,
    href: item.href,
    viewHref: `/view/base/${item.name}`,
    registryUrl: item.registryUrl,
    installKind: config.kind,
    tags: item.meta?.tags ?? [],
    effects: item.meta?.effects ?? [],
  };
}

function getRelativeItem(
  items: RegistryDisplayItem[],
  name: string,
  offset: number,
) {
  if (items.length <= 1) {
    return undefined;
  }

  const currentIndex = items.findIndex((item) => item.name === name);
  const nextIndex = wrapIndex(currentIndex + offset, items.length);

  return items[nextIndex];
}

function getFirstItemInCategory(
  kind: RegistryDisplayKind,
  category: string | undefined,
) {
  if (!category) {
    return undefined;
  }

  return getRegistryDisplayItemsByCategory(kind, category).find(
    (item) => item.browsable !== false,
  );
}

function getRelativeCategoryFirstItem(
  item: RegistryDisplayItem,
  offset: number,
) {
  const categories = getPopulatedRegistryDisplayCategories(item.kind);
  const categoryIndex = categories.indexOf(item.category);

  if (categories.length <= 1 || categoryIndex === -1) {
    return undefined;
  }

  for (let step = 1; step <= categories.length; step += 1) {
    const category =
      categories[wrapIndex(categoryIndex + step * offset, categories.length)];
    const categoryItem = getFirstItemInCategory(item.kind, category);

    if (categoryItem) {
      return categoryItem;
    }
  }

  return undefined;
}

function getPopulatedRegistryDisplayCategories(kind: RegistryDisplayKind) {
  return getRegistryDisplayCategories(kind).filter(
    (category) =>
      getRegistryDisplayItemsByCategory(kind, category).some(
        (item) => item.browsable !== false,
      ),
  );
}

function wrapIndex(index: number, length: number) {
  if (length === 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

export function getRegistryDisplayKindForRegistryItem(
  item: RegistryItem,
): RegistryDisplayKind | undefined {
  if (item.category === "ui") {
    return "component";
  }

  if (item.category === "hooks") {
    return "hook";
  }

  if (item.category === "blocks") {
    return "block";
  }

  return undefined;
}
