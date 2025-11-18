'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '../config/layoutContext';
import { useAuthSync } from '../hooks/useAuthSync';
import { useNotifications } from '../config/notificationContext';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';
import { APPLICATION_TYPES } from '../config/helpers';

interface HeaderProps {
  onCreateApplication?: (typeKey: string) => void;
  onShowMessage?: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const Header = (props: HeaderProps) => {
  const { onCreateApplication, onShowMessage } = props;
  const { showHeader } = useLayout();
  const { userName, isLoading, user, userRole: hookUserRole } = useAuthSync();
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const name = userName || user?.name || user?.username;
    if (!isLoading && name) setDisplayName(name);
  }, [userName, user, isLoading, hookUserRole]);

  const hasValidUserName = !isLoading && typeof displayName === 'string' && displayName.length > 0;
  const handleDropdownClick = (type: (typeof APPLICATION_TYPES)[number]) => {
    setShowDropdown(false);
    if (type.enabled) {
      if (type.key === 'fresh') {
        router.push('/forms/createFreshApplication/personal-information');
      } else {
        router.push(`/freshform?type=${encodeURIComponent(type.key)}`);
      }
    } else if (onShowMessage) {
      onShowMessage('This feature will come soon', 'info');
    }
  };

  if (!showHeader) return null;

  const isZSUser = hookUserRole?.toUpperCase() === 'ZS';
  
  return (
    <header className='fixed top-0 right-0 left-[80px] md:left-[18%] min-w-[200px] bg-white h-[64px] md:h-[70px] px-4 md:px-6 flex items-center justify-between border-b border-gray-200 z-10 transition-all duration-300'>
      <div className='max-w-8xl w-full mx-auto flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='relative'>
            {isZSUser && (
              <>
                <button
                  className='px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] flex items-center justify-center h-10 min-w-[120px] z-50 font-medium text-sm whitespace-nowrap'
                  onClick={() => setShowDropdown(v => !v)}
                >
                  <span className='mr-2'>Create Form</span>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className='absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50'>
                    {APPLICATION_TYPES.map(type => (
                      <button
                        key={type.key}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${!type.enabled ? 'text-gray-400 cursor-not-allowed' : ''}`}
                        onClick={() => handleDropdownClick(type)}
                        disabled={!type.enabled}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className='flex items-center space-x-4 justify-end w-full'>
          <div className='relative'>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className='p-2 text-gray-600 hover:bg-gray-100 rounded-full'
              aria-label='Toggle notifications'
              aria-expanded={showNotifications}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                />
              </svg>
              {unreadCount > 0 && (
                <span className='absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full'>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>
          {hasValidUserName && (
            <Link
              href='/settings'
              className='flex items-center hover:bg-gray-100 rounded-full p-1 transition-colors'
            >
              <div className='bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center font-medium'>
                {displayName!.charAt(0).toUpperCase()}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
