export type RegistryBrowseOrder = "alphabetical" | "category";

type NamedItem = { name: string; title?: string };

export function compareRegistryNames(a: NamedItem, b: NamedItem) {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name);
}

/** Client-only browsing state must not split the server or Router Cache key. */
export function getRegistryBrowseHref(
  href: string,
  order: RegistryBrowseOrder | null,
) {
  if (!order) return href;
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return `${href}#order=${order}`;
  // Do not overwrite a real document anchor; only replace our reserved fragment.
  return href.startsWith("order=", hashIndex + 1)
    ? `${href.slice(0, hashIndex)}#order=${order}`
    : href;
}

export function getRegistryPrefetchHref(href: string) {
  return href.split("#", 1)[0];
}

export function getRegistryBrowseOrder(
  hash: string,
): RegistryBrowseOrder | null {
  const order = new URLSearchParams(hash.replace(/^#/, "")).get("order");
  return order === "alphabetical" || order === "category" ? order : null;
}
