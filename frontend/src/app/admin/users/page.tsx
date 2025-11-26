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
        ) : (
          <table className='w-full border-collapse border border-gray-200'>
            <thead>
              <tr>
                <th className='border p-2'>Username</th>
                <th className='border p-2'>Email</th>
                <th className='border p-2'>Role</th>
                <th className='border p-2'>Status</th>
                <th className='border p-2'>Actions</th>
                <th className='border p-2'>State</th>
                <th className='border p-2'>District</th>
                <th className='border p-2'>Police Station</th>
                <th className='border p-2'>Zone</th>
                <th className='border p-2'>Division</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className='border p-2'>{user.username}</td>
                  <td className='border p-2'>{user.email}</td>
                  <td className='border p-2'>{user.role}</td>
                  <td className='border p-2'>{user.status}</td>
                  <td className='border p-2'>{user.stateId || 'N/A'}</td>
                  <td className='border p-2'>{user.districtId || 'N/A'}</td>
                  <td className='border p-2'>{user.policeStationId || 'N/A'}</td>
                  <td className='border p-2'>{user.zoneId || 'N/A'}</td>
                  <td className='border p-2'>{user.divisionId || 'N/A'}</td>
                  <td className='border p-2 space-x-2'>
                    <button
                      onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                      className='text-blue-600 hover:underline'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => alert('Delete functionality pending')}
                      className='text-red-600 hover:underline'
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminErrorBoundary>
  );
};

export default UserListPage;
