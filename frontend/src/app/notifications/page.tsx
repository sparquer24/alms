"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from "../../components/Sidebar";
import Header from "../../components/Header";
import { useAuthSync } from "../../hooks/useAuthSync";
import { useLayout } from "../../config/layoutContext";
import { useNotifications } from "../../config/notificationContext";
import { NotificationApi } from "../../config/APIClient";
import { useRouter } from 'next/navigation';

interface NotificationsViewProps {
  filter?: 'all' | 'unread' | 'read';
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();
  
  const { isAuthenticated, token, isLoading: authLoading } = useAuthSync();
  const { setShowHeader, setShowSidebar } = useLayout();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();

  useEffect(() => {
    // Show header and sidebar on the page
    setShowHeader(true);
    setShowSidebar(true);
  }, [setShowHeader, setShowSidebar]);
  
  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Fetch more notifications
  const loadMoreNotifications = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await NotificationApi.getAll({ 
        page: nextPage, 
        pageSize: 20,
        read: filter === 'all' ? undefined : filter === 'read'
      });
      
      if (response.success && response.data) {
        // Check if there are more notifications
        if (response.data.notifications && response.data.notifications.length > 0) {
          setPage(nextPage);
          setHasMoreNotifications(response.data.pagination.page < response.data.pagination.totalPages);
        } else {
          setHasMoreNotifications(false);
        }
      }
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search and filters - dummy functions for header
  const handleSearch = () => {};
  const handleDateFilter = () => {};
  const handleReset = () => {};
  
  // Get notifications based on filter
  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    return notifications.filter(notification => 
      filter === 'read' ? notification.isRead : !notification.isRead
    );
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_STATUS_CHANGE':
        return (
          <div className="p-2 bg-blue-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'APPLICATION_FORWARDED':
        return (
          <div className="p-2 bg-green-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        );
      case 'APPLICATION_RETURNED':
        return (
          <div className="p-2 bg-yellow-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
          </div>
        );
      case 'SYSTEM_ALERT':
        return (
          <div className="p-2 bg-red-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'COMMENT_ADDED':
        return (
          <div className="p-2 bg-purple-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };
  
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />
      
      <main className="flex-1 p-8 overflow-y-auto ml-[18%] mt-[70px]">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            
            <div className="flex space-x-2">
              <div className="relative inline-block bg-gray-100 p-1 rounded-lg">
                <button 
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'unread' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </button>
                <button 
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'read' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFilter('read')}
                >
                  Read
                </button>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-50"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filter === 'all' 
                  ? "You don't have any notifications yet" 
                  : filter === 'unread' 
                    ? "You don't have any unread notifications" 
                    : "You don't have any read notifications"}
              </div>
            ) : (
              <>
                {filteredNotifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`p-4 border rounded-lg flex items-start space-x-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-indigo-50 border-indigo-100' : 'border-gray-200'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 mt-1 text-sm">{notification.message}</p>
                      {notification.applicationId && (
                        <div className="mt-2">
                          <a 
                            href={`/application/${notification.applicationId}`}
                            className="text-xs text-indigo-600 hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            View Application
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {!notification.isRead && (
                      <span className="h-2 w-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                ))}
                
                {/* Load More Button */}
                {hasMoreNotifications && (
                  <div className="text-center py-4">
                    <button
                      onClick={loadMoreNotifications}
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
      </main>
    </div>
  );
}
