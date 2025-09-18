/**
 * Enhanced API Client with automatic authentication
 * Reads token from cookies and handles authentication automatically
 */

import axiosInstance, { setAuthToken, fetchData, postData, putData, deleteData } from '../api/axiosConfig';
import { getAuthTokenFromCookie } from '../utils/authCookies';

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
    console.error('Error getting auth token from cookie:', error);
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
  document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  localStorage.removeItem('auth');
  
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
    console.warn('No auth token found - redirecting to login');
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

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private buildUrl(endpoint: string) {
    if (!endpoint.startsWith('http')) return `${this.baseUrl}${endpoint}`;
    return endpoint;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      await ensureAuthHeader();
      const url = this.buildUrl(endpoint);
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
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '');

// Export utility functions
export { getAuthToken, isAuthenticated, redirectToLogin };
