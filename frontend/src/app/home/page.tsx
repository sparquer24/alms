"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { filterApplications } from '../../services/sidebarApiCalls';
import { ApplicationData } from '../../types';
import { PageLayoutSkeleton } from '../../components/Skeleton';
import ApplicationTable from '../../components/ApplicationTable';
import { useInbox } from '../../context/InboxContext';

export default function HomePage() {
  const searchParams = useSearchParams();
  const queryTypeParam = searchParams?.get('type');
  const queryType = queryTypeParam ? String(queryTypeParam).toLowerCase() : null;
  const [type, setType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { selectedType, applications, isLoading, loadType } = useInbox();

  useEffect(() => {
    // sync local type with query param
    if (queryType) {
      const normalized = String(queryType).toLowerCase();
      setType(normalized);
      if (selectedType !== normalized) {
        loadType(normalized).catch((e) => console.error('HomePage loadType error', e));
      }
    }
  }, [queryType, selectedType, loadType]);

  if (!type) return <PageLayoutSkeleton />;

  const filtered = (applications?.length > 0 ? filterApplications(applications as ApplicationData[], searchQuery, startDate, endDate) : []) as ApplicationData[];
  // for the type i want to make first letter uppercase and rest lowercase
  const displayType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return (
    // full width parent so we can push the card to the far right using `ml-auto` on the card
    <div className="w-full">
      <div className="bg-white rounded-lg shadow p-6 ml-auto w-full max-w-[1400px]">
        <h1 className="text-2xl font-bold mb-6">{displayType} Applications</h1>
        <ApplicationTable applications={filtered} isLoading={isLoading} />
      </div>
    </div>
  );
}

