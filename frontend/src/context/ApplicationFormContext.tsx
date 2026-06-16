'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ApplicationFormContextType {
  applicationTypeId: number | null;
  applicationTypeName: string | null;
  categoryId: number | null;
  setApplicationType: (id: number | null, name: string | null) => void;
  setCategoryId: (id: number | null) => void;
}

const ApplicationFormContext = createContext<ApplicationFormContextType>({
  applicationTypeId: null,
  applicationTypeName: null,
  categoryId: null,
  setApplicationType: () => {},
  setCategoryId: () => {},
});

export const useApplicationFormContext = () => useContext(ApplicationFormContext);

export const ApplicationFormProvider = ({ children }: { children: ReactNode }) => {
  const [applicationTypeId, setApplicationTypeId] = useState<number | null>(null);
  const [applicationTypeName, setApplicationTypeName] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const setApplicationType = (id: number | null, name: string | null) => {
    setApplicationTypeId(id);
    setApplicationTypeName(name);
  };

  return (
    <ApplicationFormContext.Provider
      value={{
        applicationTypeId,
        applicationTypeName,
        categoryId,
        setApplicationType,
        setCategoryId,
      }}
    >
      {children}
    </ApplicationFormContext.Provider>
  );
};
