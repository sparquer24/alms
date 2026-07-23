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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  action?: Action;
}

export const AdminActionService = {
  // Get all actions
  getAllActions: async () => {
    const response = await apiClient.get('/actiones/all');
    return response;
  },

  // Get all action mappings
  getAllActionMappings: async (roleId?: number) => {
    const url = roleId ? `/actiones/RolesActionsMapping?roleId=${roleId}` : '/actiones/RolesActionsMapping';
    const response = await apiClient.get(url);
    return response;
  },

  // Create a new action (Actiones table)
  createNewAction: async (data: { code: string; name: string; description?: string; isActive?: boolean }) => {
    const response = await apiClient.post('/actiones', data);
    return response;
  },

  // Create action mapping
  createActionMapping: async (data: { roleId: number; actionId: number; isActive: boolean }) => {
    const response = await apiClient.post('/actiones/RolesActionsMapping', data);
    return response;
  },

  // Update action mapping
  updateActionMapping: async (id: number, data: { roleId?: number; actionId?: number; isActive?: boolean }) => {
    const response = await apiClient.put(`/actiones/RolesActionsMapping/${id}`, data);
    return response;
  },

  // Delete action mapping
  deleteActionMapping: async (id: number) => {
    const response = await apiClient.delete(`/actiones/RolesActionsMapping/${id}`);
    return response;
  },
};
