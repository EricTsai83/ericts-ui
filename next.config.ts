import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

import { registryKindSegments } from "./lib/registry-kind";

/**
 * Old item name -> current name. Each pair keeps three URLs alive: the item page,
 * the fullscreen view, and `/r/<name>.json`, which is the install command users
 * have already pasted into their own projects.
 */
const renamedRegistryItems = [
  ["morph", "text-morph"],
  ["animated-modal", "expandable-dialog"],
  ["feedback", "feedback-popover"],
  ["orchestration", "staggered-entrance"],
  // Dropped the `-animation` suffix: the category (Effects, Display) already says
  // these animate, and two of them exported `Heartbeat`/`ProjectedShadow` anyway.
  ["check-animation", "check-mark"],
  ["jitter-animation", "jitter"],
  ["squeeze-animation", "squeeze"],
  ["heartbeat-animation", "heartbeat"],
  ["projected-shadow-animation", "projected-shadow"],
  // Settled the expanding-/expandable- split on the capability form, matching
  // Collapsible/Resizable in the surrounding shadcn vocabulary.
  ["expanding-toggle-button", "expandable-toggle-button"],
  ["expanding-slider", "expandable-slider"],
  ["expanding-segmented-tabs", "expandable-segmented-tabs"],
  ["expanding-panel", "expandable-panel"],
  ["expandable-modal", "expandable-dialog"],
  // Named for the move rather than for what the deck holds: it is a deck of any
  // cards, not a wallet's.
  ["card-lift", "deck-lift"],
] as const;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/registry",
        destination: "/blocks",
        permanent: false,
      },
      {
        // Rail Stage moved from the component catalogue to blocks without a
        // rename, so preserve links to its former detail page.
        source: "/components/rail-stage",
        destination: "/blocks/rail-stage",
        permanent: false,
      },
      ...renamedRegistryItems.flatMap(([from, to]) => [
        // The item page lives under its kind's segment, and a rename does not
        // say which one that is. Redirecting all of them costs nothing — a name
        // only ever existed under one, and the others 404 either way.
        ...registryKindSegments.map((segment) => ({
          source: `/${segment}/${from}`,
          destination: `/${segment}/${to}`,
          permanent: false,
        })),
        {
          source: `/view/:style/${from}`,
          destination: `/view/:style/${to}`,
          permanent: false,
        },
        {
          source: `/r/${from}.json`,
          destination: `/r/${to}.json`,
          permanent: false,
        },
      ]),
    ];
  },
  async rewrites() {
    return [
      {
        source: "/docs/:path*.md",
        destination: "/llm/:path*",
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
