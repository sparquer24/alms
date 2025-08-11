import { createAsyncThunk } from '@reduxjs/toolkit';
import { AuthApi } from '../../config/APIClient';
import { setCredentials, setLoading, setError, logout } from '../slices/authSlice';
import { setCookie, getCookie } from 'cookies-next';

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      // Check cookies for auth data
      const cookieAuth = getCookie('auth');
      
      if (cookieAuth) {
        const authData = JSON.parse(cookieAuth as string);
        // If all user info is present in cookie, use it and skip API call
        if (
          authData &&
          authData.token &&
          authData.user &&
          authData.user.role &&
          authData.user.name &&
          authData.user.id
        ) {
          dispatch(setCredentials({ user: authData.user, token: authData.token }));
          return { user: authData.user, token: authData.token };
        }
        // Otherwise, verify the token is still valid
        if (authData && authData.token && authData.isAuthenticated) {
          const userResponse = await AuthApi.getCurrentUser(authData.token);
          if (userResponse.success && userResponse.body) {
            const user = userResponse.body;
            dispatch(setCredentials({ user, token: authData.token }));
            // Update cookies with fresh data
            const freshAuthData = {
              token: authData.token,
              user,
              isAuthenticated: true,
              role: user.role,
              name: user.name
            };
            setCookie('auth', JSON.stringify(freshAuthData), {
              maxAge: 60 * 60 * 24, // 1 day
              path: '/',
            });
            return { user, token: authData.token };
          } else {
            dispatch(logout());
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      dispatch(logout());
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await AuthApi.login({ username, password });
      console.log('Login API response:', response);
      
      // Handle different response structures
      let token: string;
      let user: any = null;
      
      // Check if response has the expected structure
      if (response.body && response.body.token) {
        // Standard response structure
        token = response.body.token;
      } else if (response.token) {
        // Direct token in response
        token = response.token;
      } else {
        console.error('Login response missing token:', response);
        throw new Error('Login succeeded but no token was returned.');
      }
      
      // Try to get user info from the token or make a separate call
      try {
        // First, try to decode the JWT token to get basic user info
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', tokenPayload);
        
        // Create a basic user object from token payload
        user = {
          id: tokenPayload.userId || tokenPayload.sub,
          username: tokenPayload.username,
          role: tokenPayload.role,
          name: tokenPayload.name || tokenPayload.username,
          email: tokenPayload.email || '',
          designation: tokenPayload.designation || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          permissions: [],
          availableActions: []
        };
        
        // Try to fetch additional user info from /api/auth/me
        try {
          const userResponse = await AuthApi.getCurrentUser(token);
          if (userResponse.success && userResponse.body) {
            // Merge the fetched user data with token data
            user = { ...user, ...userResponse.body };
          }
        } catch (meError) {
          console.warn('Failed to fetch user details from /api/auth/me, using token data:', meError);
          // Continue with token data only
        }
      } catch (tokenError) {
        console.error('Failed to decode token:', tokenError);
        throw new Error('Invalid token received from server');
      }
      
      console.log('Final user object:', user);
      dispatch(setCredentials({ user, token }));
      
      // Store token and user info in cookies with the correct structure for middleware
      const authData = {
        token,
        user,
        isAuthenticated: true,
        role: user.role, // Extract role for middleware compatibility
        name: user.name
      };
      setCookie('auth', JSON.stringify(authData), {
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });
      
      return { token, user };
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Login failed'));
      console.error('Login thunk error:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      
      // Get token from cookies
      const authCookie = getCookie('auth');
      let token = null;
      if (authCookie) {
        const authData = JSON.parse(authCookie as string);
        token = authData.token;
      }
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await AuthApi.getCurrentUser(token);
      
      if (response.success && response.body) {
        const user = response.body;
        dispatch(setCredentials({ user, token }));
        return { user, token };
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
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      await AuthApi.logout();
      dispatch(logout());
      
      // Clear auth data from cookies
      // setCookie('auth', '', { maxAge: 0, path: '/' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      dispatch(logout());
      
      // Clear auth data from cookies even if API call fails
      // setCookie('auth', '', { maxAge: 0, path: '/' });
    } finally {
      dispatch(setLoading(false));
    }
  }
);