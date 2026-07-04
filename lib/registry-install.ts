import { getRegistryItemUrl } from "@/lib/site-url";

export const REGISTRY_NAMESPACE = "@ericts";

export type RegistryInstallMode = "url" | "namespace";

export function getRegistryNamespaceTarget(name: string) {
  return `${REGISTRY_NAMESPACE}/${name}`;
}

export function getRegistryUrlTarget(name: string) {
  return getRegistryItemUrl(name);
}

export function getRegistryInstallTarget(
  name: string,
  mode: RegistryInstallMode = "url",
) {
  return mode === "namespace"
    ? getRegistryNamespaceTarget(name)
    : getRegistryUrlTarget(name);
}
