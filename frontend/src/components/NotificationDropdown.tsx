"use client";

import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../config/notificationContext';
import Link from 'next/link';

interface NotificationDropdownProps {
  onClose?: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const isLoading = false; // We're getting notifications from context now
  const error = null;
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Format date to relative time
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md py-1 z-50"
    >
      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Notifications</h3>
        <button 
          onClick={markAllAsRead}
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          Mark all as read
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="px-4 py-3 text-sm text-red-600">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">No notifications</div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                  !notification.isRead ? 'bg-indigo-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-2 w-2 mt-1 rounded-full ${
                    !notification.isRead ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}></div>
                  <div className="ml-2 w-full">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
        <div className="border-t border-gray-100 px-4 py-2">
        <Link href="/notifications"
          className="text-xs text-indigo-600 hover:text-indigo-800 w-full text-center block"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
