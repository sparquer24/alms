'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { store } from '../store/store';
import { LayoutProvider } from '../config/layoutContext';
import NotificationProvider from '../config/notificationContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { AdminMenuProvider } from '../context/AdminMenuContext';
import AuthInitializer from './AuthInitializer';
import { UserProvider } from '../context/UserContext';
import { ApplicationProvider } from '../context/ApplicationContext';
import { InboxProvider } from '../context/InboxContext';
import { AdminThemeProvider } from '../context/AdminThemeContext';
import { GlobalActionProvider } from '../context/GlobalActionContext';




import { Toaster } from 'react-hot-toast';

export const RootProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  return (

    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <LayoutProvider>
            <NotificationProvider>
              <AdminThemeProvider>
                <AdminAuthProvider>
                  <AdminMenuProvider>
                    <UserProvider>
                      <ApplicationProvider>
                        <InboxProvider>
                          <GlobalActionProvider>
                            <AuthInitializer />
                            {children}

                          </GlobalActionProvider>
                        </InboxProvider>
                      </ApplicationProvider>
                    </UserProvider>
                  </AdminMenuProvider>
                </AdminAuthProvider>
              </AdminThemeProvider>
            </NotificationProvider>
          </LayoutProvider>
        </QueryClientProvider>
    </Provider>
  );
};

export default RootProviders;