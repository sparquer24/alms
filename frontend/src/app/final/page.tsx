"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuthSync } from '../../hooks/useAuthSync';
import { filterApplications, ApplicationData } from '../../config/mockData';
import { fetchMappedApplications } from '../../services/fetchAndMapApplications';
import { normalizeRouteStatus } from '../../utils/statusNormalize';

export default function FinalDisposalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const canonical = normalizeRouteStatus('finaldisposal') || 'final_disposal';
        // Include approved in case backend uses that
        const data = await fetchMappedApplications([canonical, 'approved']);
        setApplications(data);
      } catch (e) {
        setError('Failed to load final disposal applications');
      } finally {
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

  // Filter applications based on final disposal status and search/date filters
  const filteredApplications = filterApplications(
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
          <h1 className="text-2xl font-bold mb-6">Final Disposal</h1>
          
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
          <div className="mb-6 flex items-center justify-between text-sm text-gray-600">
            <p>Showing {filteredApplications.length} finalized application(s)</p>
            {error && <span className="text-red-600">{error}</span>}
          </div>

          {/* Display the application table */}
          <ApplicationTable
            applications={filteredApplications}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
