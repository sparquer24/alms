"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../config/auth";
import { LayoutProvider } from "../config/layoutContext";
import { NotificationProvider } from "../config/notificationContext";
import MockNotificationService from "../config/mockWebSocketService";
import ProductionWebSocketService from "../config/productionWebSocketService";
import { useState, useEffect } from "react";
import { Provider } from 'react-redux';
import { store } from '../store/store';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Moving metadata to a separate file since we're using "use client"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // State to track whether we're in development mode
  const [isDev, setIsDev] = useState(true);

  // Determine environment on client side
  useEffect(() => {
    setIsDev(process.env.NODE_ENV !== "production");
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Arms License Dashboard</title>
        <meta name="description" content="Dashboard for arms license processing" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Provider store={store}>
          <AuthProvider>
            <LayoutProvider>
              <NotificationProvider>
                {/* Use appropriate WebSocket service based on environment */}
                {isDev ? (
                  <MockNotificationService />
                ) : (
                  <ProductionWebSocketService />
                )}
                {children}
              </NotificationProvider>
            </LayoutProvider>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
