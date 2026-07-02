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

const registryDisplayCategories = [
  {
    slug: "animation",
    kind: "component",
    label: "Animation",
    description: "Motion primitives, transition helpers, and animated states.",
  },
  {
    slug: "button",
    kind: "component",
    label: "Button",
    description: "Actions, copy controls, toolbar triggers, and stateful buttons.",
  },
  {
    slug: "feedback",
    kind: "component",
    label: "Feedback",
    description: "Status, confirmation, and response components.",
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
    label: "Navigation",
    description: "Tabs, menus, and navigational primitives.",
  },
  {
    slug: "overlay",
    kind: "component",
    label: "Overlay",
    description: "Dialogs, drawers, and elevated surfaces.",
  },
  {
    slug: "layout",
    kind: "component",
    label: "Layout",
    description: "Flow and layout primitives for changing content.",
  },
  {
    slug: "data-display",
    kind: "component",
    label: "Data Display",
    description: "Reserved for tables, cards, charts, and list components.",
  },
  {
    slug: "auth",
    kind: "block",
    label: "Auth",
    description: "Login, signup, forgot password, OTP, and SSO flows.",
  },
  {
    slug: "onboarding",
    kind: "block",
    label: "Onboarding",
    description: "First-run setup, workspace creation, and invite flows.",
  },
  {
    slug: "dashboard",
    kind: "block",
    label: "Dashboard",
    description: "Analytics, metrics, and admin overview surfaces.",
  },
  {
    slug: "settings",
    kind: "block",
    label: "Settings",
    description: "Account, billing, team, and product settings flows.",
  },
  {
    slug: "marketing",
    kind: "block",
    label: "Marketing",
    description: "Hero, pricing, FAQ, and feature sections.",
  },
  {
    slug: "commerce",
    kind: "block",
    label: "Commerce",
    description: "Checkout, plan comparison, and billing portal blocks.",
  },
  {
    slug: "content",
    kind: "block",
    label: "Content",
    description: "Blog, docs, changelog, and help center sections.",
  },
  {
    slug: "data-workflow",
    kind: "block",
    label: "Data Workflow",
    description: "Tables, filters, approvals, and issue queue workflows.",
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
    description: "Reserved for animation and transition hooks.",
  },
  {
    slug: "interaction",
    kind: "hook",
    label: "Interaction",
    description: "Reserved for pointer, keyboard, and gesture hooks.",
  },
  {
    slug: "state",
    kind: "hook",
    label: "State",
    description: "Reserved for client state coordination hooks.",
  },
  {
    slug: "browser",
    kind: "hook",
    label: "Browser",
    description: "Reserved for browser capability and environment hooks.",
  },
] as const satisfies readonly RegistryDisplayCategory[];

const registryDisplayItemConfigs = [
  {
    name: "smooth-height",
    kind: "component",
    category: "animation",
    defaultVariant: "motion",
  },
  { name: "check-animation", kind: "component", category: "animation" },
  { name: "jitter-animation", kind: "component", category: "animation" },
  { name: "squeeze-animation", kind: "component", category: "animation" },
  { name: "text-morph", kind: "component", category: "animation" },
  { name: "staggered-entrance", kind: "component", category: "animation" },
  {
    name: "context-cursor",
    kind: "component",
    category: "animation",
    viewport: "wide",
  },
  { name: "copy-button", kind: "component", category: "button" },
  { name: "status-button", kind: "component", category: "button" },
  {
    name: "expandable-toolbar",
    kind: "component",
    category: "button",
    viewport: "wide",
  },
  { name: "status-badge", kind: "component", category: "feedback" },
  { name: "feedback-popover", kind: "component", category: "feedback" },
  { name: "otp-input", kind: "component", category: "form" },
  { name: "floating-select", kind: "component", category: "form" },
  { name: "highlight-tabs", kind: "component", category: "navigation" },
  {
    name: "expandable-tabs",
    kind: "component",
    category: "navigation",
    viewport: "wide",
  },
  {
    name: "expanding-button",
    kind: "component",
    category: "overlay",
    viewport: "wide",
  },
  {
    name: "navigation-menu",
    kind: "component",
    category: "navigation",
    viewport: "wide",
  },
  { name: "expandable-modal", kind: "component", category: "overlay" },
  { name: "adaptive-drawer", kind: "component", category: "overlay" },
  { name: "multi-step", kind: "component", category: "layout" },
  { name: "use-reduced-motion", kind: "hook", category: "accessibility" },
  { name: "use-element-height", kind: "hook", category: "measurement" },
  {
    name: "use-element-size-map",
    kind: "hook",
    category: "measurement",
    viewport: "wide",
  },
  { name: "use-scroll-anchor", kind: "hook", category: "motion" },
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
