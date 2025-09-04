/**
 * Example: How to use the new sidebarApiCalls service
 * This demonstrates the conversion from mockData to real API calls
 */

import React, { useState, useEffect } from 'react';
import {
  fetchAllApplications,
  fetchApplicationsByStatus,
  fetchApplicationCounts,
  searchApplications,
  ApplicationData,
  STATUS_MAP
} from '../services/sidebarApiCalls';

export const ApiCallsExample: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [counts, setCounts] = useState({
    forwardedCount: 0,
    returnedCount: 0,
    redFlaggedCount: 0,
    disposedCount: 0,
    pendingCount: 0,
    approvedCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Example 1: Fetch all applications (replaces mockApplications)
  const handleFetchAll = async () => {
    setLoading(true);
    try {
      const apps = await fetchAllApplications();
      setApplications(apps);
      console.log('✅ Fetched all applications:', apps.length);
    } catch (error) {
      console.error('❌ Error fetching all applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Fetch applications by status (replaces getApplicationsByStatus with mockData)
  const handleFetchByStatus = async (status: string) => {
    setLoading(true);
    setSelectedStatus(status);
    try {
      let statusId: string | number = status;
      
      // Map status to numeric ID if needed
      switch (status) {
        case 'pending':
          statusId = STATUS_MAP.pending;
          break;
        case 'approved':
          statusId = STATUS_MAP.approved;
          break;
        case 'returned':
          statusId = STATUS_MAP.returned;
          break;
        case 'flagged':
          statusId = STATUS_MAP.flagged;
          break;
        case 'disposed':
          statusId = STATUS_MAP.disposed;
          break;
        case 'sent':
          statusId = STATUS_MAP.sent;
          break;
      }
      
      const apps = await fetchApplicationsByStatus(statusId);
      setApplications(apps);
      console.log(`✅ Fetched ${status} applications:`, apps.length);
    } catch (error) {
      console.error(`❌ Error fetching ${status} applications:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Fetch application counts (for sidebar badges)
  const handleFetchCounts = async () => {
    try {
      const newCounts = await fetchApplicationCounts();
      setCounts(newCounts);
      console.log('✅ Fetched application counts:', newCounts);
    } catch (error) {
      console.error('❌ Error fetching application counts:', error);
    }
  };

  // Example 4: Search applications with filters (replaces filterApplications)
  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const result = await searchApplications({
        searchQuery,
        page: 1,
        limit: 10
      });
      setApplications(result.applications);
      console.log('✅ Search results:', result);
    } catch (error) {
      console.error('❌ Error searching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load counts on component mount
  useEffect(() => {
    handleFetchCounts();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Calls Example</h1>
      
      {/* Status Counts Display */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Application Counts</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{counts.forwardedCount}</div>
            <div className="text-sm text-gray-600">Forwarded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{counts.returnedCount}</div>
            <div className="text-sm text-gray-600">Returned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{counts.redFlaggedCount}</div>
            <div className="text-sm text-gray-600">Red Flagged</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{counts.disposedCount}</div>
            <div className="text-sm text-gray-600">Disposed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{counts.pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{counts.approvedCount}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </div>
        <button
          onClick={handleFetchCounts}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Counts
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleFetchAll}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          {loading && selectedStatus === 'all' ? 'Loading...' : 'Fetch All Applications'}
        </button>
        
        {['pending', 'approved', 'returned', 'flagged', 'disposed', 'sent'].map((status) => (
          <button
            key={status}
            onClick={() => handleFetchByStatus(status)}
            disabled={loading}
            className={`px-4 py-2 rounded text-white hover:opacity-80 disabled:bg-gray-300 ${
              selectedStatus === status ? 'bg-blue-700' : 'bg-blue-500'
            }`}
          >
            {loading && selectedStatus === status ? 'Loading...' : `${status.charAt(0).toUpperCase() + status.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Search Example */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search applications..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch((e.target as HTMLInputElement).value);
            }
          }}
          className="w-full px-4 py-2 border rounded-md"
        />
        <p className="text-sm text-gray-600 mt-1">Press Enter to search</p>
      </div>

      {/* Results Display */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            Applications ({applications.length})
            {selectedStatus !== 'all' && (
              <span className="text-sm font-normal text-gray-600"> - {selectedStatus}</span>
            )}
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No applications found. Click a button above to fetch data.
          </div>
        ) : (
          <div className="divide-y">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{app.applicantName}</h3>
                    <p className="text-sm text-gray-600">ID: {app.id}</p>
                    <p className="text-sm text-gray-600">Mobile: {app.applicantMobile}</p>
                    <p className="text-sm text-gray-600">Type: {app.applicationType}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(app.applicationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {applications.length > 5 && (
              <div className="p-4 text-center text-gray-500">
                ... and {applications.length - 5} more applications
              </div>
            )}
          </div>
        )}
      </div>

      {/* Migration Notes */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Migration from mockData.ts Complete! 🎉</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ <code>mockApplications</code> → <code>fetchAllApplications()</code></li>
          <li>✅ <code>getApplicationsByStatus(mockApplications, status)</code> → <code>fetchApplicationsByStatus(status)</code></li>
          <li>✅ <code>filterApplications()</code> → <code>searchApplications()</code> with filters</li>
          <li>✅ Manual counting → <code>fetchApplicationCounts()</code> for sidebar badges</li>
          <li>✅ All components now use <code>../services/sidebarApiCalls</code> instead of <code>../config/mockData</code></li>
        </ul>
      </div>
    </div>
  );
};

export default ApiCallsExample;
