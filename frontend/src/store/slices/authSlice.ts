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
      if (typeof window === 'undefined') return;

      try {
        const cookies = document.cookie.split('; ').reduce<Record<string, string>>((acc, cur) => {
          const [k, v] = cur.split('=');
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>);

        const authRaw = cookies['auth'];

        if (!authRaw) return;

        // Decode once
        const decoded = decodeURIComponent(authRaw);

        // Case 1: legacy JSON object stored in `auth` cookie
        if (decoded.trim().startsWith('{')) {
          try {
            const authData = JSON.parse(decoded);
            if (authData && authData.token) {
              state.token = authData.token;
              if (authData.user) state.user = authData.user;
              state.isAuthenticated = !!authData.isAuthenticated || !!authData.token;
              return;
            }
          } catch (e) {
            // fallthrough to try token-only
            console.debug('auth cookie looks like JSON but failed to parse, falling back to token-only');
          }
        }

        // Case 2: token-only (JWT string) stored in auth cookie
        if (decoded && typeof decoded === 'string') {
          // token-only case
          state.token = decoded;

          // Try to recover user from separate `user` cookie (if present)
          if (cookies['user']) {
            try {
              const userDecoded = decodeURIComponent(cookies['user']);
              state.user = JSON.parse(userDecoded);
            } catch (e) {
              // If user cookie isn't JSON, ignore
            }
          }

          // Try to set isAuthenticated if token exists
          state.isAuthenticated = true;
          return;
        }
      } catch (error) {
        // Keep restore operation safe — don't crash the app
        // Log the raw error for debugging
        // eslint-disable-next-line no-console
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