/**
 * ALMS API Client
 * This file contains utility functions to interact with the APIs
 */

import { apiClient } from './authenticatedApiClient';
// Import the underlying axios instance so we can make public (no-token) calls
// without triggering the authenticated client's ensureAuthHeader() guard.
import axiosInstance, { setAuthToken } from '../api/axiosConfig';
import {
  AUTH_APIS,
  NOTIFICATION_APIS,
  LoginParams,
  ApplicationQueryParams,
  CreateApplicationParams,
  UpdateStatusParams,
  ForwardApplicationParams,
  NotificationQueryParams,
  BatchProcessParams,
  ApiResponse,
  getHeaders,
} from './APIsEndpoints';
import { parse } from 'cookie';

/**
 * Authentication API client - These endpoints don't require authorization headers
 */
export const AuthApi = {
  login: async (params: LoginParams): Promise<ApiResponse<any>> => {
    const url = AUTH_APIS.LOGIN;
    const headers = getHeaders();
    try {
      // IMPORTANT: Do NOT use apiClient.post here because it enforces an auth token
      // via ensureAuthHeader(). During login we have no token yet, so using apiClient
      // causes an immediate redirect back to /login and the real network call never happens.
      // We call the raw axios instance directly so a 401 (invalid credentials) can be surfaced
      // normally to the thunk instead of forcing a navigation.
      // Convert HeadersInit to a plain object acceptable by axios (in case getHeaders returns a Headers instance)
      const axiosHeaders: Record<string, string> = Array.isArray(headers)
        ? headers.reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {} as Record<string, string>)
        : (headers as Record<string, string>);
      // Try primary login endpoint first
      try {
        const response = await axiosInstance.post(url, params as any, { headers: axiosHeaders });
        const data = response.data;
        return data as any;
      } catch (primaryErr: any) {
        // If server responded with 404 or 405 try the alternate `/api` prefixed path
        const status = primaryErr?.response?.status;
        // Dev-time debug
        if (status === 404 || status === 405) {
          // Construct alternate URL toggling `/api` segment
          let alternate = url;
          if (url.includes('/api/')) {
            alternate = url.replace('/api/', '/');
          } else {
            // insert /api before auth
            alternate = url.replace('/auth/', '/api/auth/');
          }
          const resp2 = await axiosInstance.post(alternate, params as any, { headers: axiosHeaders });
          return resp2.data as any;
        }
        throw primaryErr;
      }
    } catch (error: any) {
      // Extract and re-throw with proper error message from response
      if (error?.response?.data) {
        const errorData = error.response.data;
        // Create a new error with the message from the API response
        const errorMessage = errorData.message || errorData.error || error.message || 'Login failed';
        const enrichedError = new Error(errorMessage);
        // Preserve the original response for additional context
        (enrichedError as any).response = error.response;
        throw enrichedError;
      }
      throw error;
    }
  },

  getCaptcha: async (): Promise<{ success: boolean; data: { captchaId: string; svg: string } }> => {
    const url = AUTH_APIS.CAPTCHA;
    const headers = getHeaders();
    const axiosHeaders: Record<string, string> = Array.isArray(headers)
      ? headers.reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {} as Record<string, string>)
      : (headers as Record<string, string>);
    try {
      const response = await axiosInstance.get(url, { headers: axiosHeaders });
      return response.data;
    } catch (primaryErr: any) {
      const status = primaryErr?.response?.status;
      if (status === 404 || status === 405) {
        let alternate = url;
        if (url.includes('/api/')) {
          alternate = url.replace('/api/', '/');
        } else {
          alternate = url.replace('/auth/', '/api/auth/');
        }
        const resp2 = await axiosInstance.get(alternate, { headers: axiosHeaders });
        return resp2.data;
      }
      throw primaryErr;
    }
  },

  // Note: getCurrentUser is the only auth endpoint that requires authorization (for getting current user info)
  getCurrentUser: async (token: string): Promise<ApiResponse<any>> => {
    // If a token was passed (e.g. immediately after login), ensure axios has it set
    if (token) {
      try {
        setAuthToken(token);
      } catch {
        // ignore
      }
    }
    return await apiClient.get('/auth/me');
  },

  // New: call /auth/getMe which returns a trimmed user object and accepts a token
  getMe: async (token?: string): Promise<ApiResponse<any>> => {
    // If a token is provided (as during login), set it on the axios instance so apiClient.get works
    if (token) {
      try {
        setAuthToken(token);
      } catch {
        // ignore
      }
    }
    return await apiClient.get('/auth/getMe');
  },

  // All other auth endpoints use the authenticated client
  logout: async (): Promise<ApiResponse<any>> => {
    // Call POST /auth/logout on the backend (best-effort) to invalidate the server session.
    // Then call the Next.js API route so httpOnly cookies are cleared server-side.
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Non-fatal — backend may not expose this endpoint yet
    }
    try {
      // Clear httpOnly cookies via Next.js server action
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Non-fatal
    }
    return { statusCode: 200, success: true, body: { message: 'Logged out' } } as any;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
    return await apiClient.post('/auth/change-password', { currentPassword, newPassword });
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
    // Read role from cookies. `parse` is the cookie parser; use it on document.cookie.
    // Note: document may be undefined during SSR — guard for that.
    let role: string | undefined;
    try {
      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = parse(document.cookie || '');
        role = cookies.role || cookies.Roles || cookies.role_code; // try a few common keys
      }
    } catch {
      // ignore cookie parse errors
      role = undefined;
    }

    // If the user is a ZS, the backend expects a special param; add it to params.
    const requestParams = { ...params } as Record<string, any>;
    if (role === 'ZS' || role === 'zs') {
      // attach a flag so backend can filter appropriately. Use 'role' param to be explicit.
      requestParams.isOwned = 'true';
    }
    // debug: log outgoing params for troubleshooting
    return await apiClient.get('/application-form', requestParams as any);
  },

  getById: async (id: number): Promise<ApiResponse<Application>> => {
    return await apiClient.get(`/application-form/?applicationId=${id}`);
  },

  create: async (params: CreateApplicationParams): Promise<ApiResponse<Application>> => {
    return await apiClient.post('/application-form', params);
  },

  updateStatus: async (id: string, params: UpdateStatusParams): Promise<ApiResponse<any>> => {
    return await apiClient.put(`/applications/${id}/status`, params);
  },

  forward: async (id: string, params: ForwardApplicationParams): Promise<ApiResponse<any>> => {
    return await apiClient.post(`/applications/${id}/forward`, params);
  },

  batchProcess: async (params: BatchProcessParams): Promise<ApiResponse<any>> => {
    return await apiClient.post('/applications/batch', params);
  },
  // New: fetch applications using the application-form endpoint filtered by status ids.
  // Expects statusIds as array of string|number; optional query params like page/limit can be provided.
  getByStatuses: async (statusIds: Array<string | number>, params: Record<string, any> = {}): Promise<ApiResponse<any>> => {
    const ids = (statusIds || []).map(String).join(',');
    const query = { ...params, statusIds: ids };
    // apiClient.get accepts params object; pass constructed query
    return await apiClient.get(`/application-form`, query as any);
  },

  deleteApplication: async (id: string | number): Promise<ApiResponse<any>> => {
    return await apiClient.delete(`/application-form/application/${id}`);
  },
};

/**
 * Renewal API client - All endpoints require authentication
 */
export const RenewalApi = {
  deleteRenewal: async (renewalId: string | number): Promise<ApiResponse<any>> => {
    return await apiClient.delete(`/renewal-forms/application/${renewalId}`);
  },
};

/**
 * Notification API client - All endpoints require authentication
 */
export const NotificationApi = {
  /** Signed-in user's notifications, newest first: { notifications, unreadCount, pagination }. */
  getAll: async (params: NotificationQueryParams = {}): Promise<ApiResponse<any>> => {
    const query: Record<string, any> = {};
    if (params.page) query.page = params.page;
    if (params.pageSize) query.pageSize = params.pageSize;
    if (params.read !== undefined) query.read = String(params.read);
    return apiClient.get(NOTIFICATION_APIS.LIST, query);
  },

  getUnreadCount: async (): Promise<ApiResponse<any>> => apiClient.get(NOTIFICATION_APIS.UNREAD_COUNT),

  markAsRead: async (notificationId: string): Promise<ApiResponse<any>> =>
    apiClient.put(NOTIFICATION_APIS.MARK_READ(notificationId), {}),

  markAllAsRead: async (): Promise<ApiResponse<any>> => apiClient.put(NOTIFICATION_APIS.MARK_ALL_READ, {}),
};



/**
 * Public API client - No authentication required
 * Used for QR code scanned application details
 */
export const PublicApi = {
  /**
   * Get public application details (no auth required)
   * Used when scanning QR code
   */
  getApplicationDetails: async (applicationId: string | number, type?: string): Promise<ApiResponse<any>> => {
    // Use raw axios instance to bypass auth header requirement
    const url = type ? `/public/application/${applicationId}?type=${type}` : `/public/application/${applicationId}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },
};

/**
 * Dashboard API client - All endpoints require authentication
 */
export const DashboardApi = {
  getSummary: async (): Promise<ApiResponse<any>> => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let returned = 0;

    // 1. Fetch states
    try {
      const statesRes = await apiClient.get<any>('/admin/analytics/states');
      if (statesRes && statesRes.success && Array.isArray(statesRes.data)) {
        statesRes.data.forEach((s: any) => {
          const stateLower = String(s.state).toLowerCase();
          if (stateLower === 'pending') pending = s.count || 0;
          if (stateLower === 'approved') approved = s.count || 0;
          if (stateLower === 'rejected') rejected = s.count || 0;
          if (stateLower === 'returned') returned = s.count || 0;
        });
      }
    } catch (err) {
       
      console.error('[DashboardApi] Failed to fetch states:', err);
    }

    // 2. Fetch trends
    const trendDates: string[] = [];
    const trendCounts: number[] = [];
    try {
      const trendRes = await apiClient.get<any>('/admin/analytics/applications');
      if (trendRes && trendRes.success && Array.isArray(trendRes.data)) {
        trendRes.data.forEach((t: any) => {
          trendDates.push(t.week || t.date || '');
          trendCounts.push(t.count || 0);
        });
      }
    } catch (err) {
       
      console.error('[DashboardApi] Failed to fetch trends:', err);
    }

    // 3. Fetch activities
    let recentActivities: any[] = [];
    try {
      const activitiesRes = await apiClient.get<any>('/admin/analytics/admin-activities');
      if (activitiesRes && activitiesRes.success && Array.isArray(activitiesRes.data)) {
        recentActivities = activitiesRes.data.slice(0, 10).map((act: any) => ({
          action: act.action || 'APPLICATION_UPDATED',
          applicationId: act.almsLicenseId || `APP-${act.id || 'Unknown'}`,
          timestamp: act.timestamp ? new Date(act.timestamp).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (err) {
       
      console.error('[DashboardApi] Failed to fetch activities:', err);
    }

    return {
      statusCode: 200,
      success: true,
      body: {
        pendingApplications: pending,
        approvedApplications: approved,
        rejectedApplications: rejected,
        returnedApplications: returned,
        verifiedApplications: 0,
        unreadNotifications: 0,
        applicationTrends: {
          dates: trendDates,
          pending: trendCounts,
          approved: trendCounts.map(() => 0),
          rejected: trendCounts.map(() => 0),
        },
        processingTimes: {
          licenseTypes: ['Fresh', 'Renewal'],
          averageDays: [7, 5],
        },
        recentActivities,
        userStats: {
          totalProcessed: approved + rejected + returned,
          approvalRate: (approved + rejected) > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0,
          averageProcessTime: '6.2d',
        },
      },
    } as any;
  }
};
