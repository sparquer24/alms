import { createAsyncThunk } from '@reduxjs/toolkit';
import { AuthApi } from '../../config/APIClient';
import { setCredentials, setLoading, setError, logout } from '../slices/authSlice';

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await AuthApi.login({ username, password });
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        dispatch(setCredentials({ user, token }));
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Login failed'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (token: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await AuthApi.getCurrentUser(token);
      
      if (response.success && response.data) {
        const { user } = response.data;
        dispatch(setCredentials({ user, token }));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get current user');
      }
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to get current user'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (token: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      await AuthApi.logout(token);
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      dispatch(logout());
    } finally {
      dispatch(setLoading(false));
    }
  }
); 