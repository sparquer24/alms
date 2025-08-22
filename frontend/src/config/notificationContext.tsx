"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth';

export interface Notification {
  applicationId: string;
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  fetchNotifications: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  // Hard-coded notifications to avoid API calls while backend is unavailable
  const initialNotifications: Notification[] = [
    {
      applicationId: 'APP-1001',
      id: 'n1',
      type: 'INFO',
      title: 'Application Received',
      message: 'Your application APP-1001 has been received.',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      applicationId: 'APP-1002',
      id: 'n2',
      type: 'ALERT',
      title: 'Inspection Scheduled',
      message: 'An inspection has been scheduled for APP-1002.',
      isRead: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(() => initialNotifications.filter(n => !n.isRead).length);
  const { isAuthenticated, token } = useAuth();
  
  // Listen for mock WebSocket messages (for testing purposes)
  useEffect(() => {
    const handleMockWebSocketMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const data = JSON.parse(customEvent.detail.data);
        if (data.type === 'NOTIFICATION') {
          setNotifications(prev => [data.notification, ...prev]);
          if (!data.notification.isRead) {
            setUnreadCount(prev => prev + 1);
          }
        }
      }
    };
    
    // Add event listener for mock WebSocket messages
    window.addEventListener('mockWebSocketMessage', handleMockWebSocketMessage);
    
    return () => {
      window.removeEventListener('mockWebSocketMessage', handleMockWebSocketMessage);
    };
  }, []);
  
  // Fetch initial notifications (hard-coded). Keep behavior consistent when auth changes.
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    // Simulate fetching by reloading the initial notifications or keeping existing
    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.isRead).length);
  };
  
  // Mark notification as read
  const markAsRead = async (id: string) => {
    // Update local state only (no API call)
    setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, isRead: true } : notification));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Local state only
    setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    setUnreadCount(0);
  };
  
  // Fetch notifications on initial load and when auth state changes
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token]);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
