/**
 * Enhanced API Client with automatic authentication
 * Reads token from cookies and handles authentication automatically
 */

import axiosInstance, { setAuthToken, fetchData, postData, putData, deleteData } from '../api/axiosConfig';
import { getAuthTokenFromCookie } from '../utils/authCookies';
import { BASE_URL } from './APIsEndpoints';

// Type for auth data stored in cookies
interface AuthData {
  token: string;
  user: any;
  isAuthenticated: boolean;
  role: string;
  name: string;
}

/**
 * Get authentication token from cookies
 */
function getAuthToken(): string | null {
  try {
    return getAuthTokenFromCookie();
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated(): boolean {
  try {
    const token = getAuthToken();
    return !!token;
  } catch (error) {
    return false;
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin(): void {
  // Clear invalid auth data
  if (typeof document !== 'undefined') {
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth');
  }

  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Enhanced fetch with automatic authentication
 */
// The project uses a centralized axios instance. This client wraps it to provide
// the same semantics as the old authenticatedFetch (auto-token, redirect on 401).

async function ensureAuthHeader() {
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
    return;
  }

  // No token available: if running in browser, redirect to login so user can re-authenticate
  if (typeof window !== 'undefined') {
    redirectToLogin();
    return;
  }

  // In non-browser environments, throw so callers can handle it appropriately
  throw new Error('Missing authentication token');
}

/**
 * Enhanced API client with automatic authentication
 */
export class ApiClient {
  private baseUrl: string;

  // Use explicit BASE_URL fallback so the client targets the backend when
  // NEXT_PUBLIC_API_URL is not provided. Previously the fallback was an empty
  // string which caused endpoints like '/auth/getMe' to be requested against
  // the frontend origin instead of the backend.
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    // Log chosen base URL for runtime debugging (does not include token)
    try {
      // Be mindful: do not print tokens or sensitive headers
      console.info(`[ApiClient] initialized with baseUrl=${this.baseUrl}`);
    } catch (e) {
      // ignore logging errors in non-browser environments
    }
  }

  private buildUrl(endpoint: string) {
    // If endpoint is absolute, use it directly
    if (endpoint.startsWith('http')) return endpoint;

    // Normalize base and endpoint to avoid double slashes or duplicated '/api'
    const base = this.baseUrl.replace(/\/$/, '');

    // If both base and endpoint include the '/api' prefix (e.g. base endsWith '/api' and endpoint startsWith '/api')
    // then strip the leading '/api' from the endpoint so we don't end up with '/api/api/...'
    if (base.endsWith('/api') && endpoint.startsWith('/api')) {
      const fixed = `${base}${endpoint.slice(4)}`; // remove the leading '/api' from endpoint
      try { console.info(`[ApiClient] normalized endpoint from ${endpoint} to ${fixed}`); } catch (e) { }
      return fixed;
    }

    // If endpoint begins with a '/', just concatenate (base already has no trailing slash)
    if (endpoint.startsWith('/')) return `${base}${endpoint}`;

    // Otherwise insert a slash between base and endpoint
    return `${base}/${endpoint}`;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      await ensureAuthHeader();
      const url = this.buildUrl(endpoint);
      try { console.info(`[ApiClient] GET ${url}`, params || {}); } catch (e) { }
      const data = await fetchData(url, params || {});
      return data as T;
    } catch (error: any) {
      // If the error is an authorization issue, redirect to login (client-side only)
      const msg = error?.message || '';
      const isAuthError = msg.toLowerCase().includes('authorization') || msg.toLowerCase().includes('auth') || (error?.status === 401) || (error?.response?.status === 401);
      if (isAuthError && typeof window !== 'undefined') {
        redirectToLogin();
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      await ensureAuthHeader();
      const url = this.buildUrl(endpoint);
      try { console.info(`[ApiClient] POST ${url}`, data); } catch (e) { }
      const res = await postData(url, data);
      return res as T;
    } catch (error: any) {
      const msg = error?.message || '';
      const isAuthError = msg.toLowerCase().includes('authorization') || msg.toLowerCase().includes('auth') || (error?.status === 401) || (error?.response?.status === 401);
      if (isAuthError && typeof window !== 'undefined') {
        redirectToLogin();
      }
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      await ensureAuthHeader();
      const url = this.buildUrl(endpoint);
      try { console.info(`[ApiClient] PUT ${url}`, data); } catch (e) { }
      const res = await putData(url, data);
      return res as T;
    } catch (error: any) {
      const msg = error?.message || '';
      const isAuthError = msg.toLowerCase().includes('authorization') || msg.toLowerCase().includes('auth') || (error?.status === 401) || (error?.response?.status === 401);
      if (isAuthError && typeof window !== 'undefined') {
        redirectToLogin();
      }
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      await ensureAuthHeader();
      const url = this.buildUrl(endpoint);
      try { console.info(`[ApiClient] DELETE ${url}`); } catch (e) { }
      const res = await deleteData(url);
      return res as T;
    } catch (error: any) {
      const msg = error?.message || '';
      const isAuthError = msg.toLowerCase().includes('authorization') || msg.toLowerCase().includes('auth') || (error?.status === 401) || (error?.response?.status === 401);
      if (isAuthError && typeof window !== 'undefined') {
        redirectToLogin();
      }
      throw error;
    }
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      await ensureAuthHeader();
      const url = this.buildUrl(endpoint);
      try { console.info(`[ApiClient] UPLOAD ${url}`, { size: formData?.getAll ? formData.getAll('file')?.length : undefined }); } catch (e) { }
      // use axiosInstance directly for multipart
      const response = await axiosInstance.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as T;
    } catch (error: any) {
      const msg = error?.message || '';
      const isAuthError = msg.toLowerCase().includes('authorization') || msg.toLowerCase().includes('auth') || (error?.status === 401) || (error?.response?.status === 401);
      if (isAuthError && typeof window !== 'undefined') {
        redirectToLogin();
      }
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || BASE_URL);

// Export utility functions
export { getAuthToken, isAuthenticated, redirectToLogin };
