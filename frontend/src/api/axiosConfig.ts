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


// Function to update Authorization header
export const setAuthToken = (token: any) => {
  // Accept either a raw token string or an object that contains a token property
  let raw: any = token;
  try {
    if (token && typeof token === 'object') {
      raw = token.token ?? token.accessToken ?? token;
    }
  } catch (e) {
    raw = token;
  }

  if (raw) {
    axiosInstance.defaults.headers['Authorization'] = `Bearer ${raw}`;
  } else {
    // Remove header when no token provided
    delete axiosInstance.defaults.headers['Authorization'];
  }
};

// Initialize axios instance Authorization header from cookie (if present)
try {
  const existing = jsCookie.get('auth');
  if (existing) {
    setAuthToken(existing);
  }
} catch (e) {
  // ignore cookie read errors
}


// GET request function
export const fetchData = async (url: string, params = {}) => {
  try {
    // Ensure Authorization header exists (support code paths that call fetchData directly)
    try {
      if (!axiosInstance.defaults.headers['Authorization']) {
        const existing = jsCookie.get('auth');
        if (existing) {
          setAuthToken(existing);
        }
      }
    } catch (e) {
      // ignore cookie read errors
    }
    const response = await axiosInstance.get(url, { params });
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
    // Ensure Authorization header exists (support code paths that call postData directly)
    try {
      if (!axiosInstance.defaults.headers['Authorization']) {
        const existing = jsCookie.get('auth');
        if (existing) {
          setAuthToken(existing);
        }
      }
    } catch (e) {
      // ignore cookie read errors
    }
    const response = await axiosInstance.post(url, data, options);
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
    const response = await axiosInstance.put(url, data, options);
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
    // Ensure Authorization header exists (support code paths that call patchData directly)
    console.log('🔥 PATCH REQUEST - URL:', url);
    console.log('🔥 PATCH REQUEST - Data:', data);
    console.log('🔥 PATCH REQUEST - Full URL:', process.env.NEXT_PUBLIC_API_URL + url);

    try {
      if (!axiosInstance.defaults.headers['Authorization']) {
        const existing = jsCookie.get('auth');
        if (existing) {
          setAuthToken(existing);
        }
      }
    } catch (e) {
      // ignore cookie read errors
    }

    const response = await axiosInstance.patch(url, data, options);
    console.log('✅ PATCH RESPONSE:', response.data);
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
    const response = await axiosInstance.delete(url, options);
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

export default axiosInstance;
