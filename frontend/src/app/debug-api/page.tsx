'use client';

import { useEffect, useState } from 'react';
import { fetchAllApplications, fetchApplicationCounts, getApplicationsByStatus } from '@/services/sidebarApiCalls';
import { ApplicationData } from '@/types/applicationTypes';
import { STATUS_MAP } from '@/services/sidebarApiCalls';

export default function DebugAPIPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching all applications...');
        const allApps = await fetchAllApplications();
        console.log('📦 All applications:', allApps);
        setApplications(allApps);

        console.log('🔄 Fetching application counts...');
        const appCounts = await fetchApplicationCounts();
        console.log('📊 Application counts:', appCounts);
        setCounts(appCounts);

        // Test filtering for each status
        console.log('\n🔍 Testing status filtering:');
        console.log('STATUS_MAP:', STATUS_MAP);

        ['pending', 'forwarded', 'returned', 'flagged', 'disposed', 'approved'].forEach(status => {
          const filtered = getApplicationsByStatus(allApps, status);
          console.log(`${status}: ${filtered.length} applications`, filtered.map(app => ({ id: app.id, status: app.status, status_id: app.status_id })));
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading debug data...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Debug Information</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Application Counts</h2>
          {counts && (
            <div className="space-y-2 text-sm">
              <div>Pending: {counts.pendingCount}</div>
              <div>Forwarded: {counts.forwardedCount}</div>
              <div>Returned: {counts.returnedCount}</div>
              <div>Red Flagged: {counts.redFlaggedCount}</div>
              <div>Disposed: {counts.disposedCount}</div>
              <div>Approved: {counts.approvedCount}</div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Status Mapping</h2>
          <div className="text-sm space-y-2">
            <div>PENDING: {STATUS_MAP.pending}</div>
            <div>FORWARD: {STATUS_MAP.forward}</div>
            <div>RETURNED: {STATUS_MAP.returned}</div>
            <div>FLAGGED: {STATUS_MAP.flagged}</div>
            <div>DISPOSED: {STATUS_MAP.disposed}</div>
            <div>APPROVED: {STATUS_MAP.approved}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Raw Applications ({applications.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Status ID</th>
                  <th className="text-left p-2">Forwarded From</th>
                  <th className="text-left p-2">Flagged</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 10).map((app) => (
                  <tr key={app.id} className="border-b">
                    <td className="p-2">{app.id}</td>
                    <td className="p-2">{app.fullName}</td>
                    <td className="p-2">{app.status}</td>
                    <td className="p-2">{app.status_id}</td>
                    <td className="p-2">{app.forwardedFrom || 'N/A'}</td>
                    <td className="p-2">{app.isFlagged ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {applications.length > 10 && (
              <p className="text-gray-500 text-xs mt-2">Showing first 10 of {applications.length} applications</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-100 p-4 rounded text-xs">
        <p className="font-semibold mb-2">Check browser console for detailed logs</p>
        <p>This page fetches all applications and tests the filtering logic. Check the browser console (F12) for detailed logging information.</p>
      </div>
    </div>
  );
}
