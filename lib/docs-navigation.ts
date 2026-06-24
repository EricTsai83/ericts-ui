import type { ReactNode } from "react";
import type { Folder, Item, Root, Separator } from "fumadocs-core/page-tree";

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

export type DocsNavItem = {
  title: ReactNode;
  url: string;
  disabled?: boolean;
};

export function buildDocsGroups(root: Root | Folder): DocsNavGroup[] {
  const groups: DocsNavGroup[] = [];
  let current: DocsNavGroup = { title: "Sections", items: [] };

  const flush = () => {
    if (current.items.length > 0) {
      groups.push(current);
    }
  };

  for (const node of root.children) {
    if (node.type === "separator") {
      flush();
      current = { title: nodeTitle(node, "Section"), items: [] };
      continue;
    }

    if (node.type === "folder") {
      flush();
      groups.push(folderToGroup(node));
      current = { title: "Sections", items: [] };
      continue;
    }

    current.items.push(pageToItem(node));
  }

  flush();

  return groups.length > 0 ? groups : [{ title: "Sections", items: [] }];
}

function folderToGroup(folder: Folder): DocsNavGroup {
  const items: DocsNavItem[] = [];

  if (folder.index) {
    items.push(pageToItem(folder.index));
  }

  for (const child of folder.children) {
    if (child.type === "page") {
      items.push(pageToItem(child));
    }
  }

  return {
    title: nodeTitle(folder, "Components"),
    items,
  };
}

function pageToItem(item: Item): DocsNavItem {
  return {
    title: item.name,
    url: item.url,
  };
}

function nodeTitle(node: Folder | Separator, fallback: string): string {
  return typeof node.name === "string" ? node.name : fallback;
}
