'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

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
  headerOptions?: HeaderOptions;
  /** Real measured height (px) of the fixed top Header, including its floating top offset. Null until measured. */
  headerHeight: number | null;
  setShowHeader: (show: boolean) => void;
  setShowSidebar: (show: boolean) => void;
  setHeaderOptions: (options?: HeaderOptions) => void;
  setHeaderHeight: (height: number | null) => void;
}

const defaultLayoutContext: LayoutContextType = {
  showHeader: true,
  showSidebar: true,
  headerOptions: undefined,
  headerHeight: null,
  setShowHeader: () => {},
  setShowSidebar: () => {},
  setHeaderOptions: () => {},
  setHeaderHeight: () => {},
};

const LayoutContext = createContext<LayoutContextType>(defaultLayoutContext);

export const useLayout = () => useContext(LayoutContext);

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [showHeader, setShowHeader] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [headerOptions, setHeaderOptions] = useState<HeaderOptions | undefined>(undefined);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  return (
    <LayoutContext.Provider
      value={{
        showHeader,
        showSidebar,
        headerOptions,
        headerHeight,
        setShowHeader,
        setShowSidebar,
        setHeaderOptions,
        setHeaderHeight,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
