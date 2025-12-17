'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Select from 'react-select';
const ReactSelectFixed = Select as any;
import {
  AdminCard,
  AdminToolbar,
  AdminErrorBoundary,
  WorkflowGraphPreview,
  AdminSectionSkeleton,
} from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';

interface Role {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

interface SelectOption {
  value: number;
  label: string;
  role?: Role;
}

interface FlowMapping {
  id: number | null;
  currentRoleId: number;
  currentRole: Role;
  nextRoleIds: number[];
  updatedBy: number | null;
  updatedByUser: {
    id: number;
    username: string;
    email: string;
  } | null;
  updatedAt: string | null;
  createdAt: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function FlowMappingPage() {
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();

  // State management
  const [currentRole, setCurrentRole] = useState<SelectOption | null>(null);
  const [nextRoles, setNextRoles] = useState<SelectOption[]>([]);
  const [duplicateSource, setDuplicateSource] = useState<SelectOption | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch all roles
  const { data: allRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/roles`);
        if (!response.ok) throw new Error('Failed to fetch roles');
        const data = await response.json();
        return Array.isArray(data) ? data : data.data || [];
      } catch {
        toast.error('Failed to load roles');
        return [];
      }
    },
  });

  // Fetch current flow mapping when role changes
  const { data: currentFlowMapping, isLoading: mappingLoading } = useQuery({
    queryKey: ['flow-mapping', currentRole?.value],
    queryFn: async () => {
      if (!currentRole) return null;
      try {
        const response = await fetch(`${API_BASE_URL}/flow-mapping/${currentRole.value}`);
        if (!response.ok) throw new Error('Failed to fetch flow mapping');
        const data = await response.json();
        return data.data as FlowMapping;
      } catch (error) {
        console.error('Error fetching flow mapping:', error);
        return null;
      }
    },
    enabled: !!currentRole,
  });

  // Update UI when flow mapping is loaded
  useEffect(() => {
    if (currentFlowMapping && currentFlowMapping.nextRoleIds.length > 0) {
      const selectedNextRoles = currentFlowMapping.nextRoleIds
        .map(id => {
          const role = allRoles.find((r: Role) => r.id === id);
          return role ? { value: id, label: `${role.name} (${role.code})`, role } : null;
        })
        .filter(Boolean) as SelectOption[];
      setNextRoles(selectedNextRoles);
    } else {
      setNextRoles([]);
    }
  }, [currentFlowMapping, allRoles]);

  // Validation function
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!currentRole) {
      errors.currentRole = 'Please select a current role';
    }

    if (nextRoles.length === 0) {
      errors.nextRoles = 'Please select at least one next role';
    }

    // Check for self-reference
    if (currentRole && nextRoles.some(r => r.value === currentRole.value)) {
      errors.selfReference = 'A role cannot flow to itself';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentRole, nextRoles]);

  // Validate flow mapping (check for circular dependencies)
  const validateFlowMutation = useMutation({
    mutationFn: async (data: { currentRoleId: number; nextRoleIds: number[] }) => {
      const response = await fetch(`${API_BASE_URL}/flow-mapping/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Validation failed');
      return response.json();
    },
  });

  // Save flow mapping mutation
  const saveFlowMappingMutation = useMutation({
    mutationFn: async (data: { nextRoleIds: number[]; updatedBy?: number }) => {
      const response = await fetch(`${API_BASE_URL}/flow-mapping/${currentRole!.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save flow mapping');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Flow mapping saved successfully');
      queryClient.invalidateQueries({ queryKey: ['flow-mapping'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save flow mapping');
    },
  });

  // Reset mapping mutation
  const resetMappingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/flow-mapping/${currentRole!.value}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to reset mapping');
      return response.json();
    },
    onSuccess: () => {
      setNextRoles([]);
      toast.success('Flow mapping reset successfully');
      queryClient.invalidateQueries({ queryKey: ['flow-mapping'] });
    },
    onError: () => {
      toast.error('Failed to reset flow mapping');
    },
  });

  // Duplicate mapping mutation
  const duplicateMappingMutation = useMutation({
    mutationFn: async (targetRoleId: number) => {
      const response = await fetch(
        `${API_BASE_URL}/flow-mapping/${duplicateSource!.value}/duplicate/${targetRoleId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to duplicate mapping');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Flow mapping duplicated successfully');
      setShowDuplicateModal(false);
      setDuplicateSource(null);
      queryClient.invalidateQueries({ queryKey: ['flow-mapping'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate flow mapping');
    },
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      // First validate for circular dependencies
      const validationResult = await validateFlowMutation.mutateAsync({
        currentRoleId: currentRole!.value,
        nextRoleIds: nextRoles.map(r => r.value),
      });

      if (!validationResult.data.isValid) {
        toast.error(validationResult.data.message || 'Invalid flow mapping');
        return;
      }

      // If validation passes, save the mapping
      await saveFlowMappingMutation.mutateAsync({
        nextRoleIds: nextRoles.map(r => r.value),
      });
    } catch (error: any) {
      console.error('Error submitting flow mapping:', error);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateSource || !currentRole) {
      toast.error('Please select both source and target roles');
      return;
    }

    if (duplicateSource.value === currentRole.value) {
      toast.error('Source and target roles must be different');
      return;
    }

    await duplicateMappingMutation.mutateAsync(currentRole.value);
  };

  // Transform roles to select options
  const roleOptions: SelectOption[] = allRoles.map((role: Role) => ({
    value: role.id,
    label: `${role.name} (${role.code})`,
    role,
  }));

  // Filter out current role from next roles selection
  const availableNextRoleOptions = roleOptions.filter(
    role => !currentRole || role.value !== currentRole.value
  );

  const isLoading = rolesLoading || mappingLoading;
  const isSaving =
    saveFlowMappingMutation.isPending ||
    validateFlowMutation.isPending ||
    resetMappingMutation.isPending;

  // Get next role details for visualization
  const nextRoleDetails = nextRoles
    .map(r => r.role || allRoles.find((role: Role) => role.id === r.value))
    .filter(Boolean) as Role[];

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: AdminBorderRadius.md,
      borderColor: formErrors.currentRole || formErrors.nextRoles ? '#ef4444' : colors.border,
      backgroundColor: colors.background,
      color: colors.text.primary,
      boxShadow: 'none',
      '&:hover': {
        borderColor: formErrors.currentRole || formErrors.nextRoles ? '#ef4444' : colors.border,
      },
    }),
    option: (base: any) => ({
      ...base,
      backgroundColor: colors.background,
      color: colors.text.primary,
      '&:hover': {
        backgroundColor: colors.status.info,
        color: '#ffffff',
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: colors.background,
      borderColor: colors.border,
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: colors.status.info,
      borderRadius: AdminBorderRadius.md,
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#ffffff',
      fontSize: '14px',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#ffffff',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.2)',
      },
    }),
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
        {/* Header Section with Gradient Background */}
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
          <div className='bg-[#001F54] text-white px-6 py-8'>
            <div className='text-white'>
              <h1 className='text-3xl font-bold mb-2'>Flow Mapping</h1>
              <p className='text-blue-100 text-lg'>
                Configure workflow routing between roles with circular dependency validation
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <AdminCard title='Configure Workflow Mapping'>
          {rolesLoading ? (
            <AdminSectionSkeleton />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: AdminSpacing.xl,
              }}
            >
              {/* Current Role Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.md }}>
                <div>
                  <label
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text.primary,
                      marginBottom: AdminSpacing.sm,
                      display: 'block',
                    }}
                  >
                    Select Current Role
                  </label>
                  <p
                    style={{ color: colors.text.secondary, fontSize: '12px', margin: '4px 0 0 0' }}
                  >
                    Choose the role that will be forwarding applications
                  </p>
                </div>
                <ReactSelectFixed
                  options={roleOptions}
                  value={currentRole}
                  onChange={setCurrentRole}
                  placeholder='Select a role...'
                  isDisabled={isLoading}
                  isClearable
                  styles={selectStyles}
                />
                {formErrors.currentRole && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>
                    {formErrors.currentRole}
                  </p>
                )}
              </div>

              {/* Next Roles Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.md }}>
                <div>
                  <label
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text.primary,
                      marginBottom: AdminSpacing.sm,
                      display: 'block',
                    }}
                  >
                    Select Next Roles (Can Forward To)
                  </label>
                  <p
                    style={{ color: colors.text.secondary, fontSize: '12px', margin: '4px 0 0 0' }}
                  >
                    Choose multiple roles that can receive applications from the current role
                  </p>
                </div>
                <ReactSelectFixed
                  isMulti
                  options={availableNextRoleOptions}
                  value={nextRoles}
                  onChange={(selected: any) => setNextRoles(selected ? [...selected] : [])}
                  placeholder='Select next roles...'
                  isDisabled={!currentRole || isLoading}
                  styles={selectStyles}
                />
                {formErrors.nextRoles && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>
                    {formErrors.nextRoles}
                  </p>
                )}
                {formErrors.selfReference && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>
                    {formErrors.selfReference}
                  </p>
                )}
              </div>

              {/* Workflow Graph Preview */}
              {currentRole && (
                <div
                  style={{ borderTop: `1px solid ${colors.border}`, paddingTop: AdminSpacing.lg }}
                >
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text.primary,
                      margin: `0 0 ${AdminSpacing.md}px 0`,
                    }}
                  >
                    Workflow Diagram Preview
                  </h3>
                  <WorkflowGraphPreview
                    currentRole={{
                      id: currentRole.value,
                      name: currentRole.role?.name || '',
                      code: currentRole.role?.code || '',
                    }}
                    nextRoles={nextRoleDetails}
                  />
                </div>
              )}

              {/* Audit Information */}
              {currentFlowMapping && currentFlowMapping.id && (
                <div
                  style={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    padding: AdminSpacing.md,
                  }}
                >
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: colors.text.secondary,
                      margin: `0 0 ${AdminSpacing.sm}px 0`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Audit Information
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: AdminSpacing.md,
                      fontSize: '12px',
                    }}
                  >
                    {currentFlowMapping.updatedAt && (
                      <div>
                        <p style={{ color: colors.text.secondary, margin: '0 0 4px 0' }}>
                          Last Updated
                        </p>
                        <p style={{ color: colors.text.primary, fontWeight: 500, margin: 0 }}>
                          {new Date(currentFlowMapping.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {currentFlowMapping.updatedByUser && (
                      <div>
                        <p style={{ color: colors.text.secondary, margin: '0 0 4px 0' }}>
                          Updated By
                        </p>
                        <p style={{ color: colors.text.primary, fontWeight: 500, margin: 0 }}>
                          {currentFlowMapping.updatedByUser.username}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: AdminSpacing.md,
                  flexWrap: 'wrap',
                  paddingTop: AdminSpacing.lg,
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <button
                  onClick={handleSubmit}
                  disabled={!currentRole || nextRoles.length === 0 || isSaving || isLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor:
                      !currentRole || nextRoles.length === 0 || isSaving || isLoading
                        ? colors.text.secondary
                        : colors.status.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: AdminBorderRadius.md,
                    cursor:
                      !currentRole || nextRoles.length === 0 || isSaving || isLoading
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    opacity: !currentRole || nextRoles.length === 0 || isSaving ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {saveFlowMappingMutation.isPending || validateFlowMutation.isPending
                    ? 'Saving...'
                    : 'Save Mapping'}
                </button>

                <button
                  onClick={() => {
                    setDuplicateSource(currentRole);
                    setShowDuplicateModal(true);
                  }}
                  disabled={!currentRole || !currentFlowMapping || isSaving || isLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color:
                      !currentRole || !currentFlowMapping || isSaving
                        ? colors.text.secondary
                        : colors.status.info,
                    border: `1px solid ${!currentRole || !currentFlowMapping || isSaving ? colors.border : colors.status.info}`,
                    borderRadius: AdminBorderRadius.md,
                    cursor:
                      !currentRole || !currentFlowMapping || isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    opacity: !currentRole || !currentFlowMapping || isSaving ? 0.6 : 1,
                  }}
                >
                  Duplicate Mapping
                </button>

                <button
                  onClick={() => {
                    setCurrentRole(null);
                    setNextRoles([]);
                    setFormErrors({});
                  }}
                  disabled={isSaving || isLoading}
                  style={{
                    marginLeft: 'auto',
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: colors.text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    cursor: isSaving || isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </AdminCard>

        {/* Duplicate Modal */}
        {showDuplicateModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowDuplicateModal(false)}
          >
            <div style={{ maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
              <AdminCard title='Duplicate Mapping'>
                <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.lg }}>
                  <p style={{ color: colors.text.secondary, margin: 0 }}>
                    Copy the mapping from <strong>{duplicateSource?.label}</strong> to another role
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.md }}>
                    <label
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: colors.text.primary,
                      }}
                    >
                      Target Role
                    </label>
                    <ReactSelectFixed
                      options={roleOptions.filter(r => r.value !== duplicateSource?.value)}
                      value={currentRole}
                      onChange={setCurrentRole}
                      placeholder='Select target role...'
                      styles={selectStyles}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: AdminSpacing.md,
                      justifyContent: 'flex-end',
                      paddingTop: AdminSpacing.lg,
                      borderTop: `1px solid ${colors.border}`,
                    }}
                  >
                    <button
                      onClick={() => setShowDuplicateModal(false)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        color: colors.text.secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: AdminBorderRadius.md,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDuplicate}
                      disabled={duplicateMappingMutation.isPending || !currentRole}
                      style={{
                        padding: '10px 16px',
                        backgroundColor:
                          duplicateMappingMutation.isPending || !currentRole
                            ? colors.text.secondary
                            : colors.status.success,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: AdminBorderRadius.md,
                        cursor:
                          duplicateMappingMutation.isPending || !currentRole
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        opacity: duplicateMappingMutation.isPending || !currentRole ? 0.6 : 1,
                      }}
                    >
                      {duplicateMappingMutation.isPending ? 'Duplicating...' : 'Duplicate'}
                    </button>
                  </div>
                </div>
              </AdminCard>
            </div>
          </div>
        )}

        {/* Information Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: AdminSpacing.lg,
          }}
        >
          <AdminCard title='How It Works' description='Understanding flow mapping'>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: colors.text.secondary,
                fontSize: '13px',
                lineHeight: '22px',
              }}
            >
              <li>Select a current role that will forward applications</li>
              <li>Choose one or multiple roles that can receive applications</li>
              <li>System automatically detects circular dependencies</li>
              <li>Save the mapping to apply it across the system</li>
              <li>View audit information for tracking changes</li>
            </ul>
          </AdminCard>

          <AdminCard title='Features' description='Available options'>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: colors.text.secondary,
                fontSize: '13px',
                lineHeight: '22px',
              }}
            >
              <li>✓ Role-based workflow configuration</li>
              <li>✓ Circular dependency detection</li>
              <li>✓ Workflow visualization diagram</li>
              <li>✓ Duplicate mapping from another role</li>
              <li>✓ Reset mapping to empty state</li>
              <li>✓ Audit trail with user tracking</li>
            </ul>
          </AdminCard>

          <AdminCard title='Current Status' description='Active configuration'>
            {currentRole && currentFlowMapping ? (
              <div style={{ color: colors.text.primary, fontSize: '13px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
                  From: <span style={{ color: colors.status.success }}>{currentRole.label}</span>
                </p>
                <p style={{ margin: '0 0 8px 0', color: colors.text.secondary }}>
                  To {nextRoles.length > 0 ? `:` : `: None selected`}
                </p>
                {nextRoles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {nextRoles.map(role => (
                      <span
                        key={role.value}
                        style={{
                          display: 'inline-block',
                          backgroundColor: colors.status.info,
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: AdminBorderRadius.md,
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {role.role?.code || ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: colors.text.secondary, margin: 0, fontSize: '13px' }}>
                No role selected. Please select a role to view its configuration.
              </p>
            )}
          </AdminCard>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}
