import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/components/ui/sliding-list": path.resolve(
        __dirname,
        "registry/base/ui/sliding-list.tsx",
      ),
      "@/components/ui/rail-list": path.resolve(
        __dirname,
        "registry/base/ui/rail-list.tsx",
      ),
      "@/hooks/use-element-size-map": path.resolve(
        __dirname,
        "registry/base/hooks/use-element-size-map.ts",
      ),
      "@/hooks/use-reduced-motion": path.resolve(
        __dirname,
        "registry/base/hooks/use-reduced-motion.ts",
      ),
      "@/hooks/use-scroll-progress": path.resolve(
        __dirname,
        "registry/base/hooks/use-scroll-progress.ts",
      ),
      "@": path.resolve(__dirname),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
