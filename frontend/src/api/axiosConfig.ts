import axios from 'axios';
import jsCookie from 'js-cookie';
  
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json' ,
  },
});


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
    const response = await axiosInstance.get(url, { params });
    return response.data;
  } catch (error) {
    const err: any = error;
    const message = err?.response?.data?.message || err?.message || 'Could not get data';
    throw new Error(message);
  }
};

// POST request function
export const postData = async (url: string, data: any, options = {}) => {
  try {
    const response = await axiosInstance.post(url, data, options);
    return response.data;
  } catch (error) {
    const err: any = error;
    const message = err?.response?.data?.message || err?.message || 'Could not post data';
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
    const message = err?.response?.data?.message || err?.message || 'Could not update data';
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
    const message = err?.response?.data?.message || err?.message || 'Could not delete data';
    throw new Error(message);
  }
};

export default axiosInstance;
