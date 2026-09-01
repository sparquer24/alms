'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Select from 'react-select';
const ReactSelectFixed = Select as any;
import {
  AdminCard,
  AdminErrorBoundary,
  WorkflowGraphPreview,
  AdminSectionSkeleton,
} from '@/components/admin';
import { PageSubHeader, SubHeaderButton } from '@/components/common/PageSubHeader';
import { useAdminTheme } from '@/context/AdminThemeContext';
import {
  Layers,
  MapPin,
  UserCog,
  GitBranch,
  Workflow,
  History,
  Clock,
  User,
  Save,
  Copy,
  Eraser,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LocationService } from '@/services/locations';
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

// Reusable sub-section wrapper that turns each form group into a polished card
const MappingSection = ({
  step,
  icon,
  title,
  description,
  required,
  children,
}: {
  step?: number;
  icon: ReactNode;
  title: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}) => {
  const { colors } = useAdminTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: AdminSpacing.md,
        padding: AdminSpacing.lg,
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: AdminBorderRadius.lg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: AdminSpacing.md }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${colors.status.info}18`,
            color: colors.status.info,
            borderRadius: AdminBorderRadius.md,
          }}
        >
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: colors.text.primary }}>
            {title}
            {required && (
              <span style={{ color: colors.status.error, marginLeft: '4px' }}>*</span>
            )}
          </div>
          {description && (
            <div style={{ fontSize: '12px', color: colors.text.secondary }}>{description}</div>
          )}
        </div>
        {typeof step === 'number' && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '10px',
              fontWeight: 700,
              color: colors.text.tertiary,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: AdminBorderRadius.full,
              padding: '3px 10px',
              letterSpacing: '0.8px',
              flexShrink: 0,
            }}
          >
            STEP {step}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

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

  const isSuperAdmin = (loggedInUser as any)?.role?.toUpperCase?.() === 'SUPER_ADMIN' ||
    (loggedInUser as any)?.roleCode?.toUpperCase?.() === 'SUPER_ADMIN' ||
    (loggedInUser as any)?.role_code?.toUpperCase?.() === 'SUPER_ADMIN';

  // State management
  const [applicationType, setApplicationType] = useState<AppTypeOption>(applicationTypeOptions[1]); // Default to FRESH
  const [currentRole, setCurrentRole] = useState<SelectOption | null>(null);
  const [nextRoles, setNextRoles] = useState<SelectOption[]>([]);
  const [duplicateSource, setDuplicateSource] = useState<SelectOption | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-fill State & District from current user's profile.
  // Admin: State is locked (read-only), District is changeable.
  // Super Admin: both State and District are changeable dropdowns.
  const [selectedStateId, setSelectedStateId] = useState<number | null>(userStateId);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(userDistrictId);
  const [selectedStateName, setSelectedStateName] = useState<string>(userStateName);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(userDistrictName);

  // Fetch states for SUPER_ADMIN dropdown
  const { data: statesList = [], isLoading: statesLoading } = useQuery({
    queryKey: ['flow-mapping-states'],
    queryFn: async () => {
      try {
        return await LocationService.getStates();
      } catch {
        toast.error('Failed to load states');
        return [];
      }
    },
    enabled: isSuperAdmin,
  });

  // Fetch districts for the effective state (works for both SUPER_ADMIN and ADMIN)
  const adminDistrictStateId = isSuperAdmin ? selectedStateId : userStateId;
  const { data: districtsList = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['flow-mapping-districts', adminDistrictStateId],
    queryFn: async () => {
      if (!adminDistrictStateId) return [];
      try {
        return await LocationService.getDistricts(adminDistrictStateId);
      } catch {
        toast.error('Failed to load districts');
        return [];
      }
    },
    enabled: !!adminDistrictStateId,
  });

  // State options for SUPER_ADMIN react-select
  const stateSelectOptions = useMemo(
    () => statesList.map(s => ({ value: s.id, label: s.name })),
    [statesList]
  );

  // District options for SUPER_ADMIN react-select
  const districtSelectOptions = useMemo(
    () => districtsList.map(d => ({ value: d.id, label: d.name })),
    [districtsList]
  );

  // Effective state/district IDs used by all API calls and query keys.
  // State: SUPER_ADMIN selects from dropdown; Admin is locked to their assigned state.
  // District: Always use the dropdown selection (pre-populated from cookie for Admin).
  //           This ensures API calls reflect the user's current dropdown choice,
  //           not a stale cookie value.
  const effectiveStateId = isSuperAdmin ? selectedStateId : userStateId;
  const effectiveDistrictId = selectedDistrictId;
  const effectiveStateName = isSuperAdmin ? selectedStateName : userStateName;
  const effectiveDistrictName = selectedDistrictName;

  // Build the query string that scopes flow-mapping requests to the current
  // application type + the logged-in user's state/district.
  const flowMappingQueryParams = useCallback(() => {
    const queryParams = new URLSearchParams();
    if (applicationType.value) queryParams.append('applicationType', applicationType.value.toString());
    if (effectiveStateId) queryParams.append('stateId', effectiveStateId.toString());
    if (effectiveDistrictId) queryParams.append('districtId', effectiveDistrictId.toString());
    return queryParams.toString();
  }, [applicationType, effectiveStateId, effectiveDistrictId]);

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
    queryKey: ['all-flow-mappings', applicationType?.value, effectiveStateId, effectiveDistrictId],
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
    queryKey: ['flow-mapping', currentRole?.value, applicationType?.value, effectiveStateId, effectiveDistrictId],
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

    if (!effectiveDistrictId) {
      errors.district = 'Please select a district';
    }

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
  }, [currentRole, nextRoles, effectiveDistrictId]);

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
      updatedBy?: number;
      stateId?: number | null;
      districtId?: number | null;
    }) => {
      const response = await apiClient.put(`/flow-mapping/${currentRole!.value}`, {
        ...data,
        applicationType: applicationType?.value,
        stateId: data.stateId,
        districtId: data.districtId,
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
      queryClient.invalidateQueries({ queryKey: ['all-flow-mappings'] });
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
      queryClient.invalidateQueries({ queryKey: ['all-flow-mappings'] });
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
        stateId: effectiveStateId,
        districtId: effectiveDistrictId,
      });

      // Circular workflow is allowed: only warn, do not block saving.
      if (!validationResult.data.isValid) {
        toast(validationResult.data.message || 'Circular workflow detected — mapping will still be saved', {
          icon: '⚠️',
        });
      }

      // Save the mapping scoped to the same state/district as the GET/validate
      // calls, so the exact (state+district) mapping is updated instead of
      // silently writing to the global (null/null) mapping.
      await saveFlowMappingMutation.mutateAsync({
        nextRoleIds: nextRoles.map(r => r.value),
        updatedBy: (loggedInUser as any)?.id ? Number((loggedInUser as any).id) : undefined,
        stateId: effectiveStateId,
        districtId: effectiveDistrictId,
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
      borderColor: formErrors.currentRole || formErrors.nextRoles || formErrors.district
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
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      zIndex: 99999,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 99999,
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

  const handleResetForm = () => {
    setCurrentRole(null);
    setNextRoles([]);
    setFormErrors({});
    setSelectedStateId(userStateId);
    setSelectedDistrictId(userDistrictId);
    setSelectedStateName(userStateName);
    setSelectedDistrictName(userDistrictName);
  };

  const handleOpenDuplicateModal = () => {
    setDuplicateSource(currentRole);
    setShowDuplicateModal(true);
  };

  return (
    <AdminErrorBoundary>
      <div className="flex flex-col flex-grow">
        <PageSubHeader
          title="Workflow Flow Mapping"
          metaBadge={effectiveStateName ? `${effectiveStateName} Jurisdiction` : 'Global Jurisdiction'}
          actions={
            <>
              {/* Quick Reset */}
              <SubHeaderButton
                onClick={handleResetForm}
                title="Reset form configuration"
                icon={<Eraser className="w-3.5 h-3.5" />}
              >
                Reset
              </SubHeaderButton>

              {/* Copy Mapping Modal */}
              <SubHeaderButton
                onClick={handleOpenDuplicateModal}
                disabled={!currentRole || !currentFlowMapping || isSaving || isLoading}
                title="Copy mapping configuration"
                icon={<Copy className="w-3.5 h-3.5" />}
                className="hidden sm:inline-flex"
              >
                Copy Flow
              </SubHeaderButton>

              {/* Save Mapping Button (Gold Primary) */}
              <SubHeaderButton
                variant="primary"
                onClick={handleSubmit}
                disabled={!currentRole || !effectiveDistrictId || nextRoles.length === 0 || isSaving || isLoading}
                icon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              >
                {isSaving ? 'Saving...' : 'Save Flow'}
              </SubHeaderButton>
            </>
          }
        />

        <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

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
              {/* Step 1: Application Type */}
              <MappingSection
                step={1}
                icon={<Layers size={18} />}
                title='Application Type'
                description='Choose which workflow this mapping applies to'
                required
              >
                <ReactSelectFixed
                  options={applicationTypeOptions}
                  value={applicationType}
                  onChange={(val: AppTypeOption) => {
                    setApplicationType(val);
                  }}
                  placeholder='Select Application Type...'
                  isDisabled={isLoading}
                  styles={selectStyles}
                  menuPortalTarget={isMounted && typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                  menuPlacement="auto"
                />
              </MappingSection>

              {/* Step 2: Location Context */}
              <MappingSection
                step={2}
                icon={<MapPin size={18} />}
                title='Location Context'
                description={isSuperAdmin ? 'Select a state and district to scope this mapping' : 'Automatically scoped to your state & district'}
                required
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* State */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span
                      style={{ fontSize: '13px', fontWeight: 600, color: colors.text.secondary }}
                    >
                      State
                    </span>
                    {isSuperAdmin ? (
                      <ReactSelectFixed
                        options={stateSelectOptions}
                        value={stateSelectOptions.find(o => o.value === selectedStateId) ?? null}
                        onChange={(val: any) => {
                          setSelectedStateId(val?.value ?? null);
                          setSelectedStateName(val?.label ?? '');
                          // Clear district when state changes
                          setSelectedDistrictId(null);
                          setSelectedDistrictName('');
                          // Reset role selection as mapping context changes
                          setCurrentRole(null);
                          setNextRoles([]);
                        }}
                        placeholder='Select a state...'
                        isClearable
                        isSearchable
                        isLoading={statesLoading}
                        isDisabled={statesLoading}
                        styles={selectStyles}
                        menuPortalTarget={isMounted && typeof document !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        menuPlacement="auto"
                        noOptionsMessage={() => 'No states found'}
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: AdminSpacing.sm,
                          padding: '10px 12px',
                          borderRadius: AdminBorderRadius.md,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.surface,
                          color: colors.text.primary,
                          fontSize: '14px',
                          fontWeight: 500,
                        }}
                      >
                        <MapPin size={16} style={{ color: colors.status.info, flexShrink: 0 }} />
                        {userStateName}
                      </div>
                    )}
                  </div>

                  {/* District */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span
                      style={{ fontSize: '13px', fontWeight: 600, color: colors.text.secondary }}
                    >
                      District
                    </span>
                    <ReactSelectFixed
                      options={districtSelectOptions}
                      value={districtSelectOptions.find(o => o.value === selectedDistrictId) ?? null}
                      onChange={(val: any) => {
                        setSelectedDistrictId(val?.value ?? null);
                        setSelectedDistrictName(val?.label ?? '');
                        // Reset role selection as mapping context changes
                        setCurrentRole(null);
                        setNextRoles([]);
                      }}
                      placeholder={isSuperAdmin && !selectedStateId ? 'Select a state first...' : 'Select a district...'}
                      isSearchable
                      isLoading={districtsLoading}
                      isDisabled={!(isSuperAdmin ? selectedStateId : userStateId) || districtsLoading}
                      styles={selectStyles}
                      menuPortalTarget={isMounted && typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      menuPlacement="auto"
                      noOptionsMessage={() =>
                        (isSuperAdmin ? selectedStateId : userStateId) ? 'No districts found' : 'Select a state to view districts'
                      }
                    />
                    {formErrors.district && (
                      <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>
                        {formErrors.district}
                      </p>
                    )}
                  </div>
                </div>
              </MappingSection>

              {/* Step 3: Current Role */}
              <MappingSection
                step={3}
                icon={<UserCog size={18} />}
                title='Current Role'
                description='Choose the role that will forward applications'
                required
              >
                <ReactSelectFixed
                  options={roleOptions}
                  value={currentRole}
                  onChange={setCurrentRole}
                  placeholder='Select a role...'
                  isDisabled={isLoading}
                  isClearable
                  styles={selectStyles}
                  menuPortalTarget={isMounted && typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                  menuPlacement="auto"
                />
                {formErrors.currentRole && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>
                    {formErrors.currentRole}
                  </p>
                )}
              </MappingSection>

              {/* Step 4: Next Roles */}
              <MappingSection
                step={4}
                icon={<GitBranch size={18} />}
                title='Next Roles'
                description='Roles that can receive applications from the current role'
                required
              >
                <ReactSelectFixed
                  isMulti
                  options={availableNextRoleOptions}
                  value={nextRoles}
                  onChange={(selected: any) => setNextRoles(selected ? [...selected] : [])}
                  placeholder='Select next roles...'
                  isDisabled={!currentRole || isLoading}
                  styles={selectStyles}
                  menuPortalTarget={isMounted && typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                  menuPlacement="auto"
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
              </MappingSection>

              {/* Workflow Graph Preview */}
              {currentRole && (
                <div
                  style={{ borderTop: `1px solid ${colors.border}`, paddingTop: AdminSpacing.lg }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: AdminSpacing.sm,
                      margin: `0 0 ${AdminSpacing.sm}px 0`,
                    }}
                  >
                    <Workflow size={18} style={{ color: colors.status.info, flexShrink: 0 }} />
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: colors.text.primary,
                        margin: 0,
                      }}
                    >
                      Workflow Diagram Preview
                    </h3>
                  </div>
                  {/* Context chips: show exactly which mapping is being previewed */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: AdminSpacing.sm,
                      margin: `0 0 ${AdminSpacing.md}px 0`,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: AdminBorderRadius.full,
                        backgroundColor: `${colors.status.info}14`,
                        color: colors.status.info,
                        border: `1px solid ${colors.status.info}35`,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <Layers size={13} />
                      {applicationType.label}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: AdminBorderRadius.full,
                        backgroundColor: `${colors.status.success}14`,
                        color: colors.status.success,
                        border: `1px solid ${colors.status.success}35`,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <MapPin size={13} />
                      {effectiveStateName || '—'}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: AdminBorderRadius.full,
                        backgroundColor: `${colors.status.warning}14`,
                        color: colors.status.warning,
                        border: `1px solid ${colors.status.warning}35`,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <MapPin size={13} />
                      {effectiveDistrictName || 'All districts'}
                    </span>
                  </div>
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
                <MappingSection
                  icon={<History size={18} />}
                  title='Audit Information'
                  description='Recent changes to this workflow mapping'
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: AdminSpacing.md,
                    }}
                  >
                    {currentFlowMapping.updatedAt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: AdminSpacing.sm }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${colors.status.warning}18`,
                            color: colors.status.warning,
                            borderRadius: AdminBorderRadius.md,
                          }}
                        >
                          <Clock size={16} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: colors.text.secondary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Last Updated
                          </div>
                          <div
                            style={{ fontSize: '13px', fontWeight: 500, color: colors.text.primary }}
                          >
                            {new Date(currentFlowMapping.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {currentFlowMapping.updatedByUser && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: AdminSpacing.sm }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${colors.status.info}18`,
                            color: colors.status.info,
                            borderRadius: AdminBorderRadius.md,
                          }}
                        >
                          <User size={16} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: colors.text.secondary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Updated By
                          </div>
                          <div
                            style={{ fontSize: '13px', fontWeight: 500, color: colors.text.primary }}
                          >
                            {currentFlowMapping.updatedByUser.username}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </MappingSection>
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
                  disabled={!currentRole || !effectiveDistrictId || nextRoles.length === 0 || isSaving || isLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    backgroundColor:
                      !currentRole || !effectiveDistrictId || nextRoles.length === 0 || isSaving || isLoading
                        ? colors.disabled
                        : colors.status.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: AdminBorderRadius.md,
                    cursor:
                      !currentRole || !effectiveDistrictId || nextRoles.length === 0 || isSaving || isLoading
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: !currentRole || !effectiveDistrictId || nextRoles.length === 0 || isSaving || isLoading
                      ? 'none'
                      : `0 4px 12px ${colors.status.success}30`,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="btn-success-animated"
                >
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes mapping-spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                    .mapping-spin {
                      animation: mapping-spin 1s linear infinite;
                    }
                    .btn-success-animated:hover:not(:disabled) {
                      transform: translateY(-1px);
                      box-shadow: 0 6px 16px ${colors.status.success}50 !important;
                      filter: brightness(1.05);
                    }
                    .btn-success-animated:active:not(:disabled) {
                      transform: translateY(0);
                    }
                  `}} />
                  {saveFlowMappingMutation.isPending || validateFlowMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mapping-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Mapping
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setDuplicateSource(currentRole);
                    setShowDuplicateModal(true);
                  }}
                  disabled={!currentRole || !currentFlowMapping || isSaving || isLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
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
                  <Copy size={16} />
                  Duplicate Mapping
                </button>

                <button
                  onClick={() => {
                    setCurrentRole(null);
                    setNextRoles([]);
                    setFormErrors({});
                    // Reset both roles back to their user-profile defaults
                    setSelectedStateId(userStateId);
                    setSelectedDistrictId(userDistrictId);
                    setSelectedStateName(userStateName);
                    setSelectedDistrictName(userDistrictName);
                  }}
                  disabled={isSaving || isLoading}
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
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
                  <Eraser size={16} />
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
                      menuPortalTarget={isMounted && typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      menuPlacement="auto"
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
      </div>
    </AdminErrorBoundary>
  );
}
