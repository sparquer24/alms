import { apiClient, getAuthToken, redirectToLogin } from '../../config/authenticatedApiClient';


export interface CreateRoleParams {
  name: string;
  displayName: string;
  description?: string;
  permissions: Record<string, boolean>;
  isActive?: boolean;
}

export interface UpdateRoleParams {
  name?: string;
  displayName?: string;
  description?: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
}

export interface RoleQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const AdminRoleService = {
  // Get all roles with pagination and filters
  getRoles: async (params: RoleQueryParams = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryString.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/roles?${queryString}`);
    return response;
  },

  // Get role by ID
  getRoleById: async (id: string) => {
    const response = await apiClient.get(`/admin/roles/${id}`);
    return response;
  },

  // Create new role
  createRole: async (roleData: CreateRoleParams) => {
    const response = await apiClient.post('/admin/roles', roleData);
    return response;
  },

  // Update role
  updateRole: async (id: string, roleData: UpdateRoleParams) => {
    const response = await apiClient.put(`/admin/roles/${id}`, roleData);
    return response;
  },

  // Delete role
  deleteRole: async (id: string) => {
    const response = await apiClient.delete(`/admin/roles/${id}`);
    return response;
  },

  // Update role permissions
  updateRolePermissions: async (id: string, permissions: Record<string, boolean>) => {
    const response = await apiClient.put(`/admin/roles/${id}/permissions`, { permissions });
    return response;
  },

  // Get all available permissions
  getPermissions: async () => {
    const response = await apiClient.get('/admin/permissions');
    return response;
  },

  // Get users assigned to a role
  getRoleUsers: async (id: string, params: { page?: number; limit?: number } = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryString.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/roles/${id}/users?${queryString}`);
    return response;
  },

  // Assign users to role
  assignUsersToRole: async (roleId: string, userIds: string[]) => {
    const response = await apiClient.post(`/admin/roles/${roleId}/users`, { userIds });
    return response;
  },

  // Remove users from role
  removeUsersFromRole: async (roleId: string, userIds: string[]) => {
    const qs = userIds.map(encodeURIComponent).join(',');
    const response = await apiClient.delete(`/admin/roles/${roleId}/users?userIds=${qs}`);
    return response;
  },

  // Get role usage statistics
  getRoleStats: async (id: string) => {
    const response = await apiClient.get(`/admin/roles/${id}/stats`);
    return response;
  },
}; 