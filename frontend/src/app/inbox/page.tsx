"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuthSync } from '../../hooks/useAuthSync';
import { fetchApplicationsByStatusKey, filterApplications } from '../../services/sidebarApiCalls';
import { ApplicationData } from '../../types';
import { PageLayoutSkeleton } from '../../components/Skeleton';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryType = searchParams?.get('type') || '';

  const [type, setType] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();

  useEffect(() => {
    if (!queryType) return;
    setType(queryType);
  }, [queryType]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!type) return;

    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const apps = await fetchApplicationsByStatusKey(type);
        setApplications(apps);
      } catch (err) {
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) fetchApplications();
    else if (!authLoading && !isAuthenticated) setIsLoading(false);
  }, [type, authLoading, isAuthenticated]);

  const filteredApplications = applications.length > 0
    ? filterApplications(applications, searchQuery, startDate, endDate)
    : [];

  if (!type) return <PageLayoutSkeleton />;

  const getPageTitle = () => {
    switch (type) {
      case 'forwarded': return 'Forwarded Applications';
      case 'returned': return 'Returned Applications';
      case 'redflagged': return 'Red Flagged Applications';
      case 'disposed': return 'Disposed Applications';
      case 'drafts': return 'Draft Applications';
      case 'finaldisposal': return 'Final Disposal Applications';
      case 'sent' : return 'Sent Applications';
      case 'closed' : return 'Closed Applications';
      case 'freshform': return 'Fresh Form Applications';
      default: return 'Applications';
    }
  };

  return (
    <div className="max-w-8xl w-full mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{getPageTitle()}</h1>
        {(searchQuery || startDate || endDate) && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="font-semibold text-blue-700">Active Filters:</h3>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              {searchQuery && <p>Search: {searchQuery}</p>}
              {(startDate || endDate) && (
                <p>Date Range: {startDate || 'Any'} to {endDate || 'Any'}</p>
              )}
            </div>
          </div>
        )}

        <ApplicationTable applications={filteredApplications} isLoading={isLoading} pageType={type || undefined} />
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function InboxQueryPage() {
  return (
    <Suspense fallback={<PageLayoutSkeleton />}>
      <InboxContent />
    </Suspense>
  );
}
