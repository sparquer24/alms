"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSync } from '@/hooks/useAuthSync';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';

// Mock data for workflows
const mockWorkflows = [
  {
    id: "1",
    name: "Standard License Application",
    description: "Standard workflow for new license applications",
    fromRole: "APPLICANT",
    toRole: "ZS",
    nextRole: "DCP",
    isActive: true,
    steps: [
      { id: 1, role: "APPLICANT", action: "Submit Application", order: 1 },
      { id: 2, role: "ZS", action: "Capture UIN & Biometrics", order: 2 },
      { id: 3, role: "SHO", action: "Conduct Enquiry", order: 3 },
      { id: 4, role: "ACP", action: "Review & Forward", order: 4 },
      { id: 5, role: "DCP", action: "Final Approval", order: 5 }
    ],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20"
  },
  {
    id: "2", 
    name: "Renewal Application",
    description: "Workflow for license renewal applications",
    fromRole: "APPLICANT",
    toRole: "ZS",
    nextRole: "ACP",
    isActive: true,
    steps: [
      { id: 1, role: "APPLICANT", action: "Submit Renewal", order: 1 },
      { id: 2, role: "ZS", action: "Verify Documents", order: 2 },
      { id: 3, role: "ACP", action: "Approve Renewal", order: 3 }
    ],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18"
  },
  {
    id: "3",
    name: "Transfer Application", 
    description: "Workflow for license transfer applications",
    fromRole: "APPLICANT",
    toRole: "SHO",
    nextRole: "DCP",
    isActive: false,
    steps: [
      { id: 1, role: "APPLICANT", action: "Submit Transfer Request", order: 1 },
      { id: 2, role: "SHO", action: "Verify Transfer Documents", order: 2 },
      { id: 3, role: "DCP", action: "Approve Transfer", order: 3 }
    ],
    createdAt: "2024-01-05",
    updatedAt: "2024-01-12"
  }
];

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Filter workflows based on search and status
  const filteredWorkflows = mockWorkflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.fromRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.toRole.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && workflow.isActive) ||
                         (statusFilter === 'inactive' && !workflow.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workflows...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header />

  <main className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px]">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
              <p className="text-gray-600 mt-1">Manage application workflows and approval processes</p>
            </div>
            <button
              onClick={() => router.push('/admin/workflows/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Workflow
            </button>
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => handleStatusFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleStatusFilter('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Display search information if applied */}
          {searchQuery && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-700">Search Results:</h3>
              <p className="text-sm text-gray-700 mt-1">Searching for: "{searchQuery}"</p>
            </div>
          )}

          {/* Show workflow count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredWorkflows.length} workflow(s)
            </p>
          </div>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{workflow.name}</h3>
                    {getStatusBadge(workflow.isActive)}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/admin/workflows/${workflow.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => router.push(`/admin/workflows/${workflow.id}`)}
                      className="text-green-600 hover:text-green-900 text-sm"
                    >
                      View
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">From Role:</span>
                    <span className="font-medium text-gray-900">{workflow.fromRole}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">To Role:</span>
                    <span className="font-medium text-gray-900">{workflow.toRole}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Next Role:</span>
                    <span className="font-medium text-gray-900">{workflow.nextRole}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Steps:</span>
                    <span className="font-medium text-gray-900">{workflow.steps.length}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredWorkflows.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 