import React, { createContext, useState, useContext, ReactNode } from 'react';

interface LayoutContextType {
  showHeader: boolean;
  showSidebar: boolean;
  setShowHeader: (show: boolean) => void;
  setShowSidebar: (show: boolean) => void;
}

const defaultLayoutContext: LayoutContextType = {
  showHeader: true,
  showSidebar: true,
  setShowHeader: () => {},
  setShowSidebar: () => {}
};

const LayoutContext = createContext<LayoutContextType>(defaultLayoutContext);

export const useLayout = () => useContext(LayoutContext);

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [showHeader, setShowHeader] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <LayoutContext.Provider
      value={{
        showHeader,
        showSidebar,
        setShowHeader,
        setShowSidebar
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
