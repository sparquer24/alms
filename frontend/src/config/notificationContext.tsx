"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { NotificationApi } from './APIClient';

export type NotificationApplicationType = 'FRESH' | 'RENEWAL' | 'CANCEL';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  applicationId?: number | null;
  applicationType?: NotificationApplicationType | null;
}

/** Page that opens the application a notification is about, by application type. */
export const getNotificationHref = (n: Pick<Notification, 'applicationId' | 'applicationType'>): string | null => {
  if (!n.applicationId) return null;
  const id = encodeURIComponent(String(n.applicationId));
  switch (n.applicationType) {
    case 'RENEWAL':
      return `/renewalApplication/${id}`;
    case 'CANCEL':
      return `/cancelForm/${id}`;
    default:
      return `/application/${id}`;
  }
};

/** Backend ids are numbers; the UI keys everything by string. */
export const normalizeNotification = (raw: any): Notification => ({
  id: String(raw.id),
  type: raw.type,
  title: raw.title,
  message: raw.message,
  isRead: Boolean(raw.isRead),
  createdAt: raw.createdAt,
  applicationId: raw.applicationId ?? null,
  applicationType: raw.applicationType ?? null,
});

/** How often the bell checks for new notifications while the tab is visible. */
const POLL_INTERVAL_MS = 60_000;
const BELL_PAGE_SIZE = 20;

interface NotificationContextType {
  /** Latest notifications, shown in the header bell. */
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

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, token } = useAuth();
  const inFlight = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || inFlight.current) return;
    inFlight.current = true;
    try {
      const response: any = await NotificationApi.getAll({ pageSize: BELL_PAGE_SIZE });
      const data = response?.data;
      if (response?.success && data) {
        setNotifications((data.notifications ?? []).map(normalizeNotification));
        setUnreadCount(Number(data.unreadCount) || 0);
      }
    } catch (error) {
      // Background refresh — log only, never interrupt the user with a toast.
      console.error('[NotificationProvider] Failed to fetch notifications:', error);
    } finally {
      inFlight.current = false;
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (target?.isRead) return;
    // Optimistic: the bell updates immediately; roll back if the server refuses.
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await NotificationApi.markAsRead(id);
    } catch {
      toast.error('Could not mark the notification as read. Please try again.');
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await NotificationApi.markAllAsRead();
    } catch {
      toast.error('Could not mark all notifications as read. Please try again.');
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Load on sign-in, then poll while the tab is visible and refresh when it regains focus.
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [isAuthenticated, token, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
