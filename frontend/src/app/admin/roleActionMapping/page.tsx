'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../../components/Sidebar';
import Select from 'react-select';
const ReactSelectFixed = Select as any;
import {
  AdminCard,
  ConfirmationDialog,
  AdminErrorBoundary,
  AdminTableSkeleton,
  AdminSectionSkeleton,
} from '../../../components/admin';
import { AdminActionService } from '@/services/admin/actions';
import type { Action, RoleActionMapping, MasterEntity } from '@/services/admin/actions';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';
import { apiClient } from '@/config/authenticatedApiClient';

interface RoleOption {
  value: number;
  label: string;
  code: string;
}

export default function RoleActionMappingPage() {
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();

  const [selectedAppType, setSelectedAppType] = useState<{ value: number; label: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ value: number; label: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
  };

  // Fetch all roles
  const { data: allRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: any[] }>('/roles');
        return Array.isArray(response) ? response : (response as any).data || [];
      } catch {
        showNotification('Failed to load roles', 'error');
        return [];
      }
    },
  });

  // Fetch master data for filters
  const { data: appTypes = [] } = useQuery({
    queryKey: ['application-types'],
    queryFn: () => AdminActionService.getApplicationTypes(true),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => AdminActionService.getCategories(true),
  });

  const appTypeOptions = appTypes.map((t: MasterEntity) => ({ value: t.id, label: `${t.name} (${t.code})` }));
  const categoryOptions = categories.map((c: MasterEntity) => ({ value: c.id, label: `${c.name} (${c.code})` }));

  // Fetch role-action mappings
  const {
    data: mappingsData,
    isLoading: mappingsLoading,
  } = useQuery({
    queryKey: ['role-action-mappings', selectedRole?.value, selectedAppType?.value, selectedCategory?.value],
    queryFn: async () => {
      if (!selectedRole) return null;
      return AdminActionService.getRoleActionMappings(selectedRole.value, selectedAppType?.value, selectedCategory?.value);
    },
    enabled: !!selectedRole,
  });

  // Fetch available actions for the selected role
  const {
    data: availableActions = [],
    isLoading: availableLoading,
  } = useQuery({
    queryKey: ['available-actions', selectedRole?.value, selectedAppType?.value, selectedCategory?.value],
    queryFn: async () => {
      if (!selectedRole) return [];
      return AdminActionService.getAvailableActionsForRole(selectedRole.value, selectedAppType?.value, selectedCategory?.value);
    },
    enabled: !!selectedRole,
  });

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async (actionIds: number[]) => {
      if (!selectedRole) throw new Error('No role selected');
      return AdminActionService.bulkAssignActions(selectedRole.value, actionIds, selectedAppType?.value, selectedCategory?.value);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['role-action-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['available-actions'] });
      setSelectedActionIds([]);
      const msg = [`${result.created} action(s) assigned`];
      if (result.skipped > 0) msg.push(`${result.skipped} already mapped`);
      if (result.errors.length > 0) msg.push(`${result.errors.length} error(s)`);
      showNotification(msg.join(', '), result.errors.length > 0 ? 'error' : 'success');
    },
    onError: (error: any) => {
      showNotification(error?.message || 'Failed to assign actions', 'error');
    },
  });

  // Remove mapping mutation
  const removeMappingMutation = useMutation({
    mutationFn: async (actionId: number) => {
      if (!selectedRole) throw new Error('No role selected');
      await AdminActionService.removeActionFromRole(selectedRole.value, actionId, selectedAppType?.value, selectedCategory?.value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-action-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['available-actions'] });
      showNotification('Action mapping removed successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error?.message || 'Failed to remove mapping', 'error');
    },
  });

  const roleOptions: RoleOption[] = (allRoles as any[]).map((role: any) => ({
    value: role.id,
    label: `${role.name} (${role.code})`,
    code: role.code,
  }));

  const mappedActions = mappingsData?.mappings?.filter(m => m.isActive) || [];
  const isLoading = rolesLoading || mappingsLoading;

  const handleBulkAssign = () => {
    if (selectedActionIds.length === 0) {
      showNotification('Please select at least one action to assign', 'error');
      return;
    }
    bulkAssignMutation.mutate(selectedActionIds);
  };

  const handleRemoveMapping = (mapping: RoleActionMapping) => {
    removeMappingMutation.mutate(mapping.actionId);
  };

  const handleSelectAllAvailable = () => {
    setSelectedActionIds(availableActions.map(a => a.id));
  };

  const handleClearSelection = () => {
    setSelectedActionIds([]);
  };

  const toggleActionSelection = (actionId: number) => {
    setSelectedActionIds(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: AdminBorderRadius.md,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text.primary,
      boxShadow: 'none',
      '&:hover': { borderColor: colors.border },
    }),
    option: (base: any) => ({
      ...base,
      backgroundColor: colors.background,
      color: colors.text.primary,
      '&:hover': { backgroundColor: colors.status.info, color: '#ffffff' },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: colors.background,
      borderColor: colors.border,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: colors.text.primary,
    }),
  };

  return (
    <AdminErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden' style={{ margin: AdminLayout.content.padding }}>
            <div className='bg-[#001F54] text-white px-6 py-8'>
              <h1 className='text-3xl font-bold mb-2'>Role-Action Mapping</h1>
              <p className='text-blue-100 text-lg'>
                Assign workflow actions to roles. Control which roles can perform which actions.
              </p>
            </div>
          </div>

          {/* Content */}
          <main style={{ flex: 1, overflow: 'auto', padding: AdminLayout.content.padding }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.xl }}>
              
              {/* Notification */}
              {notification.visible && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: notification.type === 'success' ? '#155724' : '#856404',
                    border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                  }}
                >
                  <span>{notification.message}</span>
                  <button onClick={() => setNotification(prev => ({ ...prev, visible: false }))} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'inherit' }}>×</button>
                </div>
              )}

              {/* Master Data Filters */}
              <AdminCard title='Filter by Context'>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: AdminSpacing.md }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: colors.text.secondary, marginBottom: '4px', display: 'block' }}>
                      Application Type
                    </label>
                    <ReactSelectFixed
                      options={appTypeOptions}
                      value={selectedAppType}
                      onChange={(opt: any) => { setSelectedAppType(opt); setSelectedActionIds([]); }}
                      placeholder='Any type'
                      isClearable
                      styles={selectStyles}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: colors.text.secondary, marginBottom: '4px', display: 'block' }}>
                      Category
                    </label>
                    <ReactSelectFixed
                      options={categoryOptions}
                      value={selectedCategory}
                      onChange={(opt: any) => { setSelectedCategory(opt); setSelectedActionIds([]); }}
                      placeholder='Any category'
                      isClearable
                      styles={selectStyles}
                    />
                  </div>
                </div>
              </AdminCard>

              {/* Role Selection */}
              <AdminCard title='Select Role'>
                {rolesLoading ? (
                  <AdminSectionSkeleton />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.md }}>
                    <ReactSelectFixed
                      options={roleOptions}
                      value={selectedRole}
                      onChange={(option: any) => {
                        setSelectedRole(option);
                        setSelectedActionIds([]);
                      }}
                      placeholder='Search and select a role...'
                      isClearable
                      styles={selectStyles}
                    />
                  </div>
                )}
              </AdminCard>

              {selectedRole && (
                <>
                  {/* Currently Mapped Actions */}
                  <AdminCard title={`Mapped Actions for ${selectedRole.label}`}>
                    {isLoading ? (
                      <AdminSectionSkeleton />
                    ) : mappedActions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: colors.text.secondary }}>
                        <svg className='mx-auto h-10 w-10 mb-3' style={{ opacity: 0.4 }} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                        </svg>
                        <p style={{ margin: 0, fontSize: '14px' }}>No actions mapped to this role yet.</p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.7 }}>Use the "Available Actions" section below to assign actions.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: AdminSpacing.md }}>
                        {mappedActions.map((mapping: RoleActionMapping) => (
                          <div
                            key={mapping.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              backgroundColor: colors.background,
                              border: `1px solid ${colors.border}`,
                              borderRadius: AdminBorderRadius.md,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.status.info; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                                {mapping.action.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <code style={{ backgroundColor: '#eef2ff', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                                  {mapping.action.code}
                                </code>
                                <span style={{ fontSize: '11px', color: colors.text.secondary }}>
                                  Mapped: {new Date(mapping.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveMapping(mapping)}
                              disabled={removeMappingMutation.isPending}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: removeMappingMutation.isPending ? 'not-allowed' : 'pointer',
                                opacity: removeMappingMutation.isPending ? 0.5 : 1,
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Audit Info */}
                    {mappingsData?.mappings && mappingsData.mappings.length > 0 && (
                      <div
                        style={{
                          marginTop: AdminSpacing.lg,
                          padding: AdminSpacing.md,
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.border}`,
                          borderRadius: AdminBorderRadius.md,
                          fontSize: '12px',
                          color: colors.text.secondary,
                        }}
                      >
                        <strong>Audit:</strong> {mappedActions.length} active mapping(s) for this role.
                        Last mapping created: {new Date(Math.max(...mappedActions.map(m => new Date(m.createdAt).getTime()))).toLocaleString()}
                      </div>
                    )}
                  </AdminCard>

                  {/* Available Actions to Assign */}
                  <AdminCard title={`Assign Actions to ${selectedRole.label}`}>
                    {availableLoading ? (
                      <AdminSectionSkeleton />
                    ) : availableActions.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: colors.text.secondary }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>All available actions are already mapped to this role.</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ marginBottom: AdminSpacing.md, display: 'flex', gap: AdminSpacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: colors.text.secondary }}>
                            {availableActions.length} action(s) available
                          </span>
                          <button
                            onClick={handleSelectAllAvailable}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${colors.border}`,
                              backgroundColor: 'transparent',
                              color: colors.status.info,
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            Select All
                          </button>
                          <button
                            onClick={handleClearSelection}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${colors.border}`,
                              backgroundColor: 'transparent',
                              color: colors.text.secondary,
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            Clear
                          </button>
                          <div style={{ flex: 1 }} />
                          <button
                            onClick={handleBulkAssign}
                            disabled={selectedActionIds.length === 0 || bulkAssignMutation.isPending}
                            style={{
                              padding: '8px 20px',
                              borderRadius: AdminBorderRadius.md,
                              border: 'none',
                              backgroundColor: selectedActionIds.length === 0 ? colors.disabled : colors.status.success,
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: selectedActionIds.length === 0 ? 'not-allowed' : 'pointer',
                              opacity: selectedActionIds.length === 0 ? 0.6 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {bulkAssignMutation.isPending
                              ? 'Assigning...'
                              : `Assign Selected (${selectedActionIds.length})`}
                          </button>
                        </div>

                        {/* Available Actions Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: AdminSpacing.sm }}>
                          {availableActions.map((action: Action) => {
                            const isSelected = selectedActionIds.includes(action.id);
                            return (
                              <label
                                key={action.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 12px',
                                  border: `1px solid ${isSelected ? colors.status.info : colors.border}`,
                                  borderRadius: AdminBorderRadius.md,
                                  backgroundColor: isSelected ? '#eff6ff' : colors.surface,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  userSelect: 'none',
                                }}
                                onMouseEnter={e => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = colors.hover;
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = colors.surface;
                                }}
                              >
                                <input
                                  type='checkbox'
                                  checked={isSelected}
                                  onChange={() => toggleActionSelection(action.id)}
                                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6', flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary }}>
                                    {action.name}
                                  </div>
                                  <code style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                                    {action.code}
                                  </code>
                                </div>
                                {action.description && (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: colors.text.tertiary,
                                      display: 'none',
                                    }}
                                    title={action.description}
                                  >
                                    ℹ️
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </AdminCard>

                  {/* Summary Card */}
                  <AdminCard title='Mapping Summary'>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: AdminSpacing.md }}>
                      <div style={{ padding: AdminSpacing.md, backgroundColor: colors.background, borderRadius: AdminBorderRadius.md, textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: colors.status.success }}>{mappedActions.length}</div>
                        <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: '4px' }}>Mapped Actions</div>
                      </div>
                      <div style={{ padding: AdminSpacing.md, backgroundColor: colors.background, borderRadius: AdminBorderRadius.md, textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: colors.status.info }}>{availableActions.length}</div>
                        <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: '4px' }}>Available to Assign</div>
                      </div>
                      <div style={{ padding: AdminSpacing.md, backgroundColor: colors.background, borderRadius: AdminBorderRadius.md, textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: colors.text.primary }}>{mappedActions.length + availableActions.length}</div>
                        <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: '4px' }}>Total Actions</div>
                      </div>
                    </div>
                  </AdminCard>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}
