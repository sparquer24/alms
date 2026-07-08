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
}

interface LayoutContextType {
  showHeader: boolean;
  showSidebar: boolean;
  headerOptions?: HeaderOptions;
  setShowHeader: (show: boolean) => void;
  setShowSidebar: (show: boolean) => void;
  setHeaderOptions: (options?: HeaderOptions) => void;
}

const defaultLayoutContext: LayoutContextType = {
  showHeader: true,
  showSidebar: true,
  headerOptions: undefined,
  setShowHeader: () => {},
  setShowSidebar: () => {},
  setHeaderOptions: () => {},
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

  return (
    <LayoutContext.Provider
      value={{
        showHeader,
        showSidebar,
        headerOptions,
        setShowHeader,
        setShowSidebar,
        setHeaderOptions,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
