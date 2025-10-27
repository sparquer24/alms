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
        // Read cookies defensively: support token-only `auth`, separate `user` and `role` cookies
        const cookies = document.cookie.split('; ').reduce<Record<string, string>>((acc, cur) => {
          const idx = cur.indexOf('=');
          if (idx > -1) {
            const k = cur.slice(0, idx);
            const v = cur.slice(idx + 1);
            acc[k] = decodeURIComponent(v || '');
          }
          return acc;
        }, {});

        const authCookieVal = cookies['auth'];
        const userCookieVal = cookies['user'];
        const roleCookieVal = cookies['role'];

        // If we have an auth token, mark authenticated
        if (authCookieVal) {
          // If the cookie contains a JSON object with token, try to parse
          let token: string | null = null;
          try {
            const parsed = JSON.parse(authCookieVal);
            token = parsed?.token ?? parsed?.accessToken ?? null;
          } catch (e) {
            // Not JSON — treat as raw token string
            token = authCookieVal;
          }

          if (token) {
            state.token = token;
            state.isAuthenticated = true;
          }
        }

        // If user cookie exists, parse and set state.user
        if (userCookieVal) {
          try {
            const parsedUser = JSON.parse(userCookieVal);
            // Normalize role field: support nested role object or role string
            let normalizedRole: string | undefined;
            if (parsedUser?.role) {
              if (typeof parsedUser.role === 'object') {
                normalizedRole = parsedUser.role.code ?? parsedUser.role.name ?? parsedUser.role.key;
              } else if (typeof parsedUser.role === 'string') {
                normalizedRole = parsedUser.role;
              }
            }
            if (!normalizedRole && roleCookieVal) normalizedRole = roleCookieVal;
            if (normalizedRole) parsedUser.role = String(normalizedRole).toUpperCase();

            state.user = parsedUser;
            // Ensure isAuthenticated is true if token exists
            if (!state.isAuthenticated && state.token) state.isAuthenticated = true;
          } catch (e) {
          }
        } else if (roleCookieVal) {
          // If only role cookie exists, construct a minimal user object so redirection can use role
          try {
            const minimalUser: any = { role: String(roleCookieVal).toUpperCase() };
            state.user = minimalUser as any;
            if (!state.isAuthenticated && state.token) state.isAuthenticated = true;
          } catch (e) {
            // ignore
          }
        }
      } catch (error) {
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