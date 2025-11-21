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

        {/* Table */}
        <AdminCard title={`Users (${filteredUsers.length})`}>
          {isLoading ? (
            <AdminTableSkeleton rows={5} columns={5} />
          ) : (
            <AdminTable<User>
              columns={[
                { key: 'username', header: 'Username' },
                { key: 'email', header: 'Email' },
                { key: 'role', header: 'Role' },
                {
                  key: 'status',
                  header: 'Status',
                  render: value => (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: getStatusColor(value),
                        color: '#ffffff',
                      }}
                    >
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  ),
                },
                {
                  key: 'id',
                  header: 'Actions',
                  render: (value, row) => (
                    <div style={{ display: 'flex', gap: AdminSpacing.md }}>
                      <button
                        onClick={() => router.push(`/admin/users/${row.id}/edit`)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: colors.status.info,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(row.id)}
                        disabled={deleteUserMutation.isPending}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: colors.status.error,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: deleteUserMutation.isPending ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          opacity: deleteUserMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredUsers}
              rowKey='id'
              onRowClick={row => router.push(`/admin/users/${row.id}`)}
              emptyMessage='No users found'
              loading={isLoading}
            />
          )}
        </AdminCard>
      </div>
    </AdminErrorBoundary>
  );
};

export default UserListPage;
