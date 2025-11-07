"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuthSync } from '../../hooks/useAuthSync';
import { getRoleConfig } from '../../config/roles';
import { filterApplications, getApplicationsByStatus, fetchApplicationsByStatusKey } from '../../services/sidebarApiCalls';
import { ApplicationData } from '../../types';
import { PageLayoutSkeleton } from '../../components/Skeleton';

export default function ClosedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated, isLoading: authLoading, userRole } = useAuthSync();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Permission gate: allow users who can view disposed/final disposal/closed
  const roleConfig = getRoleConfig(userRole);
    const perms = roleConfig?.permissions || [];
    const allowed = perms.includes('canViewDisposed') || perms.includes('canViewFinalDisposal') || perms.includes('canViewClosed');
    if (!authLoading && isAuthenticated && !allowed) {
      router.push('/');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    // Fetch closed applications only after auth finishes and user is authenticated
    const loadApplications = async () => {
      try {
        setIsLoading(true);

        // Fetch closed applications using the utility function
        const fetchedApplications = await fetchApplicationsByStatusKey('closed');
        setApplications(fetchedApplications);
      } catch (error) {
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadApplications();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

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

  // Filter applications based on closed/disposed status and search/date filters
  const filteredApplications = filterApplications(
    applications,
    searchQuery,
    startDate,
    endDate
  );

  // Show skeleton loading while authenticating or loading
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <PageLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header />
  <main className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px]">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Closed Applications</h1>
          
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
              Showing {filteredApplications.length} closed application(s)
            </p>
          </div>

          {/* Display the application table */}
          <ApplicationTable 
            applications={filteredApplications} 
            isLoading={isLoading} 
            showActionColumn={true}
          />
        </div>
      </main>
    </div>
  );
}
