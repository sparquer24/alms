"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { PageSubHeader, SubHeaderSearch, SubHeaderButton } from '@/components/common/PageSubHeader';
import { AdminSectionSkeleton, AdminErrorAlert, ConfirmationDialog } from '@/components/admin';
import { AdminDataTable, Column } from '@/components/tables/AdminDataTable';
import type { ConfirmationDialogConfig } from '@/components/admin/ConfirmationDialog';
import { AdminPermissionService, Permission } from '@/services/admin/permissions';

export default function PermissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { userRole } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [confirmationDialog, setConfirmationDialog] = useState<{ isOpen: boolean; config?: ConfirmationDialogConfig }>({
    isOpen: false,
  });

  const {
    data: permissions = [],
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<Permission[]>({
    queryKey: ['admin-permissions'],
    queryFn: () => AdminPermissionService.getPermissions(),
    staleTime: 5 * 60 * 1000,
    enabled: userRole === 'ADMIN',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => AdminPermissionService.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      setConfirmationDialog({ isOpen: false });
    },
  });

  const categories = Array.from(new Set(permissions.map(p => p.category)));

  const filteredPermissions = permissions.filter(permission => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      permission.label.toLowerCase().includes(q) ||
      permission.key.toLowerCase().includes(q) ||
      (permission.description || '').toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (permission: Permission) => {
    setConfirmationDialog({
      isOpen: true,
      config: {
        title: 'Delete Permission',
        message: `Are you sure you want to delete "${permission.label}"? This does not remove it from roles that already have it enabled.`,
        type: 'delete',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await deleteMutation.mutateAsync(permission.id);
        },
        onCancel: () => setConfirmationDialog({ isOpen: false }),
      },
    });
  };

  const columns: Column<Permission>[] = [
    {
      key: 'label',
      header: 'Permission',
      render: (v, p) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{p.label}</div>
          <div className="text-sm text-gray-500">{p.key}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (v, p) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {p.category}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (v, p) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">{p.description || '—'}</div>
      ),
    },
    {
      key: 'assignedRoles',
      header: 'Assigned Roles',
      render: (v, p) => (
        <div className="flex flex-wrap gap-1">
          {p.assignedRoles.length === 0 && <span className="text-xs text-gray-400">None</span>}
          {p.assignedRoles.map((role) => (
            <span key={role} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {role}
            </span>
          ))}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <AdminSectionSkeleton />;
  }

  return (
    <div className="flex flex-col flex-grow min-h-0">
      <PageSubHeader
        title="Permission Management"
        metaBadge={`${filteredPermissions.length} Permission${filteredPermissions.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <SubHeaderSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search permissions..." />
            <SubHeaderButton variant="primary" onClick={() => router.push('/admin/permissions/create')}>
              Create Permission
            </SubHeaderButton>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 flex-grow">
        {fetchError && (
          <AdminErrorAlert
            title="Failed to Load Permissions"
            message={(fetchError as any).message || 'An error occurred'}
            onRetry={() => refetch()}
          />
        )}

        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex space-x-2 flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">Showing {filteredPermissions.length} permission(s)</p>
          </div>

          {/* Permissions Table */}
          <div className="overflow-x-auto">
            {filteredPermissions.length > 0 && (
              <AdminDataTable
                data={filteredPermissions.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                columns={columns}
                rowActions={[
                  {
                    label: 'View',
                    onClick: (p) => router.push(`/admin/permissions/${p.id}`),
                  },
                  {
                    label: 'Edit',
                    onClick: (p) => router.push(`/admin/permissions/${p.id}/edit`),
                  },
                  {
                    label: 'Delete',
                    onClick: (p) => handleDelete(p),
                    variant: 'danger',
                  }
                ]}
                pagination={{
                  currentPage,
                  totalPages: Math.ceil(filteredPermissions.length / pageSize),
                  totalItems: filteredPermissions.length,
                  pageSize,
                  onPageChange: setCurrentPage
                }}
              />
            )}
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
      </div>

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        config={confirmationDialog.config}
        isLoading={deleteMutation.isPending}
        onClose={() => setConfirmationDialog({ isOpen: false })}
      />
    </div>
  );
}
