'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield } from 'lucide-react';
import {
  PageSubHeader,
  SubHeaderButton,
  SubHeaderPills,
} from '@/components/common/PageSubHeader';
import { AdminErrorBoundary } from '@/components/admin';
import { AdminRoleService } from '@/services/admin/roles';
import { AdminActionService, Action, RoleActionMapping } from '@/services/admin/actions';
import { useAdminTheme } from '@/context/AdminThemeContext';

export default function ActionMappingContent() {
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
  const { data: rolesData = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async (): Promise<any[]> => {
      const response = await AdminRoleService.getRoles({ limit: 1000 }) as any;
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response?.data && Array.isArray(response.data.data)) return response.data.data;
      return [];
    },
  });

  // Auto-select first role on load if none is selected
  useEffect(() => {
    if (!selectedRoleId && rolesData && rolesData.length > 0) {
      setSelectedRoleId(rolesData[0].id);
    }
  }, [rolesData, selectedRoleId]);

  const selectedRole = useMemo(
    () => rolesData?.find((r: any) => r.id === selectedRoleId),
    [rolesData, selectedRoleId]
  );

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
      <div className="flex flex-col flex-grow">
        <PageSubHeader
          title="Workflow Action Mapping"
          metaBadge={selectedRole ? `Role: ${selectedRole.name}` : 'Select a Role'}
          actions={
            <>
              {/* Role Selector */}
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="hidden sm:inline text-gray-400">Role:</span>
                <select
                  aria-label="Select Role to Configure"
                  value={selectedRoleId || ''}
                  onChange={(e) => setSelectedRoleId(Number(e.target.value) || null)}
                  className="rounded-lg bg-white/10 border border-white/10 text-xs text-white px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all cursor-pointer min-w-[160px]"
                >
                  <option value="" className="bg-[#0F2D52] text-white">-- Select Role --</option>
                  {rolesData?.map((role: any) => (
                    <option key={role.id} value={role.id} className="bg-[#0F2D52] text-white">
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Application Type Pills */}
              <SubHeaderPills
                value={selectedAppType}
                onChange={setSelectedAppType}
                options={[
                  { key: 'FRESH', label: 'Fresh' },
                  { key: 'RENEWAL', label: 'Renewal' },
                  { key: 'CANCEL', label: 'Cancellation' },
                ]}
              />

              {/* Create New Action Button */}
              <SubHeaderButton
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Action
              </SubHeaderButton>
            </>
          }
        />

        {/* Main Content Area */}
        <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
            <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto'>
              <div className='inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-[#001F54] mb-3'>
                <Shield className='w-7 h-7 text-[#001F54]' />
              </div>
              <h3 className='text-lg font-bold text-slate-900'>Select a Role</h3>
              <p className='mt-1 text-slate-500 text-sm mb-6'>
                Please select a role from the sub-header controls or click a role below to configure its permissions for {selectedAppType.toLowerCase()} applications:
              </p>
              {isLoadingRoles ? (
                <div className="text-sm text-slate-400 py-4">Loading available roles...</div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left'>
                  {rolesData?.map((role: any) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className='flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#001F54] hover:bg-slate-50 transition-all text-sm font-medium text-slate-800 group cursor-pointer'
                    >
                      <span className="group-hover:text-[#001F54] transition-colors">{role.name}</span>
                      <span className='text-xs font-mono text-slate-400 group-hover:text-[#001F54] group-hover:bg-blue-50 bg-slate-100 px-2 py-0.5 rounded transition-colors'>
                        {role.code}
                      </span>
                    </button>
                  ))}
                  {rolesData?.length === 0 && (
                    <p className="text-sm text-slate-400 col-span-2 text-center py-2">No roles found.</p>
                  )}
                </div>
              )}
            </div>
          )}
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
