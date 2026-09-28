import { apiClient } from '../../config/authenticatedApiClient';

export interface Permission {
  id: number;
  key: string;
  label: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedRoles: string[];
}

export interface CreatePermissionParams {
  key: string;
  label: string;
  category: string;
  description?: string;
}

export interface UpdatePermissionParams {
  key?: string;
  label?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface PermissionQueryParams {
  search?: string;
  category?: string;
}

export const AdminPermissionService = {
  getPermissions: async (params: PermissionQueryParams = {}): Promise<Permission[]> => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryString.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`/admin/permissions?${queryString}`);
    return (response as any)?.data ?? response ?? [];
  },

  getPermissionById: async (id: string | number): Promise<Permission> => {
    const response = await apiClient.get(`/admin/permissions/${id}`);
    return (response as any)?.data ?? response;
  },

  createPermission: async (data: CreatePermissionParams): Promise<Permission> => {
    const response = await apiClient.post('/admin/permissions', data);
    return (response as any)?.data ?? response;
  },

  updatePermission: async (id: string | number, data: UpdatePermissionParams): Promise<Permission> => {
    const response = await apiClient.put(`/admin/permissions/${id}`, data);
    return (response as any)?.data ?? response;
  },

  deletePermission: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/admin/permissions/${id}`);
  },
};
