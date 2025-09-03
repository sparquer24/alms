"use client";
import React, { useEffect, useState, useCallback } from 'react';
import ApplicationTable from '../../../components/ApplicationTable';
import { useApplications } from '../../../context/ApplicationContext';
import { useParams } from 'next/navigation';
import { normalizeRouteStatus, toDisplayStatus } from '../../../utils/statusNormalize';
import { fetchMappedApplications } from '../../../services/fetchAndMapApplications';
import type { ApplicationData } from '../../../config/mockData';

export default function InboxStatusPage() {
  const { applications, setApplicationsForStatus, getApplicationsForStatus, setApplications, getStatusTimestamp } = useApplications();
  const [lastRefreshed, setLastRefreshed] = useState<number | undefined>();
  const params = useParams();
  const routeStatus = params?.status as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (segment: string | undefined) => {
    const canonical = normalizeRouteStatus(segment);
    if (!canonical) return;
    // Cache check
    const cached = getApplicationsForStatus(canonical);
    if (cached && cached.length) {
      setApplications(cached); // keep compatibility
      setLastRefreshed(getStatusTimestamp(canonical));
      return; // skip network
    }
    setLoading(true);
    setError(null);
    try {
      const mapped = await fetchMappedApplications(canonical);
    setApplicationsForStatus(canonical, mapped);
    setLastRefreshed(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [getApplicationsForStatus, setApplicationsForStatus, setApplications, getStatusTimestamp]);

  useEffect(() => {
    fetchData(routeStatus);
  }, [routeStatus, fetchData]);

  // Update document title for clarity
  useEffect(() => {
    if (routeStatus) {
      const canonical = normalizeRouteStatus(routeStatus);
      document.title = `Inbox - ${toDisplayStatus(canonical)}`;
    }
  }, [routeStatus]);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold capitalize">{toDisplayStatus(normalizeRouteStatus(routeStatus))}</h2>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {loading && <span>Loading…</span>}
          {!loading && lastRefreshed && (
            <span>Last refreshed: {new Date(lastRefreshed).toLocaleTimeString()}</span>
          )}
          {!loading && !lastRefreshed && <span>Not loaded</span>}
        </div>
      </div>
      {error && (
        <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}
      <ApplicationTable applications={applications} isLoading={loading} />
    </div>
  );
}
