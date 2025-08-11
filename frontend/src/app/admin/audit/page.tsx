"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSync } from '@/hooks/useAuthSync';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';

// Mock data for audit logs
const mockAuditLogs = [
  {
    id: "1",
    userId: "user123",
    userName: "John Doe",
    userRole: "DCP",
    action: "Application Forwarded",
    details: "Application #ALMS-2024-001 forwarded to ACP",
    applicationId: "ALMS-2024-001",
    timestamp: "2024-01-20T10:30:00Z",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    id: "2",
    userId: "user456",
    userName: "Jane Smith",
    userRole: "ACP",
    action: "Application Approved",
    details: "Application #ALMS-2024-002 approved with TA",
    applicationId: "ALMS-2024-002",
    timestamp: "2024-01-20T09:15:00Z",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  },
  {
    id: "3",
    userId: "user789",
    userName: "Mike Johnson",
    userRole: "SHO",
    action: "Enquiry Conducted",
    details: "Enquiry completed for Application #ALMS-2024-003",
    applicationId: "ALMS-2024-003",
    timestamp: "2024-01-20T08:45:00Z",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    id: "4",
    userId: "user123",
    userName: "John Doe",
    userRole: "DCP",
    action: "User Created",
    details: "New user 'Sarah Wilson' created with role ACP",
    applicationId: null,
    timestamp: "2024-01-19T16:20:00Z",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    id: "5",
    userId: "user456",
    userName: "Jane Smith",
    userRole: "ACP",
    action: "Application Rejected",
    details: "Application #ALMS-2024-004 rejected due to incomplete documents",
    applicationId: "ALMS-2024-004",
    timestamp: "2024-01-19T14:30:00Z",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  },
  {
    id: "6",
    userId: "user789",
    userName: "Mike Johnson",
    userRole: "SHO",
    action: "Document Uploaded",
    details: "Character certificate uploaded for Application #ALMS-2024-005",
    applicationId: "ALMS-2024-005",
    timestamp: "2024-01-19T11:15:00Z",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    id: "7",
    userId: "user123",
    userName: "John Doe",
    userRole: "DCP",
    action: "Role Permissions Updated",
    details: "Permissions updated for role 'ACP'",
    applicationId: null,
    timestamp: "2024-01-18T15:45:00Z",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    id: "8",
    userId: "user456",
    userName: "Jane Smith",
    userRole: "ACP",
    action: "Application Returned",
    details: "Application #ALMS-2024-006 returned for additional documents",
    applicationId: "ALMS-2024-006",
    timestamp: "2024-01-18T13:20:00Z",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  }
];

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading, userRole } = useAuthSync();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    if (userRole !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [isAuthenticated, authLoading, userRole, router]);

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
    setSelectedUser('all');
    setSelectedAction('all');
  };

  // Get unique users and actions for filters
  const uniqueUsers = [...new Set(mockAuditLogs.map(log => log.userName))];
  const uniqueActions = [...new Set(mockAuditLogs.map(log => log.action))];

  // Filter audit logs based on all criteria
  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (log.applicationId && log.applicationId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesUser = selectedUser === 'all' || log.userName === selectedUser;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    
    const logDate = new Date(log.timestamp);
    const matchesStartDate = !startDate || logDate >= new Date(startDate);
    const matchesEndDate = !endDate || logDate <= new Date(endDate + 'T23:59:59');
    
    return matchesSearch && matchesUser && matchesAction && matchesStartDate && matchesEndDate;
  });

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'Application Forwarded': 'bg-blue-100 text-blue-800',
      'Application Approved': 'bg-green-100 text-green-800',
      'Application Rejected': 'bg-red-100 text-red-800',
      'Application Returned': 'bg-yellow-100 text-yellow-800',
      'Enquiry Conducted': 'bg-purple-100 text-purple-800',
      'Document Uploaded': 'bg-indigo-100 text-indigo-800',
      'User Created': 'bg-pink-100 text-pink-800',
      'Role Permissions Updated': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${actionColors[action] || 'bg-gray-100 text-gray-800'}`}>
        {action}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading audit logs...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-1">System activity and action history</p>
            </div>
            <button
              onClick={() => {
                // Export functionality would go here
                alert('Export functionality would be implemented here');
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Export CSV
            </button>
          </div>

          {/* Additional Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Display filter information if applied */}
          {(searchQuery || startDate || endDate || selectedUser !== 'all' || selectedAction !== 'all') && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-700">Active Filters:</h3>
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                {searchQuery && <p>Search: {searchQuery}</p>}
                {(startDate || endDate) && (
                  <p>Date Range: {startDate || "Any"} to {endDate || "Any"}</p>
                )}
                {selectedUser !== 'all' && <p>User: {selectedUser}</p>}
                {selectedAction !== 'all' && <p>Action: {selectedAction}</p>}
              </div>
            </div>
          )}

          {/* Show log count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredLogs.length} audit log(s)
            </p>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                        <div className="text-sm text-gray-500">{log.userRole}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {log.details}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.applicationId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 