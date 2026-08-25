'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../../components/Sidebar';
import { AdminErrorBoundary } from '../../../components/admin';
import { AdminRoleService } from '@/services/admin/roles';
import { AdminActionService, Action, RoleActionMapping } from '@/services/admin/actions';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminLayout } from '@/styles/admin-design-system';

export default function ActionMappingPage() {
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();

  // Selected Role & Application Type State
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedAppType, setSelectedAppType] = useState<string>('FRESH');

  const appTypeOptions = [
    { value: 'FRESH', label: 'Fresh' },
    { value: 'RENEWAL', label: 'Renewal' },
    { value: 'CANCEL', label: 'Cancellation' },
  ];

  // Create Action Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newActionCode, setNewActionCode] = useState('');
  const [newActionName, setNewActionName] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');

  // Notification State
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
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async (): Promise<any[]> => {
      const response = await AdminRoleService.getRoles({ limit: 1000 }) as any;
      return response && typeof response === 'object' && 'data' in response ? response.data : [];
    },
  });

  // Fetch All Actions
  const { data: actionsData, isLoading: isLoadingActions } = useQuery({
    queryKey: ['admin-actions-all'],
    queryFn: async () => {
      const response = await AdminActionService.getAllActions();
      return Array.isArray(response) ? response : [];
    },
  });

  // Fetch Mappings for Selected Role + Application Type
  const { data: mappingsData, isLoading: isLoadingMappings } = useQuery({
    queryKey: ['admin-action-mappings', selectedRoleId, selectedAppType],
    queryFn: async () => {
      if (!selectedRoleId) return [];
      const response = await AdminActionService.getAllActionMappings(selectedRoleId, selectedAppType);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!selectedRoleId,
  });

  // Toggle Action Mapping Mutation
  const toggleMappingMutation = useMutation({
    mutationFn: async ({ actionId, mapping, enable }: { actionId: number; mapping?: RoleActionMapping; enable: boolean }) => {
      if (!selectedRoleId) throw new Error('No role selected');

      if (enable) {
        // Create new mapping or re-activate existing
        if (mapping) {
          return await AdminActionService.updateActionMapping(mapping.id, { isActive: true });
        } else {
          return await AdminActionService.createActionMapping({
            roleId: selectedRoleId,
            actionId: actionId,
            applicationType: selectedAppType,
            isActive: true,
          });
        }
      } else {
        // Deactivate mapping
        if (mapping) {
          return await AdminActionService.deleteActionMapping(mapping.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-action-mappings', selectedRoleId, selectedAppType] });
      showNotification('Action mapping updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update mapping', 'error');
    },
  });

  // Create New Action Mutation
  const createActionMutation = useMutation({
    mutationFn: async () => {
      if (!newActionCode || !newActionName) throw new Error('Code and Name are required');
      return await AdminActionService.createNewAction({
        code: newActionCode.toUpperCase().replace(/\s+/g, '_'),
        name: newActionName,
        description: newActionDescription,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-actions-all'] });
      setIsCreateModalOpen(false);
      setNewActionCode('');
      setNewActionName('');
      setNewActionDescription('');
      showNotification('Action created successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to create action', 'error');
    },
  });

  // Compute the current state of mappings
  const actionStatusMap = useMemo(() => {
    const map = new Map<number, RoleActionMapping>();
    if (mappingsData) {
      mappingsData.forEach((m: RoleActionMapping) => {
        map.set(m.actionId, m);
      });
    }
    return map;
  }, [mappingsData]);

  const handleToggle = (actionId: number, currentMapping?: RoleActionMapping) => {
    const currentlyEnabled = currentMapping ? currentMapping.isActive : false;
    toggleMappingMutation.mutate({
      actionId,
      mapping: currentMapping,
      enable: !currentlyEnabled,
    });
  };

  return (
    <AdminErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
        <Sidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header Section */}
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden' style={{ margin: AdminLayout.content.padding }}>
            <div className='bg-[#001F54] text-white px-6 py-8'>
              <div className='text-white'>
                <h1 className='text-3xl font-bold mb-2'>Action Mapping</h1>
                <p className='text-blue-100 text-lg'>
                  Configure which roles have permission to perform specific workflow actions
                </p>
              </div>
            </div>
            <div className='p-6 bg-white'>
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div className='flex flex-col md:flex-row gap-4 w-full md:w-auto'>
                  <div className='flex flex-col gap-2'>
                    <label className='font-medium text-slate-700'>Select Role to Configure</label>
                    <select
                      value={selectedRoleId || ''}
                      onChange={(e) => setSelectedRoleId(Number(e.target.value) || null)}
                      className='rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[250px]'
                    >
                      <option value=''>-- Select a Role --</option>
                      {rolesData?.map((role: any) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <label className='font-medium text-slate-700'>Application Type</label>
                    <select
                      value={selectedAppType}
                      onChange={(e) => setSelectedAppType(e.target.value)}
                      className='rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[200px]'
                    >
                      {appTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className='inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap mt-6 md:mt-0'
                >
                  <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                  Create New Action
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main style={{ flex: 1, overflow: 'auto', padding: AdminLayout.content.padding }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: AdminLayout.content.gap }}>
              {notification.visible && (
                <div className={`p-4 rounded-lg flex justify-between items-center ${notification.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' : 'bg-red-100 border border-red-300 text-red-800'}`}>
                  <span>{notification.message}</span>
                  <button onClick={() => setNotification(prev => ({ ...prev, visible: false }))} className='text-lg font-bold'>&times;</button>
                </div>
              )}

              {selectedRoleId ? (
                <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
                  <div className='p-6 border-b border-slate-200'>
                    <h2 className='text-xl font-semibold text-slate-800'>Available Actions</h2>
                    <p className='text-slate-500 mt-1 text-sm'>Toggle the switches to grant or revoke actions for the selected role and application type.</p>
                  </div>
                  
                  {isLoadingActions || isLoadingMappings ? (
                    <div className='p-8 text-center text-slate-500'>Loading actions...</div>
                  ) : (
                    <div className='p-0'>
                      <table className='w-full text-left border-collapse'>
                        <thead>
                          <tr className='bg-slate-50 border-b border-slate-200'>
                            <th className='p-4 font-semibold text-slate-600 text-sm'>Action Name</th>
                            <th className='p-4 font-semibold text-slate-600 text-sm'>Code</th>
                            <th className='p-4 font-semibold text-slate-600 text-sm w-40'>Allowed By</th>
                            <th className='p-4 font-semibold text-slate-600 text-sm w-32 text-center'>Access</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionsData?.map((action: Action) => {
                            const mapping = actionStatusMap.get(action.id);
                            const isEnabled = mapping ? mapping.isActive : false;
                            
                            return (
                              <tr key={action.id} className='border-b border-slate-100 hover:bg-slate-50'>
                                <td className='p-4 font-medium text-slate-800'>{action.name}</td>
                                <td className='p-4 text-slate-500 text-sm'>
                                  <span className='bg-slate-100 px-2 py-1 rounded text-xs font-mono'>{action.code}</span>
                                </td>
                                <td className='p-4 text-sm text-slate-600'>
                                  {isEnabled && mapping?.allowedBy?.username ? (
                                    <span className='text-slate-700'>{mapping.allowedBy.username}</span>
                                  ) : (
                                    <span className='text-slate-400'>—</span>
                                  )}
                                </td>
                                <td className='p-4 text-center'>
                                  <button
                                    onClick={() => handleToggle(action.id, mapping)}
                                    disabled={toggleMappingMutation.isPending}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'} ${toggleMappingMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          
                          {actionsData?.length === 0 && (
                            <tr>
                              <td colSpan={4} className='p-8 text-center text-slate-500'>No actions found in the system.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center'>
                  <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4'>
                    <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                  </div>
                  <h3 className='text-lg font-medium text-slate-900'>No Role Selected</h3>
                  <p className='mt-1 text-slate-500'>Please select a role from the dropdown above to view and manage its action mappings.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Create Action Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Create New Action</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Action Name</label>
                <input
                  type="text"
                  value={newActionName}
                  onChange={(e) => setNewActionName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="e.g. Reject Application"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Action Code</label>
                <input
                  type="text"
                  value={newActionCode}
                  onChange={(e) => setNewActionCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-mono"
                  placeholder="e.g. REJECT_APP"
                />
                <p className="text-xs text-slate-500 mt-1">Unique identifier, uppercase with underscores.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newActionDescription}
                  onChange={(e) => setNewActionDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Brief description of what this action does..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createActionMutation.mutate()}
                disabled={!newActionName || !newActionCode || createActionMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createActionMutation.isPending ? 'Creating...' : 'Create Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminErrorBoundary>
  );
}
