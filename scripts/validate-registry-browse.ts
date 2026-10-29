import { getStaticRegistryBrowseModel } from "@/lib/registry-browse.server";
import {
  getRegistryKindFromSegment,
  registryKindSegments,
} from "@/lib/registry-kind";

// Compiling throws on duplicated, missing, or uncategorized items, so a broken
// taxonomy fails here rather than halfway through prerendering.
let total = 0;
for (const segment of registryKindSegments) {
  total += getStaticRegistryBrowseModel(getRegistryKindFromSegment(segment)!)
    .listPlan.sequences.alphabetical.length;
}
console.log(
  `Registry browse validation passed (${registryKindSegments.length} kinds, ${total} items).`,
);
