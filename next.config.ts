import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const renamedRegistryItems = [
  ["morph", "text-morph"],
  ["animated-modal", "expandable-modal"],
  ["feedback", "feedback-popover"],
  ["orchestration", "staggered-entrance"],
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/registry",
        destination: "/blocks",
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
