'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthSync } from '@/hooks/useAuthSync';
import { useRouter } from 'next/navigation';
import { AdminRoleService } from '@/services/admin/roles';
import type { AdminRole } from '@/store/slices/adminRoleSlice';
import {
  AdminCard,
  AdminToolbar,
  AdminFilter,
  AdminModal,
  AdminCardSkeleton,
  AdminErrorAlert,
  AdminErrorBoundary,
} from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';

// Permission categories
const PERMISSION_CATEGORIES = {
  'View Permissions': [
    { key: 'canViewFreshForm', label: 'View Fresh Forms' },
    { key: 'canViewForwarded', label: 'View Forwarded Applications' },
    { key: 'canViewReturned', label: 'View Returned Applications' },
    { key: 'canViewRedFlagged', label: 'View Red Flagged Applications' },
    { key: 'canViewDisposed', label: 'View Disposed Applications' },
    { key: 'canViewSent', label: 'View Sent Applications' },
    { key: 'canViewFinalDisposal', label: 'View Final Disposal' },
    { key: 'canViewReports', label: 'View Reports' },
    { key: 'canAccessSettings', label: 'Access Settings' },
  ],
  'Action Permissions': [
    { key: 'canSubmitApplication', label: 'Submit Applications' },
    { key: 'canCaptureUIN', label: 'Capture UIN' },
    { key: 'canCaptureBiometrics', label: 'Capture Biometrics' },
    { key: 'canUploadDocuments', label: 'Upload Documents' },
    { key: 'canForwardToACP', label: 'Forward to ACP' },
    { key: 'canForwardToSHO', label: 'Forward to SHO' },
    { key: 'canForwardToDCP', label: 'Forward to DCP' },
    { key: 'canForwardToAS', label: 'Forward to AS' },
    { key: 'canForwardToCP', label: 'Forward to CP' },
    { key: 'canConductEnquiry', label: 'Conduct Enquiry' },
    { key: 'canAddRemarks', label: 'Add Remarks' },
    { key: 'canApproveTA', label: 'Approve TA' },
    { key: 'canApproveAI', label: 'Approve AI' },
    { key: 'canReject', label: 'Reject Applications' },
    { key: 'canRequestResubmission', label: 'Request Resubmission' },
    { key: 'canGeneratePDF', label: 'Generate PDF' },
  ],
};

// Permission Editor Modal Component
const PermissionEditorModal: React.FC<{
  isOpen: boolean;
  role: AdminRole | null;
  onClose: () => void;
  onSave: (permissions: Record<string, boolean>) => Promise<void>;
  isSaving: boolean;
}> = ({ isOpen, role, onClose, onSave, isSaving }) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const { colors } = useAdminTheme();

  const handlePermissionChange = (permissionKey: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: value,
    }));
  };

  const handleSave = async () => {
    await onSave(permissions);
  };

  if (!isOpen || !role) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      title={`Edit Permissions - ${role.displayName}`}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: colors.text.secondary,
              border: `1px solid ${colors.border}`,
              borderRadius: AdminBorderRadius.md,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 16px',
              backgroundColor: colors.status.success,
              color: '#ffffff',
              border: 'none',
              borderRadius: AdminBorderRadius.md,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.xl }}>
        {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
          <div
            key={category}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: AdminBorderRadius.lg,
              padding: AdminSpacing.lg,
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: colors.text.primary, fontWeight: 600 }}>
              {category}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: AdminSpacing.md,
              }}
            >
              {perms.map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: AdminSpacing.md,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={permissions[key] || false}
                    onChange={e => handlePermissionChange(key, e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ color: colors.text.primary, fontSize: '14px' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminModal>
  );
};

export default function UserRolesMappingPage() {
  const { userRole } = useAuthSync();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // Fetch roles with React Query
  const {
    data: roles = [],
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<AdminRole[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await AdminRoleService.getRoles();
      if (response && (response as any).success) {
        return (response as any).body || [];
      } else if (response && (response as any).data) {
        return (response as any).data || [];
      }
      throw new Error('Failed to load roles');
    },
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (permissions: Record<string, boolean>) => {
      if (!selectedRole) throw new Error('No role selected');
      const response = await AdminRoleService.updateRolePermissions(selectedRole.id, permissions);
      if (!response || !(response as any).success) {
        throw new Error((response as any)?.message || 'Failed to update permissions');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setIsPermissionModalOpen(false);
      setSelectedRole(null);
    },
  });

  const filteredRoles = roles.filter(
    role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActivePermissionsCount = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  const handleEditPermissions = (role: AdminRole) => {
    setSelectedRole(role);
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = async (permissions: Record<string, boolean>) => {
    await updatePermissionsMutation.mutateAsync(permissions);
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
            <p style={{ color: colors.text.secondary, fontSize: '14px', margin: '4px 0 0 0' }}>
              Manage role-based permissions for the system
            </p>
          </div>
        </AdminToolbar>

        {/* Error Alert */}
        {fetchError && (
          <AdminErrorAlert
            title='Failed to Load Roles'
            message={fetchError instanceof Error ? fetchError.message : 'Unknown error'}
            onRetry={() => refetch()}
          />
        )}

        {/* Search Filter */}
        <AdminFilter
          filters={{
            search: {
              value: searchTerm,
              label: 'Search',
              type: 'text',
              placeholder: 'Search roles by name...',
              onChange: setSearchTerm,
            },
          }}
          onClear={() => setSearchTerm('')}
        />

        {/* Roles Grid */}
        {isLoading ? (
          <AdminCardSkeleton count={3} />
        ) : filteredRoles.length === 0 ? (
          <AdminCard
            title='No Roles Found'
            description={searchTerm ? 'Try adjusting your search criteria.' : 'No roles available.'}
            children={undefined}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: AdminSpacing.xl,
            }}
          >
            {filteredRoles.map(role => (
              <AdminCard key={role.id} title={role.displayName} description={role.description}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.lg }}>
                  {/* Permission Count */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: AdminSpacing.md,
                      backgroundColor: colors.background,
                      borderRadius: AdminBorderRadius.md,
                    }}
                  >
                    <span style={{ color: colors.text.secondary, fontSize: '14px' }}>
                      Active Permissions:
                    </span>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: colors.status.success,
                      }}
                    >
                      {getActivePermissionsCount(role.permissions)}
                    </span>
                  </div>

                  {/* Key Permissions Preview */}
                  <div>
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        color: colors.text.secondary,
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      Key Permissions:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: AdminSpacing.sm }}>
                      {Object.entries(role.permissions)
                        .filter(([_, value]) => value)
                        .slice(0, 3)
                        .map(([key, _]) => (
                          <span
                            key={key}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: colors.status.info,
                              color: '#ffffff',
                              borderRadius: AdminBorderRadius.sm,
                              fontSize: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {key
                              .replace('can', '')
                              .replace(/([A-Z])/g, ' $1')
                              .trim()}
                          </span>
                        ))}
                      {getActivePermissionsCount(role.permissions) > 3 && (
                        <span
                          style={{
                            padding: '4px 8px',
                            backgroundColor: colors.border,
                            color: colors.text.secondary,
                            borderRadius: AdminBorderRadius.sm,
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          +{getActivePermissionsCount(role.permissions) - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: colors.text.secondary,
                      paddingTop: AdminSpacing.md,
                      borderTop: `1px solid ${colors.border}`,
                    }}
                  >
                    <span>Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleEditPermissions(role)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: colors.status.info,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: AdminBorderRadius.md,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        )}
      </div>

      {/* Permission Editor Modal */}
      <PermissionEditorModal
        isOpen={isPermissionModalOpen}
        role={selectedRole}
        onClose={() => {
          setIsPermissionModalOpen(false);
          setSelectedRole(null);
        }}
        onSave={handleSavePermissions}
        isSaving={updatePermissionsMutation.isPending}
      />
    </AdminErrorBoundary>
  );
}
