/**
 * Enhanced API Client with automatic authentication
 * Reads token from cookies and handles authentication automatically
 */

import { getCookie } from 'cookies-next';

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
    const authCookie = getCookie('auth');
    if (!authCookie) return null;
    
    const authData: AuthData = JSON.parse(authCookie as string);
    return authData.token || null;
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated(): boolean {
  try {
    const authCookie = getCookie('auth');
    if (!authCookie) return false;
    
    const authData: AuthData = JSON.parse(authCookie as string);
    return authData.isAuthenticated && !!authData.token;
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
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  // Check if this is a public endpoint (login, register, reset password, etc.)
  const isPublicEndpoint = url.includes('/api/auth/login') || 
                          url.includes('/api/auth/register') || 
                          url.includes('/api/auth/reset-password') ||
                          url.includes('/api/auth/refresh-token');
  
  // auth/me is special - it requires a token but shouldn't redirect if no token (used for auth checks)
  const isAuthMeEndpoint = url.includes('/api/auth/me');
  
  if (!isPublicEndpoint && !isAuthMeEndpoint && !token) {
    console.warn('No authentication token found, redirecting to login');
    redirectToLogin();
    throw new Error('Authentication required');
  }
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add existing headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  // Add authorization header for endpoints that require authentication
  // auth/me also needs the token, but doesn't redirect if token is missing
  if ((!isPublicEndpoint || isAuthMeEndpoint) && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized responses
  // For auth/me, don't redirect on 401 (it's used to check auth status)
  if (response.status === 401 && !isPublicEndpoint && !isAuthMeEndpoint) {
    console.warn('Authentication failed (401), redirecting to login');
    redirectToLogin();
    throw new Error('Authentication failed');
  }
  return response;
}

/**
 * Enhanced API client with automatic authentication
 */
export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * GET request with authentication
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
    });
    
    return response.json();
  }
  
  /**
   * POST request with authentication
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await authenticatedFetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return response.json();
  }
  
  /**
   * PUT request with authentication
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await authenticatedFetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return response.json();
  }
  
  /**
   * DELETE request with authentication
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await authenticatedFetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    
    return response.json();
  }
  
  /**
   * File upload with authentication
   */
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = getAuthToken();
    
    if (!token) {
      redirectToLogin();
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });
    
    if (response.status === 401) {
      redirectToLogin();
      throw new Error('Authentication failed');
    }
    
    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export utility functions
export { getAuthToken, isAuthenticated, redirectToLogin };
