"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Sidebar } from "../../components/Sidebar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageSubHeader, SubHeaderPills, SubHeaderButton } from "@/components/common/PageSubHeader";
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from "../../config/layoutContext";
import {
  useNotifications,
  getNotificationHref,
  normalizeNotification,
  Notification,
} from "../../config/notificationContext";
import { NotificationApi } from "../../config/APIClient";
import { useRouter } from 'next/navigation';
import { PageLayoutSkeleton } from '../../components/Skeleton';

type Filter = 'all' | 'unread' | 'read';

const PAGE_SIZE = 20;

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

const ICON_PATHS: Record<string, { wrap: string; path: string }> = {
  APPLICATION_ASSIGNED: { wrap: 'bg-blue-100 text-blue-600', path: 'M13 7l5 5m0 0l-5 5m5-5H6' },
  APPLICATION_APPROVED: { wrap: 'bg-green-100 text-green-600', path: 'M5 13l4 4L19 7' },
  APPLICATION_REJECTED: { wrap: 'bg-red-100 text-red-600', path: 'M6 18L18 6M6 6l12 12' },
  APPLICATION_CLOSED: {
    wrap: 'bg-gray-100 text-gray-600',
    path: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  },
};
const DEFAULT_ICON = {
  wrap: 'bg-gray-100 text-gray-600',
  path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const NotificationIcon = ({ type }: { type: string }) => {
  const icon = ICON_PATHS[type] ?? DEFAULT_ICON;
  return (
    <div className={`p-2 rounded-full flex-shrink-0 ${icon.wrap}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
      </svg>
    </div>
  );
};

const EMPTY_TEXT: Record<Filter, string> = {
  all: "You have no notifications yet. You'll be notified here when an application is sent to you or one you submitted is decided.",
  unread: 'No unread notifications.',
  read: 'No read notifications.',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { setShowHeader, setShowSidebar, headerHeight } = useLayout();
  // The bell context owns the unread count and read actions, so both stay in sync.
  const { notifications: bellNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    setShowHeader(true);
    setShowSidebar(true);
  }, [setShowHeader, setShowSidebar]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const loadPage = useCallback(async (nextPage: number, activeFilter: Filter) => {
    setIsLoading(true);
    try {
      const response: any = await NotificationApi.getAll({
        page: nextPage,
        pageSize: PAGE_SIZE,
        read: activeFilter === 'all' ? undefined : activeFilter === 'read',
      });
      const data = response?.data;
      const list: Notification[] = (data?.notifications ?? []).map(normalizeNotification);
      setItems(prev => (nextPage === 1 ? list : [...prev, ...list]));
      setPage(nextPage);
      setHasMore(data?.pagination ? data.pagination.page < data.pagination.totalPages : list.length >= PAGE_SIZE);
    } catch {
      toast.error('Could not load notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // First page whenever the filter changes, and again when the bell's background
  // refresh brings in something new (its newest id changes).
  const newestBellId = bellNotifications[0]?.id;
  useEffect(() => {
    if (!isAuthenticated) return;
    loadPage(1, filter);
  }, [isAuthenticated, filter, newestBellId, loadPage]);

  const handleMarkAsRead = (notification: Notification) => {
    if (notification.isRead) return;
    markAsRead(notification.id);
    setItems(prev =>
      filter === 'unread'
        ? prev.filter(n => n.id !== notification.id)
        : prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setItems(prev => (filter === 'unread' ? [] : prev.map(n => ({ ...n, isRead: true }))));
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <PageLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white">
      <Sidebar />
      <Header />

      <main
        className="flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col pt-[52px] md:pt-[66px]"
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <PageSubHeader
          title="Notifications"
          metaBadge={unreadCount > 0 ? `${unreadCount} Unread` : undefined}
          actions={
            <div className="flex items-center gap-2">
              <SubHeaderPills<Filter>
                options={[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread', count: unreadCount },
                  { key: 'read', label: 'Read' },
                ]}
                value={filter}
                onChange={setFilter}
              />
              {unreadCount > 0 && (
                <SubHeaderButton variant="primary" onClick={handleMarkAllAsRead} title="Mark all as read">
                  Mark All Read
                </SubHeaderButton>
              )}
            </div>
          }
        />

        <div className="flex-grow p-4 sm:p-6 max-w-5xl w-full mx-auto flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 sm:p-6">
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  {isLoading ? 'Loading notifications…' : EMPTY_TEXT[filter]}
                </p>
              ) : (
                <>
                  {items.map(notification => {
                    const href = getNotificationHref(notification);
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-indigo-50 border-indigo-100' : 'border-gray-200'}`}
                        onClick={() => handleMarkAsRead(notification)}
                      >
                        <NotificationIcon type={notification.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap justify-between items-start gap-x-4 gap-y-1">
                            <h3 className="font-medium text-gray-900">{notification.title}</h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(notification.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mt-1 text-sm break-words">{notification.message}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {href && (
                            <Link
                              href={href}
                              className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
                              onClick={e => {
                                e.stopPropagation();
                                handleMarkAsRead(notification);
                              }}
                            >
                              View Application
                            </Link>
                          )}
                          {!notification.isRead && (
                            <span className="h-2 w-2 bg-indigo-600 rounded-full flex-shrink-0" aria-label="Unread"></span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <div className="text-center py-4">
                      <button
                        onClick={() => loadPage(page + 1, filter)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
