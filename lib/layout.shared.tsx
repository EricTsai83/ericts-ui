import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false,
      title: "EricTS UI",
      url: "/",
    },
    searchToggle: {
      enabled: true,
    },
  };
}
