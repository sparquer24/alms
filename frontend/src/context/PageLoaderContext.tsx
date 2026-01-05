'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PageLoaderContextType {
  // Current loading page identifier
  loadingPage: string;
  setLoadingPage: (page: string) => void;

  // Show skeleton loader for a specific section
  showSkeleton: boolean;
  setShowSkeleton: (show: boolean) => void;

  // Track which sections are loading
  loadingSections: Set<string>;
  startSectionLoading: (sectionId: string) => void;
  endSectionLoading: (sectionId: string) => void;
  isSectionLoading: (sectionId: string) => boolean;

  // Global page transition loading state
  isPageTransitioning: boolean;
  startPageTransition: (targetPage: string) => void;
  endPageTransition: () => void;
}

const PageLoaderContext = createContext<PageLoaderContextType>({
  loadingPage: '',
  setLoadingPage: () => {},
  showSkeleton: false,
  setShowSkeleton: () => {},
  loadingSections: new Set(),
  startSectionLoading: () => {},
  endSectionLoading: () => {},
  isSectionLoading: () => false,
  isPageTransitioning: false,
  startPageTransition: () => {},
  endPageTransition: () => {},
});

export const PageLoaderProvider = ({ children }: { children: ReactNode }) => {
  const [loadingPage, setLoadingPage] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  const startSectionLoading = useCallback((sectionId: string) => {
    setLoadingSections(prev => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
    setShowSkeleton(true);
  }, []);

  const endSectionLoading = useCallback((sectionId: string) => {
    setLoadingSections(prev => {
      const next = new Set(prev);
      next.delete(sectionId);
      // If no more sections loading, hide skeleton
      if (next.size === 0) {
        setShowSkeleton(false);
      }
      return next;
    });
  }, []);

  const isSectionLoading = useCallback(
    (sectionId: string) => {
      return loadingSections.has(sectionId);
    },
    [loadingSections]
  );

  const startPageTransition = useCallback((targetPage: string) => {
    setIsPageTransitioning(true);
    setLoadingPage(targetPage);
    setShowSkeleton(true);
  }, []);

  const endPageTransition = useCallback(() => {
    setIsPageTransitioning(false);
    setLoadingPage('');
    setShowSkeleton(false);
  }, []);

  return (
    <PageLoaderContext.Provider
      value={{
        loadingPage,
        setLoadingPage,
        showSkeleton,
        setShowSkeleton,
        loadingSections,
        startSectionLoading,
        endSectionLoading,
        isSectionLoading,
        isPageTransitioning,
        startPageTransition,
        endPageTransition,
      }}
    >
      {children}
    </PageLoaderContext.Provider>
  );
};

export const usePageLoader = () => useContext(PageLoaderContext);
