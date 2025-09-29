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
      try {
        // Defensive cookie parsing
        const cookies = document.cookie.split('; ').reduce((acc, row) => {
          const [key, ...rest] = row.split('=');
          acc[key] = decodeURIComponent(rest.join('='));
          return acc;
        }, {} as Record<string, string>);

        const authCookie = cookies['auth'];
        const userCookie = cookies['user'];
        const roleCookie = cookies['role'];

        if (!authCookie || !userCookie || !roleCookie) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.error = null;
          return;
        }

        let authData: any = null;
        try {
          authData = JSON.parse(authCookie);
        } catch (e) {
          if (authCookie.startsWith('eyJhbGciOi')) {
            authData = { token: authCookie, isAuthenticated: true };
          } else {
            return;
          }
        }

        let userData: any = null;
        try {
          userData = JSON.parse(userCookie);
        } catch (e) {
          userData = null;
        }

        state.token = authData.token || null;
        state.isAuthenticated = !!authData.isAuthenticated;
        state.user = userData || null;
        state.error = null;
      } catch (error) {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
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