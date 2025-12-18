'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../../components/Sidebar';
import {
  RoleTable,
  RoleFormModal,
  PermissionMatrix,
  ConfirmationDialog,
  AdminToolbar,
  AdminFilter,
  AdminErrorAlert,
  AdminErrorBoundary,
  AdminTableSkeleton,
} from '../../../components/admin';
import type { ConfirmationDialogConfig } from '../../../components/admin/ConfirmationDialog';
import { AdminRoleService } from '@/services/admin/roles';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';

interface Role {
  id?: number;
  name: string;
  code: string;
  dashboard_title: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: Record<string, boolean>;
}

interface RolesResponse {
  data: Role[];
  total: number;
  page: number;
  limit: number;
}

export default function RoleMappingPage() {
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Confirmation Dialog State
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    config?: ConfirmationDialogConfig;
  }>({
    isOpen: false,
  });

  // Toast/Notification State (simple implementation)
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
  };

  // Fetch Roles
  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    error: fetchError,
    refetch: refetchRoles,
  } = useQuery<RolesResponse>({
    queryKey: [
      'admin-roles-mapping',
      searchTerm,
      statusFilter,
      sortBy,
      sortOrder,
      currentPage,
      limit,
    ],
    queryFn: async (): Promise<RolesResponse> => {
      const response = await AdminRoleService.getRoles({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit,
      });

      if (response && typeof response === 'object' && 'data' in response) {
        return response as RolesResponse;
      }
      return { data: [], total: 0, page: currentPage, limit };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles: Role[] = rolesData?.data || [];
  const totalPages = rolesData && 'total' in rolesData ? Math.ceil(rolesData.total / limit) : 1;

  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: Role) => {
      const response = await AdminRoleService.createRole({
        name: roleData.name,
        displayName: roleData.dashboard_title || roleData.name,
        description: roleData.description,
        permissions: roleData.permissions || {},
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-mapping'] });
      setIsFormModalOpen(false);
      setSelectedRole(null);
      showNotification('Role created successfully!', 'success');
    },
    onError: error => {
      showNotification((error as any).message || 'Failed to create role', 'error');
    },
  });

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (roleData: Role) => {
      if (!roleData.id) throw new Error('Role ID is required');
      const response = await AdminRoleService.updateRole(String(roleData.id), {
        name: roleData.name,
        displayName: roleData.dashboard_title || roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isActive: roleData.is_active,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-mapping'] });
      setIsFormModalOpen(false);
      setSelectedRole(null);
      showNotification('Role updated successfully!', 'success');
    },
    onError: error => {
      showNotification((error as any).message || 'Failed to update role', 'error');
    },
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await AdminRoleService.deleteRole(String(roleId));
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-mapping'] });
      showNotification('Role deleted successfully!', 'success');
    },
    onError: error => {
      showNotification((error as any).message || 'Failed to delete role', 'error');
    },
  });

  // Toggle Role Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (role: Role) => {
      if (!role.id) throw new Error('Role ID is required');
      const endpoint = role.is_active ? 'deactivate' : 'activate';
      const response = await AdminRoleService.updateRole(String(role.id), {
        isActive: !role.is_active,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-mapping'] });
      showNotification(
        `Role ${selectedRole?.is_active ? 'deactivated' : 'activated'} successfully!`,
        'success'
      );
    },
    onError: error => {
      showNotification((error as any).message || 'Failed to update role status', 'error');
    },
  });

  // Handlers
  const handleAddRole = () => {
    setSelectedRole(null);
    setIsFormModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsFormModalOpen(true);
  };

  const handleViewPermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionModalOpen(true);
  };

  const handleFormSave = async (roleData: Role) => {
    if (selectedRole?.id) {
      await updateRoleMutation.mutateAsync({ ...roleData, id: selectedRole.id });
    } else {
      await createRoleMutation.mutateAsync(roleData);
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (!role.id) return;
    setSelectedRole(role);
    setConfirmationDialog({
      isOpen: true,
      config: {
        title: 'Delete Role',
        message: `Are you sure you want to delete the role "${role.name}"? This action will soft-delete the role.`,
        type: 'delete',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await deleteRoleMutation.mutateAsync(role.id!);
          setConfirmationDialog({ isOpen: false });
        },
        onCancel: () => {
          setSelectedRole(null);
        },
      },
    });
  };

  const handleToggleStatus = (role: Role) => {
    setSelectedRole(role);
    setConfirmationDialog({
      isOpen: true,
      config: {
        title: role.is_active ? 'Deactivate Role' : 'Activate Role',
        message: `Are you sure you want to ${role.is_active ? 'deactivate' : 'activate'} the role "${role.name}"?`,
        type: 'deactivate',
        confirmText: role.is_active ? 'Deactivate' : 'Activate',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await toggleStatusMutation.mutateAsync(role);
          setConfirmationDialog({ isOpen: false });
        },
        onCancel: () => {
          setSelectedRole(null);
        },
      },
    });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <AdminErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
        <Sidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header Section with Gradient Background */}
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden' style={{ margin: AdminLayout.content.padding }}>
            <div className='bg-[#001F54] text-white px-6 py-8'>
              <div className='text-white'>
                <h1 className='text-3xl font-bold mb-2'>Role Management</h1>
                <p className='text-blue-100 text-lg'>
                  Create, edit, and manage roles with customizable permissions and capabilities
                </p>
              </div>
            </div>
            <div className='p-6 bg-white'>
              {/* Search and Filter Bar */}
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                <div className='flex flex-col sm:flex-row gap-3 flex-1'>
                  <div className='relative flex-1 max-w-md'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <svg
                        className='h-4 w-4 text-slate-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                        />
                      </svg>
                    </div>
                    <input
                      aria-label='Search roles'
                      className='w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                      placeholder='Search by role name or code...'
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                    {/* Clear search button */}
                    {searchTerm && (
                      <button
                        aria-label='Clear search'
                        title='Clear search'
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                        }}
                        className='absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600'
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className='rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[160px]'
                  >
                    <option value='all'>All Statuses</option>
                    <option value='active'>Active</option>
                    <option value='inactive'>Inactive</option>
                  </select>
                </div>
                <button
                  onClick={handleAddRole}
                  className='inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap'
                >
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  Add Role
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main
            style={{
              flex: 1,
              overflow: 'auto',
              padding: AdminLayout.content.padding,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: AdminLayout.content.gap }}>
              {/* Error Alert */}
              {fetchError && (
                <AdminErrorAlert
                  title='Failed to Load Roles'
                  message={(fetchError as any).message || 'An error occurred'}
                  onRetry={() => {
                    setCurrentPage(1);
                    refetchRoles();
                  }}
                />
              )}

              {/* Notification */}
              {notification.visible && (
                <div
                  style={{
                    padding: AdminSpacing.md,
                    borderRadius: AdminBorderRadius.md,
                    backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: notification.type === 'success' ? '#155724' : '#856404',
                    border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{notification.message}</span>
                  <button
                    onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: 'inherit',
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Roles Table */}
              <div
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: AdminBorderRadius.lg,
                  border: `1px solid ${colors.border}`,
                  overflow: 'hidden',
                }}
              >
                {isLoadingRoles ? (
                  <AdminTableSkeleton rows={5} columns={6} />
                ) : (
                  <RoleTable
                    roles={roles}
                    isLoading={isLoadingRoles}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    onEdit={handleEditRole}
                    onDelete={handleDeleteRole}
                    onToggleStatus={handleToggleStatus}
                    onViewPermissions={handleViewPermissions}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={isFormModalOpen}
        role={selectedRole}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedRole(null);
        }}
        onSave={handleFormSave}
        isSaving={createRoleMutation.isPending || updateRoleMutation.isPending}
      />

      {/* Permission View Modal */}
      {isPermissionModalOpen && selectedRole && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) {
              setIsPermissionModalOpen(false);
              setSelectedRole(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              borderRadius: AdminBorderRadius.lg,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: AdminSpacing.lg,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: colors.text.primary,
                }}
              >
                Permissions for {selectedRole.name}
              </h2>
              <button
                onClick={() => {
                  setIsPermissionModalOpen(false);
                  setSelectedRole(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: colors.text.secondary,
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: AdminSpacing.lg, flex: 1 }}>
              <PermissionMatrix permissions={selectedRole.permissions || {}} readOnly={true} />
            </div>

            {/* Footer */}
            <div
              style={{
                padding: AdminSpacing.lg,
                borderTop: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setIsPermissionModalOpen(false);
                  setSelectedRole(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: AdminBorderRadius.md,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: 'transparent',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        config={confirmationDialog.config}
        isLoading={deleteRoleMutation.isPending || toggleStatusMutation.isPending}
        onClose={() => setConfirmationDialog({ isOpen: false })}
      />
    </AdminErrorBoundary>
  );
}
