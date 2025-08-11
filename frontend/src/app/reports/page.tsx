"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import { useAuthSync } from '../../hooks/useAuthSync';
import { useLayout } from '../../config/layoutContext';
import { mockApplications } from '../../config/mockData';
import { ReportApi } from '../../config/APIClient';
import { useAuth } from '../../config/auth';
import { getRoleConfig } from '../../config/roles';
import MyReportsAnalytics from '../../components/MyReportsAnalytics';

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatusKey, setSelectedStatusKey] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const { userId } = useAuth();
  const { setShowHeader, setShowSidebar } = useLayout();
  const router = useRouter();
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);
  
  useEffect(() => {
    // Always show header and sidebar on Reports page
    setShowHeader(true);
    setShowSidebar(true);
    return () => {
      setShowHeader(true);
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

  // Fetch applications when status key is selected
  useEffect(() => {
    if (selectedStatusKey) {
      const userId = getUserIdFromCookies();
      const statusIds = STATUS_MAPPING[selectedStatusKey];
      if (!userId || !statusIds) return;
      setAppsLoading(true);
      fetch(`/api/application/?user_id=${userId}&status_id=${statusIds.join(',')}`)
        .then(res => res.json())
        .then(data => setApplications(data || []))
        .catch(() => setApplications([]))
        .finally(() => setAppsLoading(false));
    }
  }, [selectedStatusKey]);

  const handleSearch = () => {};
  const handleDateFilter = () => {};
  const handleReset = () => {};

  // Get statistics for the report
  const getStats = () => {
    const total = mockApplications.length;
    const pending = mockApplications.filter(app => app.status === 'pending').length;
    const approved = mockApplications.filter(app => app.status === 'approved').length;
    const rejected = mockApplications.filter(app => app.status === 'rejected').length;
    const returned = mockApplications.filter(app => app.status === 'returned').length;
    const flagged = mockApplications.filter(app => app.status === 'red-flagged').length;
    const disposed = mockApplications.filter(app => app.status === 'disposed').length;
    
    return {
      total,
      pending,
      approved,
      rejected,
      returned,
      flagged,
      disposed,
      approvalRate: Math.round((approved / total) * 100)
    };
  };

  const stats = getStats();
  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar onStatusSelect={setSelectedStatusKey} />
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />

      <main className="flex-1 p-8 overflow-y-auto ml-[18%]">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">My Reports</h1>

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
              ) : applications.length === 0 ? (
                <div className="text-center text-gray-500">No applications found for this status.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Application ID</th>
                        <th className="px-4 py-2">Applicant Name</th>
                        <th className="px-4 py-2">Acknowledgement Number</th>
                        <th className="px-4 py-2">Created By</th>
                        <th className="px-4 py-2">Source</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.applicationId} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{app.applicationId}</td>
                          <td className="px-4 py-2">{app.applicantName}</td>
                          <td className="px-4 py-2">{app.acknowledgementNumber}</td>
                          <td className="px-4 py-2">{app.createdBy}</td>
                          <td className="px-4 py-2">{app.createdFrom}</td>
                          <td className="px-4 py-2">{app.status}</td>
                          <td className="px-4 py-2 space-x-2">
                            <button className="text-blue-600 hover:underline">View</button>
                            <button className="text-green-600 hover:underline">Download</button>
                            <button className="text-purple-600 hover:underline">Forward</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
      </main>
    </div>
  );
}
