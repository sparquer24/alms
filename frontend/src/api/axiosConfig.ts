import axios from 'axios';
import jsCookie from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: 'https://alms-api-dev.sparquer.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json' 
  },
});


// Function to update Authorization header
export const setAuthToken = (token: any) => {
  if (token) {
    axiosInstance.defaults.headers['Authorization'] = `${token}`;
  }
  else {
    delete axiosInstance.defaults.headers['Authorization']; // Remove token if not provided
  }
};


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
