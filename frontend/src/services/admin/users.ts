import { apiClient } from '../../config/authenticatedApiClient';
import { AdminUser } from '../../store/slices/adminUserSlice';

export interface CreateUserParams {
  name: string;
  email: string;
  username: string;
  password: string;
  roleId: string;
  locationId?: string;
  isActive?: boolean;
}

export interface UpdateUserParams {
  name?: string;
  email?: string;
  username?: string;
  roleId?: string;
  locationId?: string;
  isActive?: boolean;
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const AdminUserService = {
  // Get all users with pagination and filters
  getUsers: async (params: UserQueryParams = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryString.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/users?${queryString}`);
    return response;
  },

  // Get user by ID
  getUserById: async (id: string) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response;
  },

  // Create new user
  createUser: async (userData: CreateUserParams) => {
    const response = await apiClient.post('/admin/users', userData);
    return response;
  },

  // Update user
  updateUser: async (id: string, userData: UpdateUserParams) => {
    const response = await apiClient.put(`/admin/users/${id}`, userData);
    return response;
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response;
  },

  // Bulk delete users
  bulkDeleteUsers: async (userIds: string[]) => {
    const response = await apiClient.post('/admin/users/bulk-delete', { userIds });
    return response;
  },

  // Activate/deactivate user
  toggleUserStatus: async (id: string, isActive: boolean) => {
    const response = await apiClient.put(`/admin/users/${id}/status`, { isActive });
    return response;
  },

  // Reset user password
  resetUserPassword: async (id: string, newPassword: string) => {
    const response = await apiClient.put(`/admin/users/${id}/password`, { newPassword });
    return response;
  },

  // Get user activity
  getUserActivity: async (id: string, params: { startDate?: string; endDate?: string } = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryString.append(key, value);
      }
    });

    const response = await apiClient.get(`/admin/users/${id}/activity?${queryString}`);
    return response;
  },
}; 