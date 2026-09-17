"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { PageSubHeader, SubHeaderButton } from '@/components/common/PageSubHeader';
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from '../../config/layoutContext';
import { ApplicationData } from '../../types';
import { ApplicationApi } from '../../config/APIClient';
import { getRoleConfig } from '../../config/roles';
import MyReportsAnalytics from '../../components/MyReportsAnalytics';
import { PageLayoutSkeleton } from '../../components/Skeleton';

const STATUS_MAPPING: Record<string, number[]> = {
  Forwarded: [101, 102],
  Returned: [201, 202],
  'Red Flagged': [301],
  Disposed: [401, 402, 403],
};

function getUserIdFromCookies() {
  const match = document.cookie.match(/user_id=([^;]+)/);
  return match ? match[1] : null;
}

export default function ReportsPage() {
  const [selectedStatusKey, setSelectedStatusKey] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userId } = useAuth();
  const { setShowHeader, setShowSidebar, headerHeight } = useLayout();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // All applications (overview stats) — cached, only refetched when stale.
  const allApplicationsQuery = useQuery({
    queryKey: ['reports', 'allApplications'],
    queryFn: async () => {
      const res = await ApplicationApi.getAll();
      // The API returns {success: true, message: '...', data: Array(1), pagination: {...}}
      // We need to access the 'data' property
      if (res && typeof res === 'object') {
        if ((res as any).data && Array.isArray((res as any).data)) return (res as any).data;
        if ((res as any).body && Array.isArray((res as any).body)) return (res as any).body;
        if (Array.isArray(res)) return res;
      }
      return [] as any[];
    },
    enabled: !selectedStatusKey,
    staleTime: 60_000,
  });

  // Applications filtered by a selected status key from the sidebar.
  const statusApplicationsQuery = useQuery({
    queryKey: ['reports', 'byStatus', selectedStatusKey, userId],
    queryFn: async () => {
      const uid = getUserIdFromCookies();
      const statusIds = selectedStatusKey ? STATUS_MAPPING[selectedStatusKey] : undefined;
      if (!uid || !statusIds) return [] as any[];
      const res = await fetch(`/application/?user_id=${uid}&status_id=${statusIds.join(',')}`);
      const data = await res.json();
      return data || [];
    },
    enabled: !!selectedStatusKey,
    staleTime: 30_000,
  });

  const applications: any[] = selectedStatusKey ? statusApplicationsQuery.data ?? [] : allApplicationsQuery.data ?? [];
  const isLoading = allApplicationsQuery.isLoading;
  const appsLoading = statusApplicationsQuery.isLoading;

  useEffect(() => {
    // Always show header and sidebar on Reports page
    setShowHeader(true);
    setShowSidebar(true);
    return () => {
      setShowHeader(true);
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

  // Get statistics for the report from fetched applications
  const stats = (() => {
    const total = applications.length || 0;
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    const returned = applications.filter(app => app.status === 'returned').length;
    const flagged = applications.filter(app => app.status === 'red-flagged').length;
    const disposed = applications.filter(app => app.status === 'disposed').length;
    return {
      total,
      pending,
      approved,
      rejected,
      returned,
      flagged,
      disposed,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
    };
  })();

  // Show skeleton loading while authenticating or loading
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <PageLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white">
      <Sidebar onStatusSelect={setSelectedStatusKey} />
      <Header />

      <main
        className="flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col pt-[52px] md:pt-[66px]"
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <PageSubHeader
          title="My Reports & Analytics"
          metaBadge={selectedStatusKey ? `Filtered by: ${selectedStatusKey}` : undefined}
          actions={
            selectedStatusKey ? (
              <SubHeaderButton
                onClick={() => setSelectedStatusKey(null)}
                title="Clear status filter"
              >
                Back to Overview
              </SubHeaderButton>
            ) : undefined
          }
        />

        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6">

          {/* Render analytics above the rest of the report UI */}
          <MyReportsAnalytics userId={userId ?? undefined} />

          {selectedStatusKey ? (
            <>
              <button
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setSelectedStatusKey(null)}
              >
                Back to Report Overview
              </button>
              {appsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6366F1]"></div>
                </div>
              ) : (
                <>
                  {/* Parameters example panel */}
                  <div className="mb-4 p-4 bg-gray-50 rounded border">
                    <h3 className="font-semibold mb-2">Request Parameters (example)</h3>
                    <div className="text-sm text-gray-700">
                      <div><strong>Endpoint:</strong> /application/</div>
                      <div><strong>user_id:</strong> {getUserIdFromCookies() ?? 'example_user_id'}</div>
                      <div><strong>status_id:</strong> {JSON.stringify(STATUS_MAPPING[selectedStatusKey] ?? [])}</div>
                      <div className="text-xs text-gray-500 mt-2">Example query: <code>/application/?user_id=123&amp;status_id=101,102</code></div>
                    </div>
                  </div>

                  {applications.length === 0 ? (
                    <div className="text-center text-gray-500">No applications found for this status.</div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app: any) => (
                        <div key={app.applicationId || app.id} className="border rounded p-4 flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{app.applicantName || app.name || 'Applicant Name'}</div>
                            <div className="text-sm text-gray-500">{app.applicationId || app.id} • {app.createdAt || app.submittedAt || '2025-09-01'}</div>
                            <div className="text-sm mt-2 text-gray-600">Acknowledgement: {app.acknowledgementNumber || 'N/A'}</div>
                            <div className="text-sm mt-1 text-gray-600">Created By: {app.createdBy || 'System'}</div>
                            <div className="text-sm mt-1 text-gray-600">Source: {app.createdFrom || 'Web'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-3">{app.status || selectedStatusKey}</div>
                            <div className="space-x-2">
                              <button className="text-blue-600 hover:underline">View</button>
                              <button className="text-green-600 hover:underline">Download</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800">Total Applications</h3>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <h3 className="text-sm font-medium text-yellow-800">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-sm font-medium text-green-800">Approved</h3>
                  <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <h3 className="text-sm font-medium text-red-800">Rejected</h3>
                  <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">Application Status Breakdown</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Pending</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div className="bg-yellow-500 h-4 rounded-full" style={{width: `${(stats.pending / stats.total) * 100}%`}}></div>
                    </div>
                    <span className="text-right w-16">{Math.round((stats.pending / stats.total) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Approved</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div className="bg-green-500 h-4 rounded-full" style={{width: `${(stats.approved / stats.total) * 100}%`}}></div>
                    </div>
                    <span className="text-right w-16">{Math.round((stats.approved / stats.total) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rejected</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div className="bg-red-500 h-4 rounded-full" style={{width: `${(stats.rejected / stats.total) * 100}%`}}></div>
                    </div>
                    <span className="text-right w-16">{Math.round((stats.rejected / stats.total) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Returned</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div className="bg-orange-500 h-4 rounded-full" style={{width: `${(stats.returned / stats.total) * 100}%`}}></div>
                    </div>
                    <span className="text-right w-16">{Math.round((stats.returned / stats.total) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Flagged</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div className="bg-red-400 h-4 rounded-full" style={{width: `${(stats.flagged / stats.total) * 100}%`}}></div>
                    </div>
                    <span className="text-right w-16">{Math.round((stats.flagged / stats.total) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Disposed</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div className="bg-gray-400 h-4 rounded-full" style={{width: `${(stats.disposed / stats.total) * 100}%`}}></div>
                    </div>
                    <span className="text-right w-16">{Math.round((stats.disposed / stats.total) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h2 className="text-lg font-bold mb-4">Performance Metrics</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Processing Time</span>
                      <span className="font-bold">7.4 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval Rate</span>
                      <span className="font-bold">{stats.approvalRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applications Processed Today</span>
                      <span className="font-bold">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applications Processed This Week</span>
                      <span className="font-bold">12</span>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6">
                  <h2 className="text-lg font-bold mb-4">Report Actions</h2>
                  <div className="space-y-4">
                    <button className="w-full px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5]">
                      Download Full Report (PDF)
                    </button>
                    <button className="w-full px-4 py-2 border border-[#6366F1] text-[#6366F1] rounded-md hover:bg-[#EEF2FF]">
                      Export Data (Excel)
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                      Schedule Regular Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
