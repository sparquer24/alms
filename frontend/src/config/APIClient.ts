/**
 * ALMS API Client
 * This file contains utility functions to interact with the APIs
 */

import { apiClient, getAuthToken, redirectToLogin } from './authenticatedApiClient';
import { setAuthToken } from '../api/axiosConfig';
import {
  BASE_URL,
  AUTH_APIS,
  APPLICATION_APIS,
  DOCUMENT_APIS,
  REPORT_APIS,  USER_APIS,
  ROLE_APIS,
  NOTIFICATION_APIS,
  DASHBOARD_APIS,
  LoginParams,
  ApplicationQueryParams,
  CreateApplicationParams,
  UpdateStatusParams,
  ForwardApplicationParams,
  ReportQueryParams,
  ApplicationsByStatusParams,
  UserQueryParams,
  NotificationQueryParams,
  UserPreferencesParams,
  BatchProcessParams,
  ApiResponse,
  appendQueryParams,
  getHeaders,
  getMultipartHeaders,
} from './APIsEndpoints';

/**
 * Authentication API client - These endpoints don't require authorization headers
 */
export const AuthApi = {
  login: async (params: LoginParams): Promise<ApiResponse<any>> => {
    console.log('🌐 APIClient - login called with params:', { 
      username: params.username, 
      passwordLength: params.password.length 
    });
    
    const url = AUTH_APIS.LOGIN;
    const headers = getHeaders();
    const body = JSON.stringify(params);
    
    console.log('🌐 Request details:');
    console.log('  URL:', url);
    console.log('  Headers:', headers);
    console.log('  Body:', body);
    console.log('  Method: POST');
    
    try {
      const data = await apiClient.post(url, params as any);
      console.log('🌐 Parsed response data:', data);
      return data as any;
    } catch (error) {
      console.error('🌐 APIClient login error:', error);
      throw error;
    }
  },

  // Note: getCurrentUser is the only auth endpoint that requires authorization (for getting current user info)
  getCurrentUser: async (token: string): Promise<ApiResponse<any>> => {
    try {
      // If a token was passed (e.g. immediately after login), ensure axios has it set
      if (token) {
        try {
          setAuthToken(token);
        } catch (e) {
          // ignore
        }
      }
      return await apiClient.get('/auth/me');
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  // New: call /auth/getMe which returns a trimmed user object and accepts a token
  getMe: async (token?: string): Promise<ApiResponse<any>> => {
    try {
      // If a token is provided (as during login), set it on the axios instance so apiClient.get works
      if (token) {
        try {
          setAuthToken(token);
        } catch (e) {
          // ignore
        }
      }
      return await apiClient.get('/auth/getMe');
    } catch (error) {
      console.error('Error getting /auth/getMe:', error);
      throw error;
    }
  },

  // All other auth endpoints use the authenticated client
  logout: async (): Promise<ApiResponse<any>> => {
    try {
      // No-op logout: server endpoint removed. Client will clear auth state/cookies.
      return { statusCode: 200, success: true, body: { message: 'Logged out locally' } } as any;
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },
  
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },
  
  resetPassword: async (email: string): Promise<ApiResponse<any>> => {
  return await apiClient.post(AUTH_APIS.RESET_PASSWORD, { email });
  },
  
  refreshToken: async (refreshToken: string): Promise<ApiResponse<any>> => {
  return await apiClient.post(AUTH_APIS.REFRESH_TOKEN, { refreshToken });
  },
};

/**
 * Application API client - All endpoints require authentication
 */
import { Application } from '../types/application';

export const ApplicationApi = {
  getAll: async (params: ApplicationQueryParams = {}): Promise<ApiResponse<Application[]>> => {
    try {
  // Pass params directly so ApiClient wraps them once (prevents params[params[...]] nesting)
  let data:any =  await apiClient.get('/application-form', params as any);
  console.log({data});
  return data;
    } catch (error) {
      console.error('Error getting applications:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<ApiResponse<Application>> => {
    try {
      return await apiClient.get(`/application-form/${id}`);
    } catch (error) {
      console.error('Error getting application by ID:', error);
      throw error;
    }
  },

  create: async (params: CreateApplicationParams): Promise<ApiResponse<Application>> => {
    try {
      return await apiClient.post('/application-form', params);
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, params: UpdateStatusParams): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.put(`/applications/${id}/status`, params);
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  },

  forward: async (id: string, params: ForwardApplicationParams): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.post(`/applications/${id}/forward`, params);
    } catch (error) {
      console.error('Error forwarding application:', error);
      throw error;
    }
  },

  batchProcess: async (params: BatchProcessParams): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.post('/applications/batch', params);
    } catch (error) {
      console.error('Error batch processing applications:', error);
      throw error;
    }
  },
  // New: fetch applications using the application-form endpoint filtered by status ids.
  // Expects statusIds as array of string|number; optional query params like page/limit can be provided.
  getByStatuses: async (statusIds: Array<string | number>, params: Record<string, any> = {}): Promise<ApiResponse<any>> => {
    try {
      const ids = (statusIds || []).map(String).join(',');
  const query = { ...params, statusIds: ids };
  return await apiClient.get('/application-form', query as any);
    } catch (error) {
      console.error('Error getting applications by statuses:', error);
      throw error;
    }
  },
};

/**
 * Document API client - All endpoints require authentication
 */
export const DocumentApi = {
  upload: async (applicationId: string, file: File, documentType: string): Promise<ApiResponse<any>> => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      
      return await apiClient.uploadFile(`/applications/${applicationId}/documents`, formData);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  getAll: async (applicationId: string): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.get(`/applications/${applicationId}/documents`);
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  },

  delete: async (applicationId: string, documentId: string): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.delete(`/applications/${applicationId}/documents/${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },
};

/**
 * Report API client - All endpoints require authentication
 */
export const ReportApi = {
  getStatistics: async (params: ReportQueryParams = {}): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.get('/reports/statistics', params);
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  },

  getApplicationsByStatus: async (params: ApplicationsByStatusParams): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.get('/reports/applications-by-status', params);
    } catch (error) {
      console.error('Error getting applications by status:', error);
      throw error;
    }
  },

  generatePdf: async (applicationId: string): Promise<Blob> => {
    try {
      // Special handling for blob response
      const token = getAuthToken();
      if (!token) {
        redirectToLogin();
        throw new Error('Authentication required');
      }

  // Use apiClient which ensures auth headers are set
  const blob = await apiClient.get(`/applications/${applicationId}/pdf`);
  // apiClient.get may return parsed JSON; if server returns blob, adapt accordingly
  if (blob instanceof Blob) return blob;
  // If axios returned data as ArrayBuffer or base64, convert accordingly
  // Fallback: try requesting via axiosInstance directly
  const axios = await import('../api/axiosConfig');
  const resp = await axios.default.get(`${BASE_URL}/applications/${applicationId}/pdf`, { responseType: 'blob' });
  return resp.data as Blob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },
};

/**
 * User API client - All endpoints require authentication
 */
export const UserApi = {
  getByRole: async (role: string): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.get('/users', { role });
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  },
  
  getPreferences: async (): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.get('/users/preferences');
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  },
  
  updatePreferences: async (preferences: UserPreferencesParams): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.put('/users/preferences', preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
};

/**
 * Role API client - All endpoints require authentication
 */
export const RoleApi = {
  getAvailableActions: async (): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.get('/roles/actions');
    } catch (error) {
      console.error('Error getting available actions:', error);
      throw error;
    }
  },

  getHierarchy: async (): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.get('/roles/hierarchy');
    } catch (error) {
      console.error('Error getting role hierarchy:', error);
      throw error;
    }
  },
};

/**
 * Notification API client - All endpoints require authentication
 */
export const NotificationApi = {
  getAll: async (params: NotificationQueryParams = {}): Promise<ApiResponse<any>> => {
    try {
      // Endpoint removed. Return stubbed notifications list.
      const pageSize = (params as any)?.pageSize ?? 20;
      const notifications = Array.from({ length: Math.min(5, Number(pageSize) || 5) }).map((_, i) => ({
        id: `local-${i + 1}`,
        type: 'INFO',
        title: 'No server notifications',
        message: 'Notifications API disabled; showing local placeholder.',
        isRead: i > 0,
        createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
      }));
      return { statusCode: 200, success: true, body: { notifications } } as any;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },
  
  markAsRead: async (notificationId: string): Promise<ApiResponse<any>> => {
    try {
      // No-op locally, reflect success
      return { statusCode: 200, success: true, body: { id: notificationId } } as any;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    try {
      // No-op locally
      return { statusCode: 200, success: true } as any;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
};

/**
 * Dashboard API client - All endpoints require authentication
 */
export const DashboardApi = {
  getSummary: async (): Promise<ApiResponse<any>> => {
    try {
      // Endpoint removed. Return stubbed summary to keep UI functional.
      return {
        statusCode: 200,
        success: true,
        body: {
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          returnedApplications: 0,
          verifiedApplications: 0,
          unreadNotifications: 0,
          applicationTrends: { dates: [], pending: [], approved: [], rejected: [] },
          processingTimes: { licenseTypes: [], averageDays: [] },
          recentActivities: [],
          userStats: { totalProcessed: 0, approvalRate: 0, averageProcessTime: '0d' },
        },
      } as any;
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      throw error;
    }
  }
};
