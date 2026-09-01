'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminCard,
  AdminTable,
  AdminToolbar,
  AdminFilter,
  AdminTableSkeleton,
  AdminErrorAlert,
  AdminErrorBoundary,
} from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout } from '@/styles/admin-design-system';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  policeStationId?: number;
  stateId?: number;
  districtId?: number;
  zoneId?: number;
  divisionId?: number;
  status: string;
}

const UserListPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dismissedError, setDismissedError] = useState(false);

  // Fetch users with React Query
  const {
    data: users = [],
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Filter users
  const filteredUsers = users.filter(
    user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (roleFilter ? user.role === roleFilter : true)
  );

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.status.success;
      case 'inactive':
        return colors.status.warning;
      case 'suspended':
        return colors.status.error;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <AdminErrorBoundary>
      <div
        style={{
          padding: AdminLayout.content.padding,
          gap: AdminLayout.content.gap,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <AdminToolbar sticky>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: colors.text.primary,
              margin: 0,
            }}
          >
            User Management
          </h1>
        </AdminToolbar>

        {/* Error Alert */}
        {fetchError && !dismissedError && (
          <AdminErrorAlert
            title='Failed to Load Users'
            message={fetchError instanceof Error ? fetchError.message : 'Unknown error'}
            onRetry={() => {
              refetch();
              setDismissedError(false);
            }}
            onDismiss={() => setDismissedError(true)}
          />
        )}

        {/* Filters */}
        <AdminFilter
          filters={{
            search: {
              value: searchQuery,
              label: 'Search',
              type: 'text',
              placeholder: 'Search by username...',
              onChange: handleSearch,
            },
            role: {
              value: roleFilter,
              label: 'All Roles',
              type: 'select',
              options: [
                { value: 'Admin', label: 'Admin' },
                { value: 'User', label: 'User' },
                { value: 'Manager', label: 'Manager' },
              ],
              onChange: handleRoleFilter,
            },
          }}
          onClear={handleClearFilters}
        />

        {/* User Table */}
        {isLoading ? (
          <AdminTableSkeleton rows={8} columns={5} />
        ) : filteredUsers.length === 0 ? (
          <div className='bg-white rounded-lg border border-gray-200 p-12 text-center'>
            <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-6 h-6 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
            </div>
            <p className='text-gray-500 text-sm'>No users found matching your criteria.</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-gray-50 border-b border-gray-200'>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>Username</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>Email</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>Role</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>Status</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>State</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>District</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>Station</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>Zone</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider'>Division</th>
                    <th scope='col' className='px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3 text-sm font-medium text-gray-900'>{user.username}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{user.email}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{user.role}</td>
                      <td className='px-4 py-3 text-sm'>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{user.stateId || '—'}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{user.districtId || '—'}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{user.policeStationId || '—'}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{user.zoneId || '—'}</td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{user.divisionId || '—'}</td>
                      <td className='px-4 py-3 text-sm text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                            className='inline-flex items-center px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium'
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this user?')) {
                                handleDeleteUser(user.id);
                              }
                            }}
                            className='inline-flex items-center px-2.5 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-xs font-medium'
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className='bg-gray-50 px-4 py-3 border-t border-gray-200'>
              <p className='text-sm text-gray-600'>Showing {filteredUsers.length} of {users.length} user(s)</p>
            </div>
          </div>
        )}
      </div>
    </AdminErrorBoundary>
  );
};

export default UserListPage;
