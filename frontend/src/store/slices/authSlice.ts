import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  designation: string;
  createdAt: string;
  lastLogin: string;
  permissions: string[];
  availableActions: {
    action: string;
    resource: string;
  }[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    restoreAuthState: (state) => {
      // Try to restore from cookies only
      console.log('Restoring auth state from cookies...');
      console.log('Document cookies:', document.cookie);
      try {
        const authCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth='));
        console.log('Auth cookie:', authCookie);
        if (authCookie) {
          const cookieValue = decodeURIComponent(authCookie.split('=')[1]);
          let authData: any = null;
          
          try {
            // First try to parse as JSON
            authData = JSON.parse(cookieValue);
          } catch (e) {
            // If parsing fails, check if it's a JWT token
            if (cookieValue.startsWith('eyJhbGciOi')) {
              // It's a JWT token, create minimal auth data
              authData = { token: cookieValue, isAuthenticated: true };
              console.log('Detected JWT token in cookie, created minimal auth data:', authData);
            } else {
              console.error('Cookie value is neither valid JSON nor JWT token:', cookieValue);
              return;
            }
          }
          
          console.log('Parsed auth data from cookie:', authData);
          if (authData.token && authData.isAuthenticated) {
            state.token = authData.token;
            state.isAuthenticated = true;
            // Only set user if it exists in the auth data
            if (authData.user) {
              state.user = authData.user;
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
      }
    },
  },
});

export const { setCredentials, setLoading, setError, logout, restoreAuthState } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error; 