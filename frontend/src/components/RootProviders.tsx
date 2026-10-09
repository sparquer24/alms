'use client';

import React, { Suspense } from 'react';
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
import NavigationProgress from './NavigationProgress';




import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';

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
                            <Suspense fallback={null}>
                              <NavigationProgress />
                            </Suspense>
                            {children}
                            {/* Both toast libraries are used in the app; each needs its own host. */}
                            <Toaster position='top-right' />
                            <ToastContainer position='top-right' autoClose={4000} newestOnTop />

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