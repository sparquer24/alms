/**
 * ALMS API Client
 * This file contains utility functions to interact with the APIs
 */

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
 * Authentication API client
 */
export const AuthApi = {
  login: async (params: LoginParams): Promise<ApiResponse<any>> => {
    const response = await fetch(AUTH_APIS.LOGIN, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    return response.json();
  },

  logout: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(AUTH_APIS.LOGOUT, {
      method: 'POST',
      headers: getHeaders(token),
    });
    return response.json();
  },

  getCurrentUser: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(AUTH_APIS.GET_CURRENT_USER, {
      headers: getHeaders(token),
    });
    return response.json();
  },
  
  changePassword: async (token: string, currentPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
    const response = await fetch(AUTH_APIS.CHANGE_PASSWORD, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.json();
  },
  
  resetPassword: async (email: string): Promise<ApiResponse<any>> => {
    const response = await fetch(AUTH_APIS.RESET_PASSWORD, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return response.json();
  },
  
  refreshToken: async (refreshToken: string): Promise<ApiResponse<any>> => {
    const response = await fetch(AUTH_APIS.REFRESH_TOKEN, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ refreshToken }),
    });
    return response.json();
  },
};

/**
 * Application API client
 */
export const ApplicationApi = {
  getAll: async (token: string, params: ApplicationQueryParams = {}): Promise<ApiResponse<any>> => {
    const url = appendQueryParams(APPLICATION_APIS.GET_ALL, params);
    const response = await fetch(url, {
      headers: getHeaders(token),
    });
    return response.json();
  },

  getById: async (token: string, id: string): Promise<ApiResponse<any>> => {
    const response = await fetch(APPLICATION_APIS.GET_BY_ID(id), {
      headers: getHeaders(token),
    });
    return response.json();
  },

  create: async (token: string, params: CreateApplicationParams): Promise<ApiResponse<any>> => {
    const response = await fetch(APPLICATION_APIS.CREATE, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(params),
    });
    return response.json();
  },

  updateStatus: async (token: string, id: string, params: UpdateStatusParams): Promise<ApiResponse<any>> => {
    const response = await fetch(APPLICATION_APIS.UPDATE_STATUS(id), {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(params),
    });
    return response.json();
  },

  forward: async (token: string, id: string, params: ForwardApplicationParams): Promise<ApiResponse<any>> => {
    const response = await fetch(APPLICATION_APIS.FORWARD(id), {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(params),
    });
    return response.json();
  },

  batchProcess: async (token: string, params: BatchProcessParams): Promise<ApiResponse<any>> => {
    const response = await fetch(APPLICATION_APIS.BATCH_PROCESS, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(params),
    });
    return response.json();
  },
};

/**
 * Document API client
 */
export const DocumentApi = {
  upload: async (token: string, applicationId: string, file: File, documentType: string): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    
    const response = await fetch(DOCUMENT_APIS.UPLOAD(applicationId), {
      method: 'POST',
      headers: getMultipartHeaders(token),
      body: formData,
    });
    return response.json();
  },

  getAll: async (token: string, applicationId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(DOCUMENT_APIS.GET_ALL(applicationId), {
      headers: getHeaders(token),
    });
    return response.json();
  },

  delete: async (token: string, applicationId: string, documentId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(DOCUMENT_APIS.DELETE(applicationId, documentId), {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return response.json();
  },
};

/**
 * Report API client
 */
export const ReportApi = {
  getStatistics: async (token: string, params: ReportQueryParams = {}): Promise<ApiResponse<any>> => {
    const url = appendQueryParams(REPORT_APIS.STATISTICS, params);
    const response = await fetch(url, {
      headers: getHeaders(token),
    });
    return response.json();
  },

  getApplicationsByStatus: async (
    token: string,
    params: ApplicationsByStatusParams
  ): Promise<ApiResponse<any>> => {
    const url = appendQueryParams(REPORT_APIS.APPLICATIONS_BY_STATUS, params);
    const response = await fetch(url, {
      headers: getHeaders(token),
    });
    return response.json();
  },

  generatePdf: async (token: string, applicationId: string): Promise<Blob> => {
    const response = await fetch(REPORT_APIS.GENERATE_PDF(applicationId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.blob();
  },
};

/**
 * User API client
 */
export const UserApi = {
  getByRole: async (token: string, role: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${USER_APIS.GET_BY_ROLE}?role=${role}`, {
      headers: getHeaders(token),
    });
    return response.json();
  },
  
  getPreferences: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(USER_APIS.GET_PREFERENCES, {
      headers: getHeaders(token),
    });
    return response.json();
  },
  
  updatePreferences: async (token: string, preferences: UserPreferencesParams): Promise<ApiResponse<any>> => {
    const response = await fetch(USER_APIS.UPDATE_PREFERENCES, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(preferences),
    });
    return response.json();
  }
};

/**
 * Role API client
 */
export const RoleApi = {
  getAvailableActions: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(ROLE_APIS.GET_AVAILABLE_ACTIONS, {
      headers: getHeaders(token),
    });
    return response.json();
  },

  getHierarchy: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(ROLE_APIS.GET_HIERARCHY, {
      headers: getHeaders(token),
    });
    return response.json();
  },
};

/**
 * Notification API client
 */
export const NotificationApi = {
  getAll: async (token: string, params: NotificationQueryParams = {}): Promise<ApiResponse<any>> => {
    const url = appendQueryParams(NOTIFICATION_APIS.GET_ALL, params);
    const response = await fetch(url, {
      headers: getHeaders(token),
    });
    return response.json();
  },
  
  markAsRead: async (token: string, notificationId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(NOTIFICATION_APIS.MARK_READ(notificationId), {
      method: 'PATCH',
      headers: getHeaders(token),
    });
    return response.json();
  },
  
  markAllAsRead: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(NOTIFICATION_APIS.MARK_ALL_READ, {
      method: 'PATCH',
      headers: getHeaders(token),
    });
    return response.json();
  }
};

/**
 * Dashboard API client
 */
export const DashboardApi = {
  getSummary: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(DASHBOARD_APIS.GET_SUMMARY, {
      headers: getHeaders(token),
    });
    return response.json();
  }
};
