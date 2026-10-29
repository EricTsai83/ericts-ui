"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import {
  getRegistryBrowseOrder,
  type RegistryBrowseOrder,
} from "@/lib/registry-browse-order";

type Snapshot = RegistryBrowseOrder | "default" | "pending";
function getSnapshot(): Snapshot {
  return getRegistryBrowseOrder(window.location.hash) ?? "default";
}
function getServerSnapshot(): Snapshot {
  return "pending";
}

export function useRegistryBrowseState() {
  // Next's router.push/replace update the URL with history.pushState, which
  // fires neither event below, and only after the new route has rendered.
  // Re-subscribing on each route change re-reads the URL once it is final, so
  // this stays correct even in a component that survives navigation (a layout).
  const pathname = usePathname();
  const subscribe = useCallback(
    (onChange: () => void) => {
      window.addEventListener("popstate", onChange);
      window.addEventListener("hashchange", onChange);
      onChange();
      return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener("hashchange", onChange);
      };
    },
    // pathname is not read inside; it is the trigger to resubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return {
    ready: snapshot !== "pending",
    order:
      snapshot === "category"
        ? ("category" as const)
        : ("alphabetical" as const),
    explicitOrder:
      snapshot === "category" || snapshot === "alphabetical" ? snapshot : null,
  };
}

export function useRegistryBrowseOrder() {
  return useRegistryBrowseState().explicitOrder;
}
