import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

/**
 * Old item name -> current name. Each pair keeps three URLs alive: the docs page,
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
] as const;

const nextConfig: NextConfig = {
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
        {
          source: `/components/${from}`,
          destination: `/components/${to}`,
          permanent: false,
        },
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
        destination: "/docs/:path*",
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
