"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import Header from '../../../components/Header';
import ApplicationTable from '../../../components/ApplicationTable';
import { useAuthSync } from '../../../hooks/useAuthSync';
import { filterApplications, getApplicationsByStatus, ApplicationData } from '../../../config/mockData';
import { fetchData } from '../../../api/axiosConfig';
import { useAuth } from '../../../config/auth';
import { getCookie } from 'cookies-next';
import React from 'react';

// This will be a generic page for all inbox items (forwarded, returned, flagged, disposed)
export default function InboxPage({ params }: { params: Promise<{ type: string }> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const router = useRouter();
  const [type, setType] = useState<string | null>(null);
  const { userId } = useAuth();
  const [applications, setApplications] = useState<ApplicationData[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      const resolvedParams = await params;
      if (isMounted) setType(resolvedParams.type);
    })();
    return () => { isMounted = false; };
  }, [params]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetchData('/applications');
        const apps = res?.body ?? (res as any)?.data ?? [];
        if (mounted) setApplications(Array.isArray(apps) ? apps : []);
      } catch (e) {
        console.error('Failed to load applications', e);
        if (mounted) setApplications([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    if (type) load();
    return () => { mounted = false; };
  }, [type]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (type) {
      localStorage.setItem('activeNavItem', type);
    }
  }, [isAuthenticated, router, type]);

  useEffect(() => {
    if (type) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
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

  const filteredApplications = filterApplications(
    getApplicationsByStatus(applications, type as string, userId || undefined),
    searchQuery,
    startDate,
    endDate
  );

  if (!type) {
    // Wait for params to resolve before rendering to avoid hydration mismatch
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

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
