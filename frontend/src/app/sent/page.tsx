"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuthSync } from '../../hooks/useAuthSync';
import { filterApplications, ApplicationData } from '../../services/sidebarApiCalls';
import { ApplicationApi } from '../../config/APIClient';

export default function SentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Load applications from API and filter to "sent"
    const load = async () => {
      try {
        const res = await ApplicationApi.getAll();
        console.log('API Response (sent page):', res);
        
        // The API returns {success: true, message: '...', data: Array(1), pagination: {...}}
        // We need to access the 'data' property
        let apps: any[] = [];
        if (res && typeof res === 'object') {
          if (res.data && Array.isArray(res.data)) {
            apps = res.data;
          } else if (res.body && Array.isArray(res.body)) {
            apps = res.body;
          } else if (Array.isArray(res)) {
            apps = res;
          }
        }
        
        // Filter to sent status and store
        const sentApps = apps.filter(a => a.status === 'sent');
        console.log('Extracted sent applications:', sentApps);
        setApplications(sentApps as ApplicationData[]);
        setIsLoading(false);
        // Put sent apps into local state by setting a variable used by render
        // We'll reuse filteredApplications computation below by temporarily assigning to mock source
        // For now, store sentApps on a ref-like variable via closure
        // Simpler: set a local global-level variable via window (temporary) - but instead we'll use a state
      } catch (err) {
        console.error('Failed to load sent applications:', err);
        setIsLoading(false);
      }
    };
    load();
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

  // Filter applications based on sent status and search/date filters
  const filteredApplications = filterApplications(
    // Use fetched applications (already filtered to 'sent')
    applications,
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
          <h1 className="text-2xl font-bold mb-6">Sent Applications</h1>
          
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
              Showing {filteredApplications.length} sent application(s)
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
