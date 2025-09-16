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
    console.log('🔄 Setting applications in context:', {
      data: newApplications,
      length: newApplications?.length,
      type: typeof newApplications,
      isArray: Array.isArray(newApplications),
      sample: newApplications?.[0]
    });

    // Force array type and remove null/undefined items
    const cleanApplications = (Array.isArray(newApplications) ? newApplications : [])
      .filter(app => app != null);

    console.log('✨ Cleaned applications:', {
      length: cleanApplications.length,
      sample: cleanApplications[0]
    });

    // Update state
    setApplicationsState(cleanApplications);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('applications', JSON.stringify(cleanApplications));
        console.log('💾 Saved applications to localStorage');
      } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
      }
    }

    // Verify state was updated
    setTimeout(() => {
      console.log('🔍 Verifying context update:', {
        contextValue: applications,
        length: applications?.length,
        sample: applications?.[0]
      });
    }, 0);
  }, [applications]);

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
