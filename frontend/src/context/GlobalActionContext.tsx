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
  const actionStateRef = useRef<ActionState>(defaultState);
  const [activeNavigationPath, setActiveNavigationPath] = useState<string | null>(null);

  // Track recently completed actions with timestamps
  const completedActionsRef = useRef<Map<string, number>>(new Map());

  // Only block the same actionId, not all actions
  const isActionInProgress = useCallback(
    (actionId?: string) => {
      if (!actionStateRef.current.isLoading) return false;
      if (actionId) {
        return actionStateRef.current.actionId === actionId;
      }
      return false;
    },
    []
  );

  const startAction = useCallback(
    (actionId: string): boolean => {
      // Only block if the same actionId is in progress
      if (actionStateRef.current.isLoading && actionStateRef.current.actionId === actionId) {
        return false;
      }
      const newState = {
        isLoading: true,
        actionId,
        startedAt: Date.now(),
      };
      actionStateRef.current = newState;
      setActionState(newState);
      return true;
    },
    []
  );

  const endAction = useCallback(
    (actionId?: string) => {
      // Only end if the action ID matches (or no ID specified)
      if (actionId && actionStateRef.current.actionId !== actionId) {
        return;
      }
      // Record completion time
      if (actionStateRef.current.actionId) {
        completedActionsRef.current.set(actionStateRef.current.actionId, Date.now());
      }
      actionStateRef.current = defaultState;
      setActionState(defaultState);
      setActiveNavigationPath(null);
    },
    []
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
        return false;
      }
      // Only block if the same actionId is in progress
      if (actionId && actionStateRef.current.isLoading && actionStateRef.current.actionId === actionId) {
        return false;
      }
      return true;
    },
    [activeNavigationPath]
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

