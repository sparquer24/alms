"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSync } from '@/hooks/useAuthSync';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';
import { getCookie } from 'cookies-next';

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  "View Permissions": [
    "canViewFreshForm",
    "canViewForwarded", 
    "canViewReturned",
    "canViewRedFlagged",
    "canViewDisposed",
    "canViewSent",
    "canViewFinalDisposal",
    "canViewReports",
    "canAccessSettings"
  ],
  "Action Permissions": [
    "canSubmitApplication",
    "canCaptureUIN",
    "canCaptureBiometrics", 
    "canUploadDocuments",
    "canForwardToACP",
    "canForwardToSHO",
    "canForwardToDCP",
    "canForwardToAS",
    "canForwardToCP",
    "canConductEnquiry",
    "canAddRemarks",
    "canApproveTA",
    "canApproveAI",
    "canReject",
    "canRequestResubmission",
    "canGeneratePDF"
  ]
};

// Mock data for permissions
const mockPermissions = [
  {
    id: "canViewFreshForm",
    name: "View Fresh Forms",
    category: "View Permissions",
    description: "Ability to view fresh application forms",
    roles: ["ZS", "SHO", "ACP", "DCP"]
  },
  {
    id: "canViewForwarded",
    name: "View Forwarded Applications", 
    category: "View Permissions",
    description: "Ability to view applications forwarded to user",
    roles: ["SHO", "ACP", "DCP", "CP"]
  },
  {
    id: "canViewReturned",
    name: "View Returned Applications",
    category: "View Permissions", 
    description: "Ability to view returned applications",
    roles: ["APPLICANT", "SHO", "ACP", "DCP"]
  },
  {
    id: "canViewRedFlagged",
    name: "View Red Flagged Applications",
    category: "View Permissions",
    description: "Ability to view red flagged applications", 
    roles: ["SHO", "ACP", "DCP", "CP"]
  },
  {
    id: "canViewDisposed",
    name: "View Disposed Applications",
    category: "View Permissions",
    description: "Ability to view disposed applications",
    roles: ["ACP", "DCP", "CP"]
  },
  {
    id: "canViewSent",
    name: "View Sent Applications", 
    category: "View Permissions",
    description: "Ability to view sent applications",
    roles: ["APPLICANT", "SHO", "ACP", "DCP"]
  },
  {
    id: "canViewFinalDisposal",
    name: "View Final Disposal",
    category: "View Permissions",
    description: "Ability to view final disposal applications",
    roles: ["APPLICANT", "DCP", "CP"]
  },
  {
    id: "canViewReports",
    name: "View Reports",
    category: "View Permissions", 
    description: "Ability to view system reports",
    roles: ["SHO", "ACP", "DCP", "CP", "ADMIN"]
  },
  {
    id: "canAccessSettings",
    name: "Access Settings",
    category: "View Permissions",
    description: "Ability to access system settings",
    roles: ["SHO", "ACP", "DCP", "CP", "ADMIN"]
  },
  {
    id: "canSubmitApplication",
    name: "Submit Application",
    category: "Action Permissions",
    description: "Ability to submit new applications",
    roles: ["APPLICANT"]
  },
  {
    id: "canCaptureUIN",
    name: "Capture UIN",
    category: "Action Permissions",
    description: "Ability to capture UIN for applications",
    roles: ["ZS"]
  },
  {
    id: "canCaptureBiometrics",
    name: "Capture Biometrics", 
    category: "Action Permissions",
    description: "Ability to capture biometric data",
    roles: ["ZS"]
  },
  {
    id: "canUploadDocuments",
    name: "Upload Documents",
    category: "Action Permissions",
    description: "Ability to upload documents",
    roles: ["APPLICANT", "ZS", "SHO"]
  },
  {
    id: "canForwardToACP",
    name: "Forward to ACP",
    category: "Action Permissions",
    description: "Ability to forward applications to ACP",
    roles: ["SHO", "DCP", "ZS"]
  },
  {
    id: "canForwardToSHO",
    name: "Forward to SHO",
    category: "Action Permissions",
    description: "Ability to forward applications to SHO",
    roles: ["ACP"]
  },
  {
    id: "canForwardToDCP",
    name: "Forward to DCP",
    category: "Action Permissions",
    description: "Ability to forward applications to DCP",
    roles: ["ACP", "ZS", "SHO"]
  },
  {
    id: "canForwardToAS",
    name: "Forward to AS",
    category: "Action Permissions",
    description: "Ability to forward applications to AS",
    roles: ["DCP", "ACP"]
  },
  {
    id: "canForwardToCP",
    name: "Forward to CP",
    category: "Action Permissions",
    description: "Ability to forward applications to CP",
    roles: ["DCP", "ACP"]
  },
  {
    id: "canConductEnquiry",
    name: "Conduct Enquiry",
    category: "Action Permissions",
    description: "Ability to conduct enquiries",
    roles: ["SHO"]
  },
  {
    id: "canAddRemarks",
    name: "Add Remarks",
    category: "Action Permissions",
    description: "Ability to add remarks to applications",
    roles: ["SHO", "ACP", "DCP", "CP"]
  },
  {
    id: "canApproveTA",
    name: "Approve TA",
    category: "Action Permissions",
    description: "Ability to approve TA applications",
    roles: ["DCP", "ACP"]
  },
  {
    id: "canApproveAI",
    name: "Approve AI",
    category: "Action Permissions",
    description: "Ability to approve AI applications",
    roles: ["CP"]
  },
  {
    id: "canReject",
    name: "Reject Applications",
    category: "Action Permissions",
    description: "Ability to reject applications",
    roles: ["DCP", "ACP", "CP"]
  },
  {
    id: "canRequestResubmission",
    name: "Request Resubmission",
    category: "Action Permissions",
    description: "Ability to request application resubmission",
    roles: ["DCP", "CP"]
  },
  {
    id: "canGeneratePDF",
    name: "Generate PDF",
    category: "Action Permissions",
    description: "Ability to generate PDF documents",
    roles: ["ZS"]
  }
];

export default function PermissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Filter permissions based on search and category
  const filteredPermissions = mockPermissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading permissions...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
              <p className="text-gray-600 mt-1">Manage system permissions and their assignments</p>
            </div>
            <button
              onClick={() => router.push('/admin/permissions/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Permission
            </button>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {Object.keys(PERMISSION_CATEGORIES || {}).map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Display search information if applied */}
          {searchQuery && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-700">Search Results:</h3>
              <p className="text-sm text-gray-700 mt-1">Searching for: "{searchQuery}"</p>
            </div>
          )}

          {/* Show permission count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredPermissions.length} permission(s)
            </p>
          </div>

          {/* Permissions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPermissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        <div className="text-sm text-gray-500">{permission.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {permission.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {permission.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {permission.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/permissions/${permission.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => router.push(`/admin/permissions/${permission.id}`)}
                        className="text-green-600 hover:text-green-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPermissions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No permissions found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 