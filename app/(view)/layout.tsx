import type { ReactNode } from "react";

import { FullscreenSessionProvider } from "@/components/fullscreen-session";

/**
 * Next.js keeps this layout mounted while the visitor moves from preview to
 * preview and unmounts it when they leave `/view`, which is exactly the span the
 * fullscreen shell needs to remember things across.
 */
export default function ViewLayout({ children }: { children: ReactNode }) {
  return <FullscreenSessionProvider>{children}</FullscreenSessionProvider>;
}
