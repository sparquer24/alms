"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import Header from '../../../components/Header';
import ApplicationTable from '../../../components/ApplicationTable';
import { useAuthSync } from '../../../hooks/useAuthSync';
import { fetchApplicationsByStatusKey, filterApplications } from '../../../services/sidebarApiCalls';
import { ApplicationData } from '../../../types';
import { useAuth } from '../../../config/auth';
import { getCookie } from 'cookies-next';
import React from 'react';
import { PageLayoutSkeleton } from '../../../components/Skeleton';

// This will be a generic page for all inbox items (forwarded, returned, flagged, disposed)
export default function InboxPage({ params }: { params: Promise<{ type: string }> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const router = useRouter();
  const [type, setType] = useState<string | null>(null);
  const { userId } = useAuth();

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      const resolvedParams = await params;
      if (isMounted) setType(resolvedParams.type);
    })();
    return () => { isMounted = false; };
  }, [params]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (type) {
      localStorage.setItem('activeNavItem', type);
    }
  }, [isAuthenticated, router, type]);

  // Fetch applications when type changes
  useEffect(() => {
    if (type) {
      const fetchApplications = async () => {
        try {
          setIsLoading(true);
          
          // Fetch applications using the utility function
          const apps = await fetchApplicationsByStatusKey(type);
          setApplications(apps);
        } catch (error) {
          console.error(`❌ Error fetching ${type} applications:`, error);
          setApplications([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchApplications();
    }
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

  const handleTableReload = async (subItem: string) => {
    try {
      console.log('🔄 Reloading table for subItem:', subItem);
      setIsLoading(true);
      
      // Update the current type state to trigger re-fetch
      setType(subItem);
      
      // Fetch applications for the new subItem
      const apps = await fetchApplicationsByStatusKey(subItem);
      setApplications(apps);
    } catch (error) {
      console.error(`❌ Error reloading ${subItem} applications:`, error);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const filteredApplications = applications.length > 0
    ? filterApplications(applications, searchQuery, startDate, endDate)
    : [];

  if (!type) {
    // Wait for params to resolve before rendering to avoid hydration mismatch
    return <PageLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar onTableReload={handleTableReload} />
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
