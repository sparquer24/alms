"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ApplicationData } from '../types';

interface ApplicationContextType {
  applications: ApplicationData[];
  setApplications: (applications: ApplicationData[]) => void;
  clearApplications: () => void;
}

const ApplicationContext = createContext<ApplicationContextType>({
  applications: [],
  setApplications: () => {},
  clearApplications: () => {},
});

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [applications, setApplicationsState] = useState<ApplicationData[]>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('applications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved applications:', e);
        }
      }
    }
    return [];
  });

  const setApplications = useCallback((newApplications: ApplicationData[]) => {
    // Normalize and remove null/undefined
    const payload = Array.isArray(newApplications) ? newApplications.filter(app => app != null) : [];

    // Update state
    setApplicationsState(payload);

    // Persist
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('applications', JSON.stringify(payload));
        console.log('💾 Saved applications to localStorage', { length: payload.length });
      } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
      }
    }

    // Light-weight verification log using the payload (avoids stale closure over `applications`).
    setTimeout(() => {
      console.log('🔍 Verifying context update (payload):', { length: payload.length, sample: payload[0] });
    }, 0);
  }, []);

  const clearApplications = useCallback(() => {
    setApplicationsState([]);
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('applications');
    }
  }, []);

  console.log('ApplicationContext: Providing context value:', { 
    applications, 
    applicationsLength: applications?.length,
    applicationsType: typeof applications,
    applicationsIsArray: Array.isArray(applications)
  });
  
  return (
    <ApplicationContext.Provider value={{ applications, setApplications, clearApplications }}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => useContext(ApplicationContext);
