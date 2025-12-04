"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { postData, fetchData, setAuthToken } from '../api/axiosConfig';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string;
  userName: string;
  token: string | null;
  userId: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<boolean>;
  setUserRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: 'APPLICANT',
  userName: '',
  token: null,
  userId: null,
  login: async () => false,
  logout: async () => {},
  getCurrentUser: async () => false,
  setUserRole: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('APPLICANT');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Single-flight guard implemented inside the function
  const fetchCurrentUser = async (authToken: string) => {
    if ((fetchCurrentUser as any)._ongoingPromise) {
      return (fetchCurrentUser as any)._ongoingPromise;
    }
    (fetchCurrentUser as any)._ongoingPromise = (async () => {
      try {
        if (authToken) setAuthToken(authToken);
        const res = await fetchData('/auth/getMe');
        const userPayload = res?.body ?? (res as any)?.data ?? res;
        if (!userPayload || !userPayload.id) {
          setIsAuthenticated(false);
          setUserId(null);
          return false;
        }
        setIsAuthenticated(true);
        const roleCode = userPayload.role
          ? typeof userPayload.role === 'object'
            ? userPayload.role.code ?? userPayload.role
            : userPayload.role
          : undefined;
        setUserRole(roleCode ?? '');
        setUserName(userPayload.name ?? userPayload.username ?? '');
        setToken(authToken);
        setUserId(userPayload.id || null);

        // Persist cookies: auth -> token-only, user -> full JSON, role -> role code
        try {
          setCookie('auth', authToken, { maxAge: 60 * 60 * 24 * 30, path: '/' });
          setCookie('user', JSON.stringify(userPayload), { maxAge: 60 * 60 * 24 * 30, path: '/' });
          if (roleCode) setCookie('role', roleCode, { maxAge: 60 * 60 * 24 * 30, path: '/' });
        } catch (e) {
          // ignore cookie write failures
        }

        return true;
      } catch (err) {
        setIsAuthenticated(false);
        setUserId(null);
        return false;
      } finally {
        delete (fetchCurrentUser as any)._ongoingPromise;
      }
    })();
    return (fetchCurrentUser as any)._ongoingPromise;
  };

  const getCurrentUser = async (): Promise<boolean> => {
    const cookieAuth = getCookie('auth');
    if (!cookieAuth) return false;
    try {
      let storedToken: string | null = null;
      if (typeof cookieAuth === 'string') {
        try {
          const parsed = JSON.parse(cookieAuth as string);
          storedToken = parsed?.token ?? cookieAuth;
        } catch (e) {
          storedToken = cookieAuth as string;
        }
      } else {
        storedToken = (cookieAuth as any)?.token ?? null;
      }
      if (!storedToken) return false;
      return fetchCurrentUser(storedToken);
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    // Try to hydrate on mount
    void getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await postData('/auth/login', { username, password });
      const authToken = data?.data?.token ?? data?.body?.token ?? data?.token ?? null;
      if (!authToken) {
        return false;
      }
      setAuthToken(authToken);

      // Try to fetch canonical user payload
      let userPayload: any = null;
      try {
        const me = await fetchData('/auth/getMe');
        userPayload = me?.body ?? (me as any)?.data ?? me;
      } catch (e) {
        userPayload = data?.data?.user ?? data?.body?.user ?? null;
      }

      const roleCode = userPayload?.role
        ? typeof userPayload.role === 'object'
          ? userPayload.role.code ?? userPayload.role
          : userPayload.role
        : data?.data?.user?.role ?? undefined;

      setIsAuthenticated(true);
      setUserRole(roleCode ?? '');
      setUserName(userPayload?.name ?? userPayload?.username ?? data?.data?.user?.name ?? '');
      setToken(authToken);
      setUserId(userPayload?.id ?? data?.data?.user?.id ?? null);

      // Persist cookies
      try {
        setCookie('auth', authToken, { maxAge: 60 * 60 * 24 * 30, path: '/' });
        setCookie('user', JSON.stringify(userPayload ?? data?.data?.user ?? null), { maxAge: 60 * 60 * 24 * 30, path: '/' });
        if (roleCode) setCookie('role', roleCode, { maxAge: 60 * 60 * 24 * 30, path: '/' });
      } catch (e) {
        // ignore
      }

      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = async () => {
    try {
      // Server logout endpoint removed; perform client-side cleanup only
    } catch (err) {
    } finally {
      setIsAuthenticated(false);
      setUserRole('APPLICANT');
      setUserName('');
      setToken(null);
      setUserId(null);
      try {
        deleteCookie('auth');
        deleteCookie('user');
        deleteCookie('role');
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userName,
        token,
        userId,
        login,
        logout,
        getCurrentUser,
        setUserRole: (r: string) => setUserRole(r),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
