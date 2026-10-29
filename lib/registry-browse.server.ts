import "server-only";

import { buildRegistryBrowseModel } from "@/lib/registry-browse-build";
import {
  getRegistryDisplayCategoryDetails,
  getRegistryDisplayItems,
  getRegistryDisplayItemsByCategory,
} from "@/lib/registry-display";
import type { RegistryKind } from "@/lib/registry-kind";

function compileKind(kind: RegistryKind) {
  const groups = getRegistryDisplayCategoryDetails(kind).map((category) => ({
    category: category.slug,
    label: category.label,
    description: category.description,
    // Only the fields the client needs; `browsable` is set only where it hides
    // an item, so it never reaches the fullscreen payload.
    items: getRegistryDisplayItemsByCategory(kind, category.slug).map(
      ({ name, title, category, viewHref, browsable }) => ({
        name,
        title,
        category,
        viewHref,
        ...(browsable === false && { browsable }),
      }),
    ),
  }));
  return buildRegistryBrowseModel(
    groups,
    getRegistryDisplayItems(kind).map((item) => item.name),
  );
}

// One compilation per kind per build worker, shared by the homepage, the list
// page, and every fullscreen page of that kind.
const catalog = new Map<RegistryKind, ReturnType<typeof compileKind>>();
export function getStaticRegistryBrowseModel(kind: RegistryKind) {
  let model = catalog.get(kind);
  if (!model) {
    model = compileKind(kind);
    catalog.set(kind, model);
  }
  return model;
}
