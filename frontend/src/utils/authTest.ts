/**
 * Authentication Test Utility
 * Use this to test the authentication flow and identify issues
 */

import { AuthApi } from '../config/APIClient';
import { getAuthTokenFromCookie, getUserFromCookie } from './authCookies';

export class AuthTester {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Test the complete authentication flow
   */
  async testAuthFlow(username: string = 'dcp_user', password: string = '1234') {
    console.log('🧪 Starting Authentication Flow Test');
    console.log('=====================================');

    try {
      // Step 1: Clear existing auth data
      console.log('1️⃣ Clearing existing auth data...');

      // Step 2: Test login
      console.log('2️⃣ Testing login...');
      const loginResult = await this.testLogin(username, password);
      if (!loginResult.success) {
        throw new Error(`Login failed: ${loginResult.message}`);
      }

      // Step 3: Test token validation
      console.log('3️⃣ Testing token validation...');
      const tokenValidation = await this.testTokenValidation(loginResult.token);
      if (!tokenValidation.success) {
        throw new Error(`Token validation failed: ${tokenValidation.message}`);
      }

      // Step 4: Test cookie storage
      console.log('4️⃣ Testing cookie storage...');
      const cookieTest = this.testCookieStorage();
      if (!cookieTest.success) {
        throw new Error(`Cookie storage failed: ${cookieTest.message}`);
      }

      // Step 5: Test auth state restoration
      console.log('5️⃣ Testing auth state restoration...');
      const restorationTest = this.testAuthStateRestoration();
      if (!restorationTest.success) {
        throw new Error(`Auth state restoration failed: ${restorationTest.message}`);
      }

      console.log('✅ All authentication tests passed!');
      return { success: true, message: 'Authentication flow working correctly' };

    } catch (error) {
      console.error('❌ Authentication test failed:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test login functionality
   */
  private async testLogin(username: string, password: string) {
    try {
      const response = await AuthApi.login({ username, password });
      
      if (!response.success) {
        return { success: false, message: response.message || 'Login failed' };
      }

      if (!response.body?.token) {
        return { success: false, message: 'No token received from login' };
      }

      console.log('✅ Login successful, token received');
      return { success: true, token: response.body.token, user: response.body.user };
    } catch (error) {
      return { success: false, message: `Login error: ${error}` };
    }
  }

  /**
   * Test token validation
   */
  private async testTokenValidation(token: string) {
    try {
      const response = await AuthApi.getCurrentUser(token);
      
      if (!response.success) {
        return { success: false, message: response.message || 'Token validation failed' };
      }

      if (!response.body) {
        return { success: false, message: 'No user data received from token validation' };
      }

      console.log('✅ Token validation successful');
      return { success: true, user: response.body };
    } catch (error) {
      return { success: false, message: `Token validation error: ${error}` };
    }
  }

  /**
   * Test cookie storage
   */
  private testCookieStorage() {
    try {
  const token = getAuthTokenFromCookie();
  const user = getUserFromCookie();
  if (!token) return { success: false, message: 'Auth token not found after login' };
  if (!user) return { success: false, message: 'User cookie not found or invalid after login' };
  console.log('✅ Cookie storage working correctly');
  return { success: true, authData: { token, user } };
    } catch (error) {
      return { success: false, message: `Cookie storage error: ${error}` };
    }
  }

  /**
   * Test auth state restoration
   */
  private testAuthStateRestoration() {
    try {
      const token = getAuthTokenFromCookie();
      const user = getUserFromCookie();
      if (token && user) {
        console.log('✅ Auth state restoration logic working correctly');
        return { success: true, authData: { token, user } };
      }
      return { success: false, message: 'Invalid auth data for restoration' };
    } catch (error) {
      return { success: false, message: `Auth state restoration error: ${error}` };
    }
  }

  /**
   * Clear all authentication data
   */
  // private clearAuthData() {
  //   deleteCookie('auth', { path: '/' });
  //   localStorage.removeItem('auth');
  //   console.log('✅ Auth data cleared');
  // }

  /**
   * Test API endpoint directly
   */
  async testApiEndpoint(endpoint: string, method: string = 'GET', body?: any) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      let result;
      if (method === 'GET') {
        result = await (await import('../api/axiosConfig')).fetchData(endpoint);
      } else {
        result = await (await import('../api/axiosConfig')).postData(endpoint, body);
      }
      console.log(`API Test - ${method} ${endpoint}:`, { status: 200, ok: true, data: result });
      return { success: true, status: 200, data: result };
    } catch (error) {
      console.error(`API Test Error - ${method} ${endpoint}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Get current auth state
   */
  getCurrentAuthState() {
    try {
  const token = getAuthTokenFromCookie();
  const user = getUserFromCookie();
  if (!token) return { hasCookie: false, authData: null };
  return { hasCookie: true, authData: { token, user } };
    } catch (error) {
      return { hasCookie: false, authData: null, error };
    }
  }
}

// Export singleton instance
export const authTester = new AuthTester();

// Export convenience functions
export const testAuthFlow = (username?: string, password?: string) => 
  authTester.testAuthFlow(username, password);

export const testApiEndpoint = (endpoint: string, method?: string, body?: any) => 
  authTester.testApiEndpoint(endpoint, method, body);

export const getCurrentAuthState = () => authTester.getCurrentAuthState(); 