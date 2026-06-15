import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import {
  CustomDocsSidebar,
  CustomDocsSidebarProvider,
  CustomDocsSidebarTrigger,
  useCustomDocsSidebar,
} from "@/components/docs-sidebar";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      containerProps={{
        className: "custom-docs-layout",
      }}
      slots={{
        sidebar: {
          provider: CustomDocsSidebarProvider,
          root: CustomDocsSidebar,
          trigger: CustomDocsSidebarTrigger,
          useSidebar: useCustomDocsSidebar,
        },
      }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
