import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/hooks/use-element-size-map": path.resolve(
        __dirname,
        "registry/base/hooks/use-element-size-map.ts",
      ),
      "@": path.resolve(__dirname),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
