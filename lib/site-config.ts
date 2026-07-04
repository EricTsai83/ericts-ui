import { getSiteUrl } from "@/lib/site-url";

export const siteConfig = {
  name: "ericts/ui Registry",
  url: getSiteUrl(),
  description:
    "A polished, motion-focused shadcn-compatible registry for components, hooks, and blocks.",
  links: {
    github: "https://github.com/EricTsai83/ericts-ui",
  },
} as const;

export const siteOgImage = {
  path: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: siteConfig.name,
} as const;
