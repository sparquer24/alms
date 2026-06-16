'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../../components/Sidebar';
import {
  ConfirmationDialog,
  AdminErrorAlert,
  AdminErrorBoundary,
  AdminTableSkeleton,
} from '../../../components/admin';
import { ActionFormModal } from '../../../components/admin/ActionFormModal';
import type { ConfirmationDialogConfig } from '../../../components/admin/ConfirmationDialog';
import { AdminActionService } from '@/services/admin/actions';
import type { Action } from '@/services/admin/actions';
import type { ActionFormData } from '@/services/admin/actions';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminLayout, AdminSpacing, AdminBorderRadius } from '@/styles/admin-design-system';

export default function ActionManagementPage() {
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<(Partial<Action> & ActionFormData) | null>(null);

  // Confirmation Dialog State
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    config?: ConfirmationDialogConfig;
  }>({ isOpen: false });

  // Notification State
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
  };

  // Fetch Actions
  const {
    data: actionsData,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ['admin-actions', searchTerm, statusFilter, sortBy, sortOrder, currentPage, limit],
    queryFn: async () => {
      const response = await AdminActionService.getAllActions({
        search: searchTerm || undefined,
        status: statusFilter,
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  const actions = actionsData?.data || [];
  const totalPages = actionsData ? Math.ceil(actionsData.total / limit) : 1;

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (formData: ActionFormData) => AdminActionService.createAction(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      setIsFormModalOpen(false);
      setSelectedAction(null);
      showNotification('Action created successfully!', 'success');
    },
    onError: (error: any) => showNotification(error?.message || 'Failed to create action', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ActionFormData }) => AdminActionService.updateAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      setIsFormModalOpen(false);
      setSelectedAction(null);
      showNotification('Action updated successfully!', 'success');
    },
    onError: (error: any) => showNotification(error?.message || 'Failed to update action', 'error'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (actionId: number) => AdminActionService.toggleActionStatus(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      showNotification('Action status toggled successfully!', 'success');
    },
    onError: (error: any) => showNotification(error?.message || 'Failed to toggle status', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (actionId: number) => AdminActionService.deleteAction(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      showNotification('Action deactivated successfully!', 'success');
    },
    onError: (error: any) => showNotification(error?.message || 'Failed to deactivate action', 'error'),
  });

  // Handlers
  const handleAddAction = () => { setSelectedAction(null); setIsFormModalOpen(true); };

  const handleEditAction = (action: Action) => {
    setSelectedAction({
      id: action.id, name: action.name, code: action.code,
      description: action.description || '', isActive: action.isActive,
    });
    setIsFormModalOpen(true);
  };

  const handleFormSave = async (formData: ActionFormData) => {
    if (selectedAction?.id) {
      await updateMutation.mutateAsync({ id: selectedAction.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleToggleStatus = (action: Action) => {
    setSelectedAction({ ...action, description: action.description || '' });
    setConfirmationDialog({
      isOpen: true,
      config: {
        title: action.isActive ? 'Deactivate Action' : 'Activate Action',
        message: `Are you sure you want to ${action.isActive ? 'deactivate' : 'activate'} the action "${action.name}" (${action.code})?`,
        type: action.isActive ? 'deactivate' : 'warning',
        confirmText: action.isActive ? 'Deactivate' : 'Activate',
        cancelText: 'Cancel',
        onConfirm: async () => { await toggleStatusMutation.mutateAsync(action.id); setConfirmationDialog({ isOpen: false }); },
        onCancel: () => setSelectedAction(null),
      },
    });
  };

  const handleDeleteAction = (action: Action) => {
    setSelectedAction({ ...action, description: action.description || '' });
    setConfirmationDialog({
      isOpen: true,
      config: {
        title: 'Deactivate Action',
        message: `Are you sure you want to deactivate "${action.name}" (${action.code})? This action will no longer be available.`,
        type: 'delete',
        confirmText: 'Deactivate',
        cancelText: 'Cancel',
        onConfirm: async () => { await deleteMutation.mutateAsync(action.id); setConfirmationDialog({ isOpen: false }); },
        onCancel: () => setSelectedAction(null),
      },
    });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span style={{ opacity: 0.3, marginLeft: 4, color: colors.text.muted }}>↕</span>;
    return <span style={{ marginLeft: 4, color: colors.status.info }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <AdminErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header Section */}
          <div
            className='rounded-xl border shadow-sm overflow-hidden'
            style={{
              margin: AdminLayout.content.padding,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className='bg-[#001F54] text-white px-6 py-8'>
              <h1 className='text-3xl font-bold mb-2'>Action Management</h1>
              <p className='text-blue-100 text-lg'>Create, edit, and manage workflow actions with status control</p>
            </div>
            <div style={{ padding: '24px', backgroundColor: colors.surface }}>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                <div className='flex flex-col sm:flex-row gap-3 flex-1'>
                  <div className='relative flex-1 max-w-md'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' style={{ color: colors.text.tertiary }}>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                      </svg>
                    </div>
                    <input
                      aria-label='Search actions'
                      className='w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                      placeholder='Search by name, code, or description...'
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text.primary,
                      }}
                    />
                    {searchTerm && (
                      <button
                        aria-label='Clear search'
                        onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                        className='absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-full'
                        style={{ backgroundColor: colors.hover, color: colors.text.secondary }}
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                      </button>
                    )}
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                    className='rounded-lg border px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[160px]'
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text.primary,
                    }}
                  >
                    <option value='all'>All Statuses</option>
                    <option value='active'>Active</option>
                    <option value='inactive'>Inactive</option>
                  </select>
                </div>
                <button
                  onClick={handleAddAction}
                  className='inline-flex items-center justify-center rounded-lg text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap'
                  style={{ backgroundColor: colors.status.info }}
                >
                  <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                  Add Action
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main style={{ flex: 1, overflow: 'auto', padding: AdminLayout.content.padding }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {fetchError && (
                <AdminErrorAlert
                  title='Failed to Load Actions'
                  message={(fetchError as any)?.message || 'An error occurred'}
                  onRetry={() => { setCurrentPage(1); refetch(); }}
                />
              )}

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
                  <button onClick={() => setNotification(prev => ({ ...prev, visible: false }))} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'inherit' }}>×</button>
                </div>
              )}

              {/* Actions Table Card */}
              <div
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: AdminBorderRadius.lg,
                  border: `1px solid ${colors.border}`,
                  overflow: 'hidden',
                }}
              >
                {isLoading ? (
                  <AdminTableSkeleton rows={5} columns={5} />
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: colors.surface, borderBottom: `2px solid ${colors.border}` }}>
                            {[
                              { key: 'name', label: 'Name' },
                              { key: 'code', label: 'Code' },
                              { key: 'description', label: 'Description', sortable: false },
                              { key: 'isActive', label: 'Status' },
                              { key: 'updatedAt', label: 'Updated' },
                            ].map(col => (
                              <th
                                key={col.key}
                                onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                                style={{
                                  padding: AdminSpacing.md,
                                  textAlign: col.key === 'isActive' ? 'center' : col.key === 'Actions' ? 'right' : 'left',
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  color: colors.text.secondary,
                                  cursor: col.sortable !== false ? 'pointer' : 'default',
                                  userSelect: 'none',
                                }}
                              >
                                {col.label}{col.sortable !== false && <SortIcon field={col.key} />}
                              </th>
                            ))}
                            <th style={{ padding: AdminSpacing.md, textAlign: 'right', fontWeight: 600, fontSize: '13px', color: colors.text.secondary }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {actions.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: colors.text.tertiary }}>
                                {searchTerm || statusFilter !== 'all'
                                  ? 'No actions match your search criteria.'
                                  : 'No actions found. Click "Add Action" to create one.'}
                              </td>
                            </tr>
                          ) : (
                            actions.map((action: Action, idx: number) => (
                              <tr
                                key={action.id}
                                style={{
                                  borderBottom: `1px solid ${colors.border}`,
                                  backgroundColor: idx % 2 === 0 ? colors.surface : colors.background,
                                  transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.hover; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? colors.surface : colors.background; }}
                              >
                                <td style={{ padding: AdminSpacing.md, fontWeight: 600, fontSize: '14px', color: colors.text.primary }}>
                                  {action.name}
                                </td>
                                <td style={{ padding: AdminSpacing.md }}>
                                  <code style={{
                                    backgroundColor: colors.hover,
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: colors.status.info,
                                    fontWeight: 600,
                                  }}>
                                    {action.code}
                                  </code>
                                </td>
                                <td style={{
                                  padding: AdminSpacing.md,
                                  fontSize: '13px',
                                  color: colors.text.secondary,
                                  maxWidth: '250px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {action.description || <span style={{ color: colors.text.muted, fontStyle: 'italic' }}>No description</span>}
                                </td>
                                <td style={{ padding: AdminSpacing.md, textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      padding: '3px 10px',
                                      borderRadius: '9999px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      backgroundColor: action.isActive ? '#dcfce7' : '#fef2f2',
                                      color: action.isActive ? '#166534' : '#991b1b',
                                    }}
                                  >
                                    {action.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td style={{ padding: AdminSpacing.md, fontSize: '13px', color: colors.text.secondary }}>
                                  {formatDate(action.updatedAt || action.createdAt)}
                                </td>
                                <td style={{ padding: AdminSpacing.md, textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                      onClick={() => handleEditAction(action)}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: AdminBorderRadius.md,
                                        border: `1px solid ${colors.border}`,
                                        backgroundColor: colors.surface,
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        color: colors.status.info,
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.hover; }}
                                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = colors.surface; }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus(action)}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: AdminBorderRadius.md,
                                        border: `1px solid ${action.isActive ? '#fde68a' : '#bbf7d0'}`,
                                        backgroundColor: action.isActive ? '#fffbeb' : '#f0fdf4',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        color: action.isActive ? '#b45309' : '#15803d',
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = action.isActive ? '#fef3c7' : '#dcfce7';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = action.isActive ? '#fffbeb' : '#f0fdf4';
                                      }}
                                    >
                                      {action.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div
                      style={{
                        padding: AdminSpacing.lg,
                        borderTop: `1px solid ${colors.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: colors.surface,
                      }}
                    >
                      <div style={{ fontSize: '13px', color: colors.text.secondary }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, actionsData?.total || 0)} of {actionsData?.total || 0} actions
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding: '6px 12px',
                            borderRadius: AdminBorderRadius.md,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: currentPage === 1 ? colors.background : colors.surface,
                            color: currentPage === 1 ? colors.text.muted : colors.text.secondary,
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const startPage = Math.max(1, currentPage - 2);
                          const pageNum = startPage + i;
                          if (pageNum > totalPages) return null;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: AdminBorderRadius.md,
                                border: currentPage === pageNum ? `1px solid ${colors.status.info}` : `1px solid ${colors.border}`,
                                backgroundColor: currentPage === pageNum ? '#eff6ff' : colors.surface,
                                color: currentPage === pageNum ? colors.status.info : colors.text.secondary,
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: currentPage === pageNum ? 600 : 500,
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '6px 12px',
                            borderRadius: AdminBorderRadius.md,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: currentPage === totalPages ? colors.background : colors.surface,
                            color: currentPage === totalPages ? colors.text.muted : colors.text.secondary,
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <ActionFormModal
        isOpen={isFormModalOpen}
        action={selectedAction}
        onClose={() => { setIsFormModalOpen(false); setSelectedAction(null); }}
        onSave={handleFormSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        config={confirmationDialog.config}
        isLoading={toggleStatusMutation.isPending || deleteMutation.isPending}
        onClose={() => setConfirmationDialog({ isOpen: false })}
      />
    </AdminErrorBoundary>
  );
}
