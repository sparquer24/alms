'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface ActionState {
  isLoading: boolean;
  actionId: string | null;
  startedAt: number | null;
}

interface GlobalActionContextType {
  actionState: ActionState;
  isActionInProgress: (actionId?: string) => boolean;
  startAction: (actionId: string) => boolean;
  endAction: (actionId?: string) => void;
  executeAction: <T>(actionId: string, action: () => Promise<T>) => Promise<T | null>;
  wasRecentlyCompleted: (actionId: string, timeoutMs?: number) => boolean;
  currentLoadingAction: string | null;
  activeNavigationPath: string | null;
  setActiveNavigationPath: (path: string | null) => void;
  // Accepts optional actionId, only blocks if same actionId is in progress
  canNavigateTo: (path: string, actionId?: string) => boolean;
}

const defaultState: ActionState = {
  isLoading: false,
  actionId: null,
  startedAt: null,
};

const GlobalActionContext = createContext<GlobalActionContextType>({
  actionState: defaultState,
  isActionInProgress: () => false,
  startAction: () => true,
  endAction: () => {},
  executeAction: async () => null,
  wasRecentlyCompleted: () => false,
  currentLoadingAction: null,
  activeNavigationPath: null,
  setActiveNavigationPath: () => {},
  canNavigateTo: () => true,
});

export const GlobalActionProvider = ({ children }: { children: ReactNode }) => {
  const [actionState, setActionState] = useState<ActionState>(defaultState);
  const [activeNavigationPath, setActiveNavigationPath] = useState<string | null>(null);

  // Track recently completed actions with timestamps
  const completedActionsRef = useRef<Map<string, number>>(new Map());

  // Only block the same actionId, not all actions
  const isActionInProgress = useCallback(
    (actionId?: string) => {
      if (!actionState.isLoading) return false;
      if (actionId) {
        return actionState.actionId === actionId;
      }
      return false;
    },
    [actionState]
  );

  const startAction = useCallback(
    (actionId: string): boolean => {
      // Only block if the same actionId is in progress
      if (actionState.isLoading && actionState.actionId === actionId) {
        console.debug(
          '[GlobalAction] Action rejected - same action in progress:',
          actionState.actionId
        );
        return false;
      }
      setActionState({
        isLoading: true,
        actionId,
        startedAt: Date.now(),
      });
      return true;
    },
    [actionState.isLoading, actionState.actionId]
  );

  const endAction = useCallback(
    (actionId?: string) => {
      // Only end if the action ID matches (or no ID specified)
      if (actionId && actionState.actionId !== actionId) {
        return;
      }
      // Record completion time
      if (actionState.actionId) {
        completedActionsRef.current.set(actionState.actionId, Date.now());
      }
      setActionState(defaultState);
      setActiveNavigationPath(null);
    },
    [actionState.actionId]
  );

  const executeAction = useCallback(
    async <T,>(actionId: string, action: () => Promise<T>): Promise<T | null> => {
      if (!startAction(actionId)) {
        return null;
      }

      try {
        const result = await action();
        return result;
      } catch (error) {
        console.error(`[GlobalAction] Action ${actionId} failed:`, error);
        throw error;
      } finally {
        endAction(actionId);
      }
    },
    [startAction, endAction]
  );

  const wasRecentlyCompleted = useCallback(
    (actionId: string, timeoutMs: number = 1000): boolean => {
      const completedAt = completedActionsRef.current.get(actionId);
      if (!completedAt) return false;

      const elapsed = Date.now() - completedAt;
      if (elapsed > timeoutMs) {
        // Clean up old entries
        completedActionsRef.current.delete(actionId);
        return false;
      }

      return true;
    },
    []
  );

  const canNavigateTo = useCallback(
    (path: string, actionId?: string): boolean => {
      // If we're currently navigating to the same path, block
      if (activeNavigationPath === path) {
        console.debug('[GlobalAction] Navigation blocked - already navigating to:', path);
        return false;
      }
      // Only block if the same actionId is in progress
      if (actionId && actionState.isLoading && actionState.actionId === actionId) {
        console.debug('[GlobalAction] Navigation blocked - same action in progress:', actionId);
        return false;
      }
      return true;
    },
    [activeNavigationPath, actionState.isLoading, actionState.actionId]
  );

  const value: GlobalActionContextType = {
    actionState,
    isActionInProgress,
    startAction,
    endAction,
    executeAction,
    wasRecentlyCompleted,
    currentLoadingAction: actionState.actionId,
    activeNavigationPath,
    setActiveNavigationPath,
    canNavigateTo,
  };

  return <GlobalActionContext.Provider value={value}>{children}</GlobalActionContext.Provider>;
};

export const useGlobalAction = () => useContext(GlobalActionContext);

// Custom hook for sidebar menu actions
export const useSidebarAction = () => {
  const { isActionInProgress, startAction, endAction, canNavigateTo, setActiveNavigationPath } =
    useGlobalAction();

  const executeSidebarNavigation = useCallback(
    async (
      menuKey: string,
      targetPath: string,
      navigationAction: () => Promise<void> | void
    ): Promise<boolean> => {
      const actionId = `sidebar-${menuKey}`;

      // Check if we can navigate
      if (!canNavigateTo(targetPath)) {
        return false;
      }

      // Check if action is already in progress
      if (isActionInProgress(actionId)) {
        return false;
      }

      // Start the action
      if (!startAction(actionId)) {
        return false;
      }

      try {
        setActiveNavigationPath(targetPath);
        await navigationAction();
        return true;
      } catch (error) {
        console.error(`[SidebarAction] Navigation to ${targetPath} failed:`, error);
        return false;
      } finally {
        // Small delay before ending action to prevent rapid re-clicks
        setTimeout(() => {
          endAction(actionId);
        }, 300);
      }
    },
    [isActionInProgress, startAction, endAction, canNavigateTo, setActiveNavigationPath]
  );

  return { executeSidebarNavigation, isActionInProgress };
};

export default GlobalActionContext;
