import React, { useState, useEffect } from 'react';
import { useLayout } from '../config/layoutContext';
import { useAuth } from '../config/auth';
import { useNotifications } from '../config/notificationContext';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';

interface HeaderProps {
  onSearch: (query: string) => void;
  onDateFilter: (startDate: string, endDate: string) => void;
  onReset: () => void;
}

const Header = ({ onSearch, onDateFilter, onReset }: HeaderProps) => {
  const { showHeader } = useLayout();
  const { userName } = useAuth();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Control visibility with animation
  useEffect(() => {
    if (showHeader) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 400); // Match transition duration
    }
  }, [showHeader]);

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleDateFilter = () => {
    onDateFilter(startDate, endDate);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    onReset();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };  if (!visible && !showHeader) return null;
  
  return (
    <header className={`fixed top-0 right-0 left-[18%] min-w-[250px] bg-white h-[70px] px-6 flex items-center justify-between border-b border-gray-200 z-10 transition-all duration-300 ${showHeader ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-full'}`}>
      {/* Left side - Search Bar */}
      <div className="w-[50%] relative">
        <input
          type="text"
          placeholder="Search by ID, Name, Mobile Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] transition-colors"
        />
        <button 
          onClick={handleSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>      {/* Right side - Date Range Filter and Action Buttons */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onClick={(e) => (e.currentTarget.type = 'date')}
              onBlur={(e) => {
                if (!e.currentTarget.value) e.currentTarget.type = 'text';
              }}
              className="py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] w-[160px]"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <span className="text-gray-500">to</span>
          <div className="relative">
            <input
              type="text"
              placeholder="DD-MM-YYYY"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onClick={(e) => (e.currentTarget.type = 'date')}
              onBlur={(e) => {
                if (!e.currentTarget.value) e.currentTarget.type = 'text';
              }}
              className="py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] w-[160px]"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="py-2 px-4 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Reset
          </button>
          <button
            onClick={handleDateFilter}
            className="py-2 px-4 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] transition-colors font-medium"
          >
            Search
          </button>
        </div>
        
        {/* Notifications Icon */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>
        
        {/* User Profile */}
        <Link href="/settings" className="flex items-center hover:bg-gray-100 rounded-full p-1 transition-colors">
          <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
