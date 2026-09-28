import { apiClient } from '../../config/authenticatedApiClient';

export interface Action {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface RoleActionMapping {
  id: number;
  roleId: number;
  actionId: number;
  applicationType: string;
  isActive: boolean;
  allowedById?: number | null;
  createdAt: string;
  updatedAt: string;
  action?: Action;
  allowedBy?: { id: number; username: string } | null;
}

export const AdminActionService = {
  // Get all actions
  getAllActions: async () => {
    const response = await apiClient.get('/actiones/all');
    return response;
  },

  // Get all action mappings, optionally filtered by roleId and/or applicationType
  getAllActionMappings: async (roleId?: number, applicationType?: string) => {
    const params = new URLSearchParams();
    if (roleId) params.append('roleId', String(roleId));
    if (applicationType) params.append('applicationType', applicationType);
    const qs = params.toString();
    const url = qs ? `/actiones/RolesActionsMapping?${qs}` : '/actiones/RolesActionsMapping';
    const response = await apiClient.get(url);
    return response;
  },

  // Create a new action (Actiones table)
  createNewAction: async (data: { code: string; name: string; description?: string; isActive?: boolean }) => {
    const response = await apiClient.post('/actiones', data);
    return response;
  },

  // Create action mapping
  createActionMapping: async (data: { roleId: number; actionId: number; applicationType: string; isActive: boolean }) => {
    const response = await apiClient.post('/actiones/RolesActionsMapping', data);
    return response;
  },

  // Update action mapping
  updateActionMapping: async (id: number, data: { roleId?: number; actionId?: number; applicationType?: string; isActive?: boolean }) => {
    const response = await apiClient.put(`/actiones/RolesActionsMapping/${id}`, data);
    return response;
  },

  // Delete action mapping
  deleteActionMapping: async (id: number) => {
    const response = await apiClient.delete(`/actiones/RolesActionsMapping/${id}`);
    return response;
  },
};
