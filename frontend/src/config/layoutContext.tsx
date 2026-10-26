'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface HeaderBreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface HeaderStatusBadge {
  label: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface HeaderOptions {
  breadcrumbs?: HeaderBreadcrumbItem[];
  pageTitle?: string;
  statusBadge?: HeaderStatusBadge;
  hidePrint?: boolean;
  hideCreateForm?: boolean;
  applicationTypeLabel?: string;
  showBackButton?: boolean;
}

interface LayoutContextType {
  showHeader: boolean;
  showSidebar: boolean;
  sidebarCollapsed: boolean;
  headerOptions?: HeaderOptions;
  /** Real measured height (px) of the fixed top Header, including its floating top offset. Null until measured. */
  headerHeight: number | null;
  setShowHeader: (show: boolean) => void;
  setShowSidebar: (show: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebarCollapsed: () => void;
  setHeaderOptions: (options?: HeaderOptions) => void;
  setHeaderHeight: (height: number | null) => void;
}

const defaultLayoutContext: LayoutContextType = {
  showHeader: true,
  showSidebar: true,
  sidebarCollapsed: false,
  headerOptions: undefined,
  headerHeight: null,
  setShowHeader: () => {},
  setShowSidebar: () => {},
  setSidebarCollapsed: () => {},
  toggleSidebarCollapsed: () => {},
  setHeaderOptions: () => {},
  setHeaderHeight: () => {},
};

const LayoutContext = createContext<LayoutContextType>(defaultLayoutContext);

export const useLayout = () => useContext(LayoutContext);

interface LayoutProviderProps {
  children: ReactNode;
  /** Start with the sidebar hidden (for full-width pages) so the header doesn't shift after first paint. */
  initialShowSidebar?: boolean;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children, initialShowSidebar = true }) => {
  const [showHeader, setShowHeader] = useState(true);
  const [showSidebar, setShowSidebar] = useState(initialShowSidebar);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [headerOptions, setHeaderOptions] = useState<HeaderOptions | undefined>(undefined);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  // Restore sidebar collapsed preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alms_sidebar_collapsed');
      if (saved === 'true') {
        setSidebarCollapsedState(true);
      }
    } catch {}
  }, []);

  const setSidebarCollapsed = (value: boolean | ((prev: boolean) => boolean)) => {
    setSidebarCollapsedState(prev => {
      const nextVal = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem('alms_sidebar_collapsed', String(nextVal));
      } catch {}
      return nextVal;
    });
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <LayoutContext.Provider
      value={{
        showHeader,
        showSidebar,
        sidebarCollapsed,
        headerOptions,
        headerHeight,
        setShowHeader,
        setShowSidebar,
        setSidebarCollapsed,
        toggleSidebarCollapsed,
        setHeaderOptions,
        setHeaderHeight,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
