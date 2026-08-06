"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_PACKAGE_MANAGER,
  isPackageManager,
  type PackageManager,
} from "@/lib/registry-install-command";

export const PACKAGE_MANAGER_STORAGE_KEY = "ericts-ui:package-manager";

const PACKAGE_MANAGER_CHANGE_EVENT = "ericts-ui:package-manager-change";

let volatilePackageManager: PackageManager | null = null;

type PackageManagerSnapshot = PackageManager | null;

function getStoredPackageManager(
  defaultPackageManager: PackageManager,
): PackageManager {
  try {
    const storedPackageManager = window.localStorage.getItem(
      PACKAGE_MANAGER_STORAGE_KEY,
    );

    if (isPackageManager(storedPackageManager)) {
      return storedPackageManager;
    }

    return defaultPackageManager;
  } catch {
    // Fall back to the in-memory preference when storage is unavailable.
    return volatilePackageManager ?? defaultPackageManager;
  }
}

function subscribeToPackageManager(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key !== null &&
      event.key !== PACKAGE_MANAGER_STORAGE_KEY
    ) {
      return;
    }

    volatilePackageManager = null;
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PACKAGE_MANAGER_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PACKAGE_MANAGER_CHANGE_EVENT, onStoreChange);
  };
}

function getServerPackageManager(): PackageManagerSnapshot {
  return null;
}

export function usePackageManager(
  defaultPackageManager: PackageManager = DEFAULT_PACKAGE_MANAGER,
) {
  const packageManager = useSyncExternalStore(
    subscribeToPackageManager,
    () => getStoredPackageManager(defaultPackageManager),
    getServerPackageManager,
  );

  const setPackageManager = useCallback((value: PackageManager) => {
    volatilePackageManager = value;

    try {
      window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, value);
    } catch {
      // The picker still works for this session when storage is unavailable.
    }

    window.dispatchEvent(new Event(PACKAGE_MANAGER_CHANGE_EVENT));
  }, []);

  return [
    packageManager ?? defaultPackageManager,
    setPackageManager,
    packageManager !== null,
  ] as const;
}
