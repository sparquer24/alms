"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuthSync } from '../../hooks/useAuthSync';
import { filterApplications, getApplicationsByStatus, fetchApplicationsByStatusKey, ApplicationData } from '../../services/sidebarApiCalls';
import { PageLayoutSkeleton } from '../../components/Skeleton';

export default function FinalDisposalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch final disposal applications
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        
        // Fetch final disposal applications using the utility function
        const fetchedApplications = await fetchApplicationsByStatusKey('finaldisposal');
        setApplications(fetchedApplications);
      } catch (error) {
        console.error('❌ Error fetching final disposal applications:', error);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const { isAuthenticated, isLoading: authLoading, userRole } = useAuthSync();
  const router = useRouter();

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

  // Filter applications based on final/approved status and search/date filters
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
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
        userRole={userRole}
      />
      <main className="flex-1 p-8 overflow-y-auto ml-[18%] mt-[70px]">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Final Disposal Applications</h1>
          
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
              Showing {filteredApplications.length} final disposal application(s)
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
