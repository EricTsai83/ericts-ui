import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/components/ui/sliding-list": path.resolve(
        projectRoot,
        "registry/base/ui/sliding-list.tsx",
      ),
      "@/components/ui/rail-list": path.resolve(
        projectRoot,
        "registry/base/ui/rail-list.tsx",
      ),
      "@/hooks/use-element-size-map": path.resolve(
        projectRoot,
        "registry/base/hooks/use-element-size-map.ts",
      ),
      "@/hooks/use-reduced-motion": path.resolve(
        projectRoot,
        "registry/base/hooks/use-reduced-motion.ts",
      ),
      "@/hooks/use-scroll-progress": path.resolve(
        projectRoot,
        "registry/base/hooks/use-scroll-progress.ts",
      ),
      "@/hooks/use-timer": path.resolve(
        projectRoot,
        "registry/base/hooks/use-timer.ts",
      ),
      "@": path.resolve(projectRoot),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
