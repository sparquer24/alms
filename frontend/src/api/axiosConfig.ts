import axios from 'axios';
import jsCookie from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to extract error message from nested error structure
const extractErrorMessage = (error: any): string => {
  // Try to extract from nested structure: details.response.error or details.response.message
  if (error?.response?.data?.details?.response?.error) {
    return error.response.data.details.response.error;
  }
  if (error?.response?.data?.details?.response?.message) {
    return error.response.data.details.response.message;
  }
  // Try standard error paths
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};


// Enhanced function to extract token from cookies with multiple fallback strategies
const getTokenFromCookie = (): string | null => {
  try {
    const authCookie = jsCookie.get('auth');
    if (!authCookie) return null;

    // Try to parse as JSON first (in case it's a complex object)
    try {
      const parsed = JSON.parse(authCookie);
      return parsed.token || parsed.accessToken || parsed.authToken || authCookie;
    } catch (e) {
      // If parsing fails, treat as raw token string
      return authCookie;
    }
  } catch (e) {
    console.warn('Failed to read auth cookie:', e);
    return null;
  }
};

// Function to update Authorization header
export const setAuthToken = (token: any) => {
  // Accept either a raw token string or an object that contains a token property
  let raw: any = token;
  try {
    if (token && typeof token === 'object') {
      raw = token.token ?? token.accessToken ?? token.authToken ?? token;
    }
  } catch (e) {
    raw = token;
  }

  if (raw) {
    axiosInstance.defaults.headers['Authorization'] = `Bearer ${raw}`;
    console.log('🔑 Authorization header set successfully');
  } else {
    // Remove header when no token provided
    delete axiosInstance.defaults.headers['Authorization'];
    console.log('🔑 Authorization header removed');
  }
};

// Helper function to ensure token is attached before making any request
const ensureAuthToken = () => {
  if (!axiosInstance.defaults.headers['Authorization']) {
    const token = getTokenFromCookie();
    if (token) {
      setAuthToken(token);
      console.log('🔑 Token automatically retrieved from cookie');
    } else {
      console.warn('⚠️ No authentication token found in cookies');
    }
  }
};

// Initialize axios instance Authorization header from cookie (if present)
try {
  const token = getTokenFromCookie();
  if (token) {
    setAuthToken(token);
    console.log('🔑 Initial token loaded from cookie on module import');
  }
} catch (e) {
  console.warn('Failed to initialize token from cookie:', e);
}

// Request interceptor to ensure token is always attached
axiosInstance.interceptors.request.use(
  (config) => {
    // Double-check that auth header is present before each request
    if (!config.headers['Authorization']) {
      const token = getTokenFromCookie();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Token injected via interceptor for:', config.url);
      }
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      console.error('🔒 Authentication failed - redirecting to login');
      try {
        jsCookie.remove('auth');
        jsCookie.remove('user');
        jsCookie.remove('role');
      } catch (e) {
        // ignore cookie cleanup errors
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// GET request function
export const fetchData = async (url: string, params = {}) => {
  try {
    // Ensure Authorization header exists
    ensureAuthToken();
    
    console.log('🌐 Making GET request to:', url, 'with params:', params);
    const response = await axiosInstance.get(url, { params });
    console.log('✅ GET response received:', response.status);
    return response.data;
  } catch (error) {
    const err: any = error;
    console.error('❌ GET ERROR:', err);
    console.error('❌ GET ERROR Response:', err?.response?.data);

    const message = extractErrorMessage(err) || 'Could not get data';
    // If unauthorized, redirect to login in client contexts to re-authenticate
    const status = err?.response?.status || err?.status;
    const isAuthError = status === 401 || /authoriz/i.test(String(message || ''));
    if (isAuthError && typeof window !== 'undefined') {
      try {
        // Clear potential invalid auth cookie and redirect
        jsCookie.remove('auth');
      } catch (e) {
        // ignore
      }
      window.location.href = '/login';
      // throw a specific error to stop execution; caller may catch it
      throw new Error('Authentication required');
    }
    throw new Error(message);
  }
};

// POST request function
export const postData = async (url: string, data: any, options = {}) => {
  try {
    // Ensure Authorization header exists
    ensureAuthToken();
    
    console.log('🌐 Making POST request to:', url, 'with data:', data);
    const response = await axiosInstance.post(url, data, options);
    console.log('✅ POST response received:', response.status);
    return response.data;
  } catch (error) {
    const err: any = error;
    console.error('❌ POST ERROR:', err);
    console.error('❌ POST ERROR Response:', err?.response?.data);

    const message = extractErrorMessage(err) || 'Could not post data';
    const status = err?.response?.status || err?.status;
    const isAuthError = status === 401 || /authoriz/i.test(String(message || ''));
    if (isAuthError && typeof window !== 'undefined') {
      try { jsCookie.remove('auth'); } catch (e) { }
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(message);
  }
};

// PUT request function
export const putData = async (url: string, data: any, options = {}) => {
  try {
    // Ensure Authorization header exists
    ensureAuthToken();
    
    console.log('🌐 Making PUT request to:', url, 'with data:', data);
    const response = await axiosInstance.put(url, data, options);
    console.log('✅ PUT response received:', response.status);
    return response.data;
  } catch (error) {
    const err: any = error;
    console.error('❌ PUT ERROR:', err);
    console.error('❌ PUT ERROR Response:', err?.response?.data);

    const message = extractErrorMessage(err) || 'Could not update data';
    const status = err?.response?.status || err?.status;
    const isAuthError = status === 401 || /authoriz/i.test(String(message || ''));
    if (isAuthError && typeof window !== 'undefined') {
      try { jsCookie.remove('auth'); } catch (e) { }
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(message);
  }
};

// PATCH request function
export const patchData = async (url: string, data: any, options = {}) => {
  try {
    // Ensure Authorization header exists
    ensureAuthToken();
    
    console.log('🔥 PATCH REQUEST - URL:', url);
    console.log('🔥 PATCH REQUEST - Data:', data);
    console.log('🔥 PATCH REQUEST - Full URL:', process.env.NEXT_PUBLIC_API_URL + url);
    console.log('🔑 PATCH REQUEST - Auth Header:', axiosInstance.defaults.headers['Authorization'] ? 'Present' : 'Missing');

    const response = await axiosInstance.patch(url, data, options);
    console.log('✅ PATCH RESPONSE:', response.status, response.data);
    return response.data;
  } catch (error) {
    const err: any = error;
    console.error('❌ PATCH ERROR:', err);
    console.error('❌ PATCH ERROR Status:', err?.response?.status);
    console.error('❌ PATCH ERROR Response:', err?.response?.data);

    const message = extractErrorMessage(err) || 'Could not update data';
    const status = err?.response?.status || err?.status;
    const isAuthError = status === 401 || /authoriz/i.test(String(message || ''));
    if (isAuthError && typeof window !== 'undefined') {
      try { jsCookie.remove('auth'); } catch (e) { }
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(message);
  }
};

// DELETE request function
export const deleteData = async (url: string, options = {}) => {
  try {
    // Ensure Authorization header exists
    ensureAuthToken();
    
    console.log('🌐 Making DELETE request to:', url);
    const response = await axiosInstance.delete(url, options);
    console.log('✅ DELETE response received:', response.status);
    return response.data;
  } catch (error) {
    const err: any = error;
    console.error('❌ DELETE ERROR:', err);
    console.error('❌ DELETE ERROR Response:', err?.response?.data);

    const message = extractErrorMessage(err) || 'Could not delete data';
    const status = err?.response?.status || err?.status;
    const isAuthError = status === 401 || /authoriz/i.test(String(message || ''));
    if (isAuthError && typeof window !== 'undefined') {
      try { jsCookie.remove('auth'); } catch (e) { }
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(message);
  }
};

// Debug function to check current token status
export const debugTokenStatus = () => {
  const cookieToken = getTokenFromCookie();
  const axiosToken = axiosInstance.defaults.headers['Authorization'];
  
  console.log('🔍 TOKEN DEBUG STATUS:');
  console.log('  📁 Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'Not found');
  console.log('  🔧 Axios header:', axiosToken ? 'Present' : 'Missing');
  console.log('  🌐 Base URL:', process.env.NEXT_PUBLIC_API_URL);
  
  return {
    cookieToken: !!cookieToken,
    axiosHeader: !!axiosToken,
    baseUrl: process.env.NEXT_PUBLIC_API_URL
  };
};

export default axiosInstance;
