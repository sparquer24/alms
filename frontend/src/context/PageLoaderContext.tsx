import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageLoaderContextType {
  loadingPage: string;
  setLoadingPage: (page: string) => void;
}

const PageLoaderContext = createContext<PageLoaderContextType>({
  loadingPage: '',
  setLoadingPage: () => {},
});

export const PageLoaderProvider = ({ children }: { children: ReactNode }) => {
  const [loadingPage, setLoadingPage] = useState('');

  return (
    <PageLoaderContext.Provider value={{ loadingPage, setLoadingPage }}>
      {children}
    </PageLoaderContext.Provider>
  );
};

export const usePageLoader = () => useContext(PageLoaderContext);
