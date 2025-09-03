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
  const { isAuthenticated, isLoading: authLoading, userRole } = useAuthSync();
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

  // Filter applications based on final/approved status and search/date filters
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
        userRole={userRole}
      />
      <main className="flex-1 p-8 overflow-y-auto ml-[18%]">
        <h1 className="text-2xl font-bold mb-8">Final Disposal Applications</h1>
  <ApplicationTable applications={filteredApplications} isLoading={isLoading} error={error} />
      </main>
    </div>
  );
}
