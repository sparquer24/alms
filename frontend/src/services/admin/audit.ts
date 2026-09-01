import { apiClient } from '../../config/authenticatedApiClient';
import { AuditLog } from '../../store/slices/adminAuditSlice';

export interface AuditQueryParams {
  search?: string;
  user?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditStats {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ user: string; count: number }>;
}

export const AdminAuditService = {
  // Get audit logs with pagination and filters
  getAuditLogs: async (params: AuditQueryParams = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryString.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/audit?${queryString}`);
    return response;
  },

  // Get audit log by ID
  getAuditLogById: async (id: string) => {
    const response = await apiClient.get(`/admin/audit/${id}`);
    return response;
  },

  // Get audit statistics
  getAuditStats: async (params: { startDate?: string; endDate?: string } = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryString.append(key, value);
      }
    });

    const response = await apiClient.get(`/admin/audit/stats?${queryString}`);
    return response;
  },

  // Export audit logs to CSV
  exportAuditLogs: async (params: AuditQueryParams = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryString.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/audit/export?${queryString}`, {
      responseType: 'blob',
    });
    return response;
  },

  // Get user activity summary
  getUserActivitySummary: async (userId: string, params: { startDate?: string; endDate?: string } = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryString.append(key, value);
      }
    });

    const response = await apiClient.get(`/admin/audit/user/${userId}/summary?${queryString}`);
    return response;
  },

  // Get application activity
  getApplicationActivity: async (applicationId: string) => {
    const response = await apiClient.get(`/admin/audit/application/${applicationId}`);
    return response;
  },

  // Get system activity summary
  getSystemActivitySummary: async (params: { startDate?: string; endDate?: string } = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryString.append(key, value);
      }
    });

    const response = await apiClient.get(`/admin/audit/system/summary?${queryString}`);
    return response;
  },

  // Get real-time audit feed
  getRealTimeAuditFeed: async (params: { limit?: number } = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryString.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/audit/realtime?${queryString}`);
    return response;
  },
}; 