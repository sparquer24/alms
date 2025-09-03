import React, { createContext, useContext, useState, useCallback } from 'react';
import { ApplicationData } from '../config/mockData';

interface ApplicationContextType {
  applications: ApplicationData[]; // current view list (backward compatibility)
  setApplications: (applications: ApplicationData[]) => void;
  clearApplications: () => void;
  setApplicationsForStatus: (status: string, apps: ApplicationData[]) => void;
  getApplicationsForStatus: (status: string) => ApplicationData[] | undefined;
  applicationsByStatus: Record<string, ApplicationData[]>; // cache map
  statusFreshness: Record<string, number>; // epoch ms
  getStatusTimestamp: (status: string) => number | undefined;
}

const ApplicationContext = createContext<ApplicationContextType>({
  applications: [],
  setApplications: () => {},
  clearApplications: () => {},
  setApplicationsForStatus: () => {},
  getApplicationsForStatus: () => undefined,
  applicationsByStatus: {},
  statusFreshness: {},
  getStatusTimestamp: () => undefined,
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
  const [applicationsByStatus, setApplicationsByStatus] = useState<Record<string, ApplicationData[]>>({});
  const [statusFreshness, setStatusFreshness] = useState<Record<string, number>>({});

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
    setApplicationsByStatus({});
    setStatusFreshness({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('applications');
      localStorage.removeItem('applicationsByStatus');
      localStorage.removeItem('applicationsFreshness');
    }
  }, []);

  const setApplicationsForStatus = useCallback((status: string, apps: ApplicationData[]) => {
    const now = Date.now();
    setApplicationsState(apps); // update current view
    setApplicationsByStatus(prev => {
      const next = { ...prev, [status]: apps };
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('applicationsByStatus', JSON.stringify(next)); } catch {/* ignore */}
      }
      return next;
    });
    setStatusFreshness(prev => {
      const next = { ...prev, [status]: now };
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('applicationsFreshness', JSON.stringify(next)); } catch {/* ignore */}
      }
      return next;
    });
  }, []);

  const getApplicationsForStatus = useCallback((status: string) => applicationsByStatus[status], [applicationsByStatus]);
  const getStatusTimestamp = useCallback((status: string) => statusFreshness[status], [statusFreshness]);

  console.log('ApplicationContext: Providing context value:', { 
    applications, 
    applicationsLength: applications?.length,
    applicationsType: typeof applications,
    applicationsIsArray: Array.isArray(applications)
  });
  
  return (
    <ApplicationContext.Provider value={{ applications, setApplications, clearApplications, setApplicationsForStatus, getApplicationsForStatus, applicationsByStatus, statusFreshness, getStatusTimestamp }}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => useContext(ApplicationContext);
