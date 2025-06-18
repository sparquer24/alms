"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import Header from '../../../components/Header';
import ApplicationTable from '../../../components/ApplicationTable';
import { useAuth } from '../../../config/auth';
import { mockApplications, filterApplications, getApplicationsByStatus } from '../../../config/mockData';

// This will be a generic page for all inbox items (forwarded, returned, flagged, disposed)
export default function InboxPage({ params }: { params: { type: string } }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const type = params.type; // forwarded, returned, flagged, or disposed
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
    
    // Set active item in localStorage to prevent redirection
    localStorage.setItem('activeNavItem', type);
  }, [isAuthenticated, router, type]);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [type]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDateFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  // Get page title based on inbox type
  const getPageTitle = () => {
    switch (type) {
      case 'forwarded':
        return 'Forwarded Applications';
      case 'returned':
        return 'Returned Applications';
      case 'flagged':
        return 'Red Flagged Applications';
      case 'disposed':
        return 'Disposed Applications';
      default:
        return 'Applications';
    }
  };

  // Filter applications based on the inbox type and search/date filters
  const filteredApplications = filterApplications(
    getApplicationsByStatus(mockApplications, type),
    searchQuery,
    startDate,
    endDate
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />

      <main className="flex-1 p-8 overflow-y-auto ml-[18%] mt-[70px]">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">{getPageTitle()}</h1>
          
          {/* Display search and filter information if applied */}
          {(searchQuery || startDate || endDate) && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-700">Active Filters:</h3>
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                {searchQuery && <p>Search: {searchQuery}</p>}
                {(startDate || endDate) && (
                  <p>Date Range: {startDate || "Any"} to {endDate || "Any"}</p>
                )}
              </div>
            </div>
          )}

          {/* Show application count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredApplications.length} {type === 'flagged' ? 'red flagged' : type} application(s)
            </p>
          </div>

          {/* Display the application table */}
          <ApplicationTable
            applications={filteredApplications}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
