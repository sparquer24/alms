"use client";

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { AuthProvider } from '../config/auth';
import { LayoutProvider } from '../config/layoutContext';
import NotificationProvider from '../config/notificationContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import AuthInitializer from './AuthInitializer';
import { UserProvider } from '../context/UserContext';
import { ApplicationProvider } from '../context/ApplicationContext';
import { InboxProvider } from '../context/InboxContext';

export const RootProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <LayoutProvider>
          <NotificationProvider>
            <AdminAuthProvider>
              <UserProvider>
                <ApplicationProvider>
                  <InboxProvider>
                    <AuthInitializer />
                    {children}
                  </InboxProvider>
                </ApplicationProvider>
              </UserProvider>
            </AdminAuthProvider>
          </NotificationProvider>
        </LayoutProvider>
      </AuthProvider>
    </Provider>
  );
};

export default RootProviders;
