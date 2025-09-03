"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuthSync } from '../../hooks/useAuthSync';
import { filterApplications, ApplicationData } from '../../config/mockData';
import { fetchMappedApplications } from '../../services/fetchAndMapApplications';
import { normalizeRouteStatus, toDisplayStatus } from '../../utils/statusNormalize';

export default function ClosedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const [applications, setApplications] = useState<ApplicationData[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const closedCanonical = normalizeRouteStatus('closed') || 'closed';
        const disposedCanonical = normalizeRouteStatus('disposed') || 'disposed';
        const mapped = await fetchMappedApplications([closedCanonical, disposedCanonical]);
        setApplications(mapped as ApplicationData[]);
      } catch (e) {
        console.error('Failed to load closed applications', e);
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

  // Filter applications based on closed/disposed status and search/date filters
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
      <main className="flex-1 p-8 overflow-y-auto ml-[18%]">
  <h1 className="text-2xl font-bold mb-8">{toDisplayStatus('closed')} Applications</h1>
        <ApplicationTable applications={filteredApplications} isLoading={isLoading} />
      </main>
    </div>
  );
}
