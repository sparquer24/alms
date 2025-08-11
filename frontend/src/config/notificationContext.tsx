"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth';
import { NotificationApi } from './APIClient';

export interface Notification {
  applicationId: any;
  applicationId: React.JSX.Element;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);  const { isAuthenticated, token } = useAuth();
  
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
  
  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await NotificationApi.getAll({ pageSize: 20 });
      if (response.success && response.body) {
        setNotifications(response.body.notifications);
        
        // Calculate unread count
        const unread = response.body.notifications.filter(
          (n: Notification) => !n.isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await NotificationApi.markAsRead(id);
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await NotificationApi.markAllAsRead();
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
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
