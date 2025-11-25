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
} from '../../../components/admin';
import type { ConfirmationDialogConfig } from '../../../components/admin/ConfirmationDialog';
import { AdminRoleService } from '@/services/admin/roles';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';

interface Role {
  id: number;
  name: string;
  code: string;
  dashboard_title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Record<string, boolean>;
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
  } = useQuery({
    queryKey: [
      'admin-roles-mapping',
      searchTerm,
      statusFilter,
      sortBy,
      sortOrder,
      currentPage,
      limit,
    ],
    queryFn: async () => {
      const response = await AdminRoleService.getRoles({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy,
        sortOrder,
        page: currentPage,
        limit,
      });

      if (response && (response as any).data) {
        return (response as any).data;
      }
      return { data: [], total: 0, page: 1, limit };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles = rolesData?.data || [];
  const totalPages = rolesData?.total ? Math.ceil(rolesData.total / limit) : 1;

  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: Role) => {
      const response = await AdminRoleService.createRole({
        name: roleData.name,
        code: roleData.code,
        dashboard_title: roleData.dashboard_title,
        description: roleData.description,
        permissions: roleData.permissions,
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
        code: roleData.code,
        dashboard_title: roleData.dashboard_title,
        description: roleData.description,
        permissions: roleData.permissions,
        is_active: roleData.is_active,
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
      const endpoint = role.is_active ? 'deactivate' : 'activate';
      const response = await AdminRoleService.updateRole(String(role.id), {
        is_active: !role.is_active,
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
          await deleteRoleMutation.mutateAsync(role.id);
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
          {/* Header Toolbar */}
          <AdminToolbar sticky>
            <div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Role Management
              </h1>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: '14px',
                  margin: '4px 0 0 0',
                }}
              >
                Create, edit, and manage roles with customizable permissions and capabilities
              </p>
            </div>
          </AdminToolbar>

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

              {/* Search and Filter Bar */}
              <AdminFilter
                filters={{
                  search: {
                    value: searchTerm,
                    label: 'Search',
                    type: 'text',
                    placeholder: 'Search by role name or code...',
                    onChange: value => {
                      setSearchTerm(value);
                      setCurrentPage(1);
                    },
                  },
                  status: {
                    value: statusFilter,
                    label: 'Status',
                    type: 'select',
                    options: [
                      { value: 'all', label: 'All Statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ],
                    onChange: (value: any) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    },
                  },
                }}
                onClear={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('created_at');
                  setSortOrder('desc');
                  setCurrentPage(1);
                }}
              />

              {/* Add Role Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleAddRole}
                  style={{
                    padding: '10px 20px',
                    borderRadius: AdminBorderRadius.md,
                    border: 'none',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: AdminSpacing.sm,
                  }}
                >
                  + Create New Role
                </button>
              </div>

              {/* Role Table */}
              <div
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: AdminBorderRadius.lg,
                  border: `1px solid ${colors.border}`,
                  overflow: 'hidden',
                }}
              >
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
