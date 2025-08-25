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
    throw new Error('Could not get data');
  }
};

// POST request function
export const postData = async (url: string, data: any, options = {}) => {
  try {
    const response = await axiosInstance.post(url, data, options);
    return response.data;
  } catch (error) {
    console.log({error});
    throw new Error('Could not post data');
  }
};

// PUT request function
export const putData = async (url: string, data: any, options = {}) => {
  try {
    const response = await axiosInstance.put(url, data, options);
    return response.data;
  } catch (error) {
    throw new Error('Could not update data');
  }
};

// DELETE request function
export const deleteData = async (url: string, options = {}) => {
  try {
    const response = await axiosInstance.delete(url, options);
    return response.data;
  } catch (error) {
    throw new Error('Could not delete data');
  }
};

export default axiosInstance;
