"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { SwipeNavigationDirection } from "@/registry/base/hooks/use-swipe-navigation";

export type PendingSwipeEntrance = {
  direction: SwipeNavigationDirection;
  targetItemName: string;
};

type FullscreenSessionValue = {
  navigationPanelOpen: boolean;
  setNavigationPanelOpen: Dispatch<SetStateAction<boolean>>;
  /** Which arrow is held down, kept lit across the move it triggers. */
  pressedNavigationDirection: SwipeNavigationDirection | null;
  setPressedNavigationDirection: Dispatch<
    SetStateAction<SwipeNavigationDirection | null>
  >;
  /** The preview a move is heading for, so it can enter from that direction. */
  pendingSwipeEntrance: PendingSwipeEntrance | null;
  setPendingSwipeEntrance: Dispatch<SetStateAction<PendingSwipeEntrance | null>>;
  /** The swipe hint is offered once per session, then spent. */
  swipeHintSpent: boolean;
  spendSwipeHint: () => void;
};

const FullscreenSessionContext =
  createContext<FullscreenSessionValue | null>(null);

/**
 * Holds the state of one visit to the fullscreen preview.
 *
 * Moving between previews replaces the page below it, so anything that has to
 * outlive that swap — a navigation panel the visitor left open, the arrow they
 * are still holding, the direction the next preview should enter from, whether
 * the swipe hint has been offered — belongs here rather than in the shell. The
 * provider's own lifetime draws the boundary: mounting it starts a session,
 * unmounting it ends one, so leaving fullscreen and coming back always arrives
 * with a clean slate.
 */
export function FullscreenSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [navigationPanelOpen, setNavigationPanelOpen] = useState(false);
  const [pressedNavigationDirection, setPressedNavigationDirection] =
    useState<SwipeNavigationDirection | null>(null);
  const [pendingSwipeEntrance, setPendingSwipeEntrance] =
    useState<PendingSwipeEntrance | null>(null);
  const [swipeHintSpent, setSwipeHintSpent] = useState(false);

  const spendSwipeHint = useCallback(() => {
    setSwipeHintSpent(true);
  }, []);

  const value = useMemo(
    () => ({
      navigationPanelOpen,
      setNavigationPanelOpen,
      pressedNavigationDirection,
      setPressedNavigationDirection,
      pendingSwipeEntrance,
      setPendingSwipeEntrance,
      swipeHintSpent,
      spendSwipeHint,
    }),
    [
      navigationPanelOpen,
      pendingSwipeEntrance,
      pressedNavigationDirection,
      spendSwipeHint,
      swipeHintSpent,
    ],
  );

  return (
    <FullscreenSessionContext.Provider value={value}>
      {children}
    </FullscreenSessionContext.Provider>
  );
}

/**
 * Read the surrounding fullscreen session. Throws outside a
 * `<FullscreenSessionProvider>`, since state that silently fell back to a fresh
 * session would look like a working session that forgets everything.
 */
export function useFullscreenSession() {
  const session = useContext(FullscreenSessionContext);

  if (!session) {
    throw new Error(
      "useFullscreenSession must be used within a <FullscreenSessionProvider>.",
    );
  }

  return session;
}
