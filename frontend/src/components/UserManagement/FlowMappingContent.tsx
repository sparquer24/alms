'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { getUserFromCookie } from '@/utils/authCookies';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';
import { apiClient } from '@/config/authenticatedApiClient';

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

interface AppTypeOption {
  value: string;
  label: string;
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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

export default function FlowMappingContent() {
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();

  // Logged-in user's location (auto-populated, read-only)
  const { user: authUser } = useAuth();
  const cookieUser = useMemo(() => getUserFromCookie(), []);
  const loggedInUser = authUser ?? cookieUser;
  const userLocation = useMemo(
    () => (loggedInUser as any)?.location ?? (loggedInUser as any)?.state ?? {},
    [loggedInUser]
  );
  const userState = userLocation?.state ?? (loggedInUser as any)?.state ?? null;
  const userDistrict = userLocation?.district ?? (loggedInUser as any)?.district ?? null;
  // Coerce IDs to numbers: user location IDs (e.g. from the auth cookie) can arrive as strings,
  // but the flow-mapping API expects integer stateId/districtId.
  const toNumberOrNull = (value: any): number | null =>
    value === null || value === undefined || value === '' ? null : Number(value);
  const userStateId = toNumberOrNull(userState?.id ?? (loggedInUser as any)?.stateId ?? null);
  const userDistrictId = toNumberOrNull(userDistrict?.id ?? (loggedInUser as any)?.districtId ?? null);
  const userStateName = userState?.name ?? '—';
  const userDistrictName = userDistrict?.name ?? '—';

  // Application Types
  const applicationTypeOptions = useMemo(() => [
    { value: 'ALL', label: 'All Application Types' },
    { value: 'FRESH', label: 'Fresh Application' },
    { value: 'RENEWAL', label: 'Renewal Application' },
    { value: 'CANCEL', label: 'Cancellation Application' }
  ], []);

  // State management
  const [applicationType, setApplicationType] = useState<AppTypeOption>(applicationTypeOptions[1]); // Default to FRESH
  const [currentRole, setCurrentRole] = useState<SelectOption | null>(null);
  const [nextRoles, setNextRoles] = useState<SelectOption[]>([]);
  const [duplicateSource, setDuplicateSource] = useState<SelectOption | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Build the query string that scopes flow-mapping requests to the current
  // application type + the logged-in user's state/district.
  const flowMappingQueryParams = useCallback(() => {
    const queryParams = new URLSearchParams();
    if (applicationType.value) queryParams.append('applicationType', applicationType.value.toString());
    if (userStateId) queryParams.append('stateId', userStateId.toString());
    if (userDistrictId) queryParams.append('districtId', userDistrictId.toString());
    return queryParams.toString();
  }, [applicationType, userStateId, userDistrictId]);

  // Fetch all roles
  const { data: allRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[] }>('/roles');
        return Array.isArray(response) ? response : response.data || [];
      } catch {
        toast.error('Failed to load roles');
        return [];
      }
    },
  });

  // Fetch all mappings for current context to compute previous paths
  const { data: allContextMappings = [], isLoading: allMappingsLoading } = useQuery({
    queryKey: ['all-flow-mappings', applicationType?.value, userStateId, userDistrictId],
    queryFn: async () => {
      if (!applicationType) return [];
      try {
        const response = await apiClient.get<{ data: any[] }>(`/flow-mapping?${flowMappingQueryParams()}`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching all flow mappings:', error);
        return [];
      }
    },
    enabled: !!applicationType,
  });

  // Fetch current flow mapping when role or application type changes
  const { data: currentFlowMapping, isLoading: mappingLoading } = useQuery({
    queryKey: ['flow-mapping', currentRole?.value, applicationType?.value, userStateId, userDistrictId],
    queryFn: async () => {
      if (!currentRole || !applicationType) return null;
      try {
        const response = await apiClient.get<{ data: FlowMapping }>(`/flow-mapping/${currentRole.value}?${flowMappingQueryParams()}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching flow mapping:', error);
        return null;
      }
    },
    enabled: !!currentRole,
  });

  // Memoize selectedNextRoles to prevent infinite loops
  const selectedNextRoles = useMemo(() => {
    if (currentFlowMapping && currentFlowMapping.nextRoleIds.length > 0) {
      return currentFlowMapping.nextRoleIds
        .map(id => {
          const role = allRoles.find((r: Role) => r.id === id);
          return role ? { value: id, label: `${role.name} (${role.code})`, role } : null;
        })
        .filter(Boolean) as SelectOption[];
    }
    return [];
  }, [currentFlowMapping, allRoles]);

  // Update UI when flow mapping is loaded
  useEffect(() => {
    const currentIds = nextRoles.map(r => r.value).sort().join(',');
    const newIds = selectedNextRoles.map(r => r.value).sort().join(',');
    
    // Only update if the IDs actually changed
    if (currentIds !== newIds) {
      setNextRoles(selectedNextRoles);
    }
  }, [selectedNextRoles]);

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
    mutationFn: async (data: {
      currentRoleId: number;
      nextRoleIds: number[];
      applicationType?: string;
      stateId?: number | null;
      districtId?: number | null;
    }) => {
      const response = await apiClient.post<{
        success: boolean;
        data: { isValid: boolean; message?: string };
      }>('/flow-mapping/validate', data);
      return response;
    },
  });

  // Save flow mapping mutation
  const saveFlowMappingMutation = useMutation({
    mutationFn: async (data: {
      nextRoleIds: number[];
      applicationType?: string;
      updatedBy?: number;
      stateId?: number | null;
      districtId?: number | null;
    }) => {
      const response = await apiClient.put(`/flow-mapping/${currentRole!.value}`, {
        ...data,
        applicationType: applicationType?.value,
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Flow mapping saved successfully');
      queryClient.invalidateQueries({ queryKey: ['flow-mapping'] });
      queryClient.invalidateQueries({ queryKey: ['all-flow-mappings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save flow mapping');
    },
  });

  // Reset mapping mutation
  const resetMappingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/flow-mapping/${currentRole!.value}/reset?${flowMappingQueryParams()}`);
      return response;
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
    mutationFn: async () => {
      if (!duplicateSource || !currentRole) throw new Error('Source and target roles required');
      
      const response = await apiClient.post(
        `/flow-mapping/${duplicateSource.value}/duplicate/${currentRole.value}?${flowMappingQueryParams()}`
      );

      return response;
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
        applicationType: applicationType?.value,
        stateId: userStateId,
        districtId: userDistrictId,
      });

      if (!validationResult.data.isValid) {
        toast.error(validationResult.data.message || 'Invalid flow mapping');
        return;
      }

      // If validation passes, save the mapping scoped to the same state/district
      // as the GET/validate calls, so the exact (state+district) mapping is updated
      // instead of silently writing to the global (null/null) mapping.
      await saveFlowMappingMutation.mutateAsync({
        nextRoleIds: nextRoles.map(r => r.value),
        stateId: userStateId,
        districtId: userDistrictId,
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

    await duplicateMappingMutation.mutateAsync();
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
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: AdminBorderRadius.md,
      borderColor: formErrors.currentRole || formErrors.nextRoles
        ? '#ef4444'
        : state.isFocused
        ? colors.status.info
        : colors.border,
      backgroundColor: colors.surface,
      color: colors.text.primary,
      boxShadow: state.isFocused ? `0 0 0 2px ${colors.status.info}30` : 'none',
      borderWidth: '1px',
      '&:hover': {
        borderColor: formErrors.currentRole || formErrors.nextRoles
          ? '#ef4444'
          : state.isFocused
          ? colors.status.info
          : colors.border,
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? colors.status.info
        : state.isFocused
        ? colors.hover
        : colors.surface,
      color: state.isSelected ? '#ffffff' : colors.text.primary,
      cursor: 'pointer',
      ':active': {
        backgroundColor: colors.status.info,
        color: '#ffffff',
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: '1px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: colors.surface,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: colors.text.primary,
    }),
    input: (base: any) => ({
      ...base,
      color: colors.text.primary,
    }),
    placeholder: (base: any) => ({
      ...base,
      color: colors.text.secondary,
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
        <div
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, #001F54 0%, #003F88 100%)`,
              padding: '24px 32px',
            }}
          >
            <div style={{ color: '#ffffff' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>Flow Mapping</h1>
              <p style={{ color: '#b3cbf2', fontSize: '15px', margin: 0, fontWeight: 500 }}>
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
              {/* Application Type Selection */}
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
                    Application Type
                  </label>
                  <p
                    style={{ color: colors.text.secondary, fontSize: '12px', margin: '4px 0 0 0' }}
                  >
                    Configure mapping specific to an application type
                  </p>
                </div>
                <ReactSelectFixed
                  options={applicationTypeOptions}
                  value={applicationType}
                  onChange={(val: AppTypeOption) => {
                    setApplicationType(val);
                  }}
                  placeholder='Select Application Type...'
                  isDisabled={isLoading}
                  styles={selectStyles}
                />
              </div>

              {/* State & District (auto-populated from logged-in user's location) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: AdminSpacing.md,
                }}
              >
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
                    State
                  </label>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: AdminBorderRadius.md,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      color: colors.text.primary,
                      fontSize: '14px',
                    }}
                  >
                    {userStateName}
                  </div>
                </div>
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
                    District
                  </label>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: AdminBorderRadius.md,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      color: colors.text.primary,
                      fontSize: '14px',
                    }}
                  >
                    {userDistrictName}
                  </div>
                </div>
              </div>

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
                    allContextMappings={allContextMappings}
                    allRoles={allRoles}
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
                        ? colors.disabled
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
                    boxShadow: !currentRole || nextRoles.length === 0 || isSaving || isLoading
                      ? 'none'
                      : `0 4px 12px ${colors.status.success}30`,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="btn-success-animated"
                >
                  <style dangerouslySetInnerHTML={{__html: `
                    .btn-success-animated:hover:not(:disabled) {
                      transform: translateY(-1px);
                      box-shadow: 0 6px 16px ${colors.status.success}50 !important;
                      filter: brightness(1.05);
                    }
                    .btn-success-animated:active:not(:disabled) {
                      transform: translateY(0);
                    }
                  `}} />
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
                      !currentRole || !currentFlowMapping || isSaving || isLoading
                        ? colors.text.muted
                        : colors.status.info,
                    border: `1px solid ${!currentRole || !currentFlowMapping || isSaving || isLoading ? colors.border : colors.status.info}`,
                    borderRadius: AdminBorderRadius.md,
                    cursor:
                      !currentRole || !currentFlowMapping || isSaving || isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="btn-info-animated"
                >
                  <style dangerouslySetInnerHTML={{__html: `
                    .btn-info-animated:hover:not(:disabled) {
                      background-color: ${colors.status.info}10;
                      transform: translateY(-1px);
                    }
                    .btn-info-animated:active:not(:disabled) {
                      transform: translateY(0);
                    }
                  `}} />
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
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="btn-clear-animated"
                >
                  <style dangerouslySetInnerHTML={{__html: `
                    .btn-clear-animated:hover:not(:disabled) {
                      background-color: ${colors.hover};
                      color: ${colors.text.primary};
                      transform: translateY(-1px);
                    }
                    .btn-clear-animated:active:not(:disabled) {
                      transform: translateY(0);
                    }
                  `}} />
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
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => setShowDuplicateModal(false)}
          >
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scaleIn {
                from { transform: scale(0.96); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}} />
            <div 
              style={{ 
                maxWidth: '500px', 
                width: '100%',
                maxHeight: '90vh', 
                overflow: 'auto',
                margin: '20px',
                animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onClick={e => e.stopPropagation()}
            >
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
