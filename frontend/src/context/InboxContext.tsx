"use client";

import React, { createContext, useCallback, useContext, useMemo, useState, useRef } from "react";
import { fetchApplicationsByStatusKey } from "../services/sidebarApiCalls";
import { ApplicationData } from "../types";

type InboxContextValue = {
  selectedType: string | null;
  applications: ApplicationData[];
  isLoading: boolean;
  loadType: (type: string, force?: boolean) => Promise<void>;
};

const InboxContext = createContext<InboxContextValue | undefined>(undefined);

export const InboxProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // request id to ignore stale responses when switching types quickly
  const requestIdRef = useRef(0);

  const loadType = useCallback(async (type: string, force = false) => {
    if (!type) return;
    // Keep camelCase format for types like "reEnquiry"
    const normalized = String(type);
    if (normalized === selectedType && !force) return; // already loaded

    // bump request id for this load, so we can ignore stale responses
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setSelectedType(normalized);
      const apps = await fetchApplicationsByStatusKey(normalized);
      // only apply results if this is the latest request
      if (requestId === requestIdRef.current) {
        setApplications(apps ?? []);
      } else {
        // stale response - ignore
        console.debug('Ignored stale inbox response for', normalized);
      }
    } catch (err) {
      // only report/clear if this is the latest request
      if (requestId === requestIdRef.current) {
        console.error('InboxProvider loadType error', err);
        setApplications([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedType]);

  const value = useMemo(() => ({ selectedType, applications, isLoading, loadType }), [selectedType, applications, isLoading, loadType]);

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
};

export const useInbox = () => {
  const ctx = useContext(InboxContext);
  if (!ctx) {
    // Fallback safe implementation so components rendered outside the provider don't crash.
    // This logs so we can find and wrap callers with the provider if needed.
    if (typeof window !== 'undefined') console.warn('useInbox called outside InboxProvider - returning no-op fallback');
    return {
      selectedType: null,
      applications: [],
      isLoading: false,
      loadType: async () => { /* noop */ },
    } as InboxContextValue;
  }
  return ctx;
};

export default InboxContext;
