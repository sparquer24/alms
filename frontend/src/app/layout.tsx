"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../config/auth";
import { LayoutProvider } from "../config/layoutContext";
import { NotificationProvider } from "../config/notificationContext";
import { useState, useEffect } from "react";
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { AuthInitializer } from "../components/AuthInitializer";
import { UserProvider } from "../context/UserContext";
import { ApplicationProvider } from "../context/ApplicationContext";
import { InboxProvider } from "../context/InboxContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDev, setIsDev] = useState(true);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV !== "production");
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Arms License Dashboard</title>
        <meta name="description" content="Dashboard for arms license processing" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="w-full">
          <Provider store={store}>
            <AuthInitializer />
            <AuthProvider>
              <LayoutProvider>
                <NotificationProvider>
                  {/* WebSocket services removed */}
                  <AdminAuthProvider>
                    <UserProvider>
                      <ApplicationProvider>
                        <InboxProvider>
                          {children}
                        </InboxProvider>
                      </ApplicationProvider>
                    </UserProvider>
                  </AdminAuthProvider>
                </NotificationProvider>
              </LayoutProvider>
            </AuthProvider>
          </Provider>
        </div>
      </body>
    </html>
  );
}
