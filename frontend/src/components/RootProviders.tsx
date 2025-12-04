'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '../store/store';
import { AuthProvider } from '../config/auth';
import { LayoutProvider } from '../config/layoutContext';
import NotificationProvider from '../config/notificationContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { AdminMenuProvider } from '../context/AdminMenuContext';
import AuthInitializer from './AuthInitializer';
import { UserProvider } from '../context/UserContext';
import { ApplicationProvider } from '../context/ApplicationContext';
import { InboxProvider } from '../context/InboxContext';
import { AdminThemeProvider } from '../context/AdminThemeContext';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
  },
});

export const RootProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LayoutProvider>
            <NotificationProvider>
              <AdminThemeProvider>
                <AdminAuthProvider>
                  <AdminMenuProvider>
                    <UserProvider>
                      <ApplicationProvider>
                        <InboxProvider>
                          <AuthInitializer />
                          {children}
                        </InboxProvider>
                      </ApplicationProvider>
                    </UserProvider>
                  </AdminMenuProvider>
                </AdminAuthProvider>
              </AdminThemeProvider>
            </NotificationProvider>
          </LayoutProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default RootProviders;
