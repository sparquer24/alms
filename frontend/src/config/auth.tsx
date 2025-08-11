import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setCookie, getCookie } from 'cookies-next';

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
  userRole: "APPLICANT",
  userName: '',
  token: null,
  userId: null,
  login: () => Promise.resolve(false),
  logout: async () => {},
  getCurrentUser: () => Promise.resolve(false),
  setUserRole: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>("DCP");
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Function to fetch current user data from API
  const getCurrentUser = async (): Promise<boolean> => {
    const cookieAuth = getCookie('auth');
    if (!cookieAuth) return false;
    try {
      const { token: storedToken } = JSON.parse(cookieAuth as string);
      return fetchCurrentUser(storedToken);
    } catch (e) {
      console.error('Error getting current user:', e);
      return false;
    }
  };

  // Helper function to fetch current user data from API
  const fetchCurrentUser = async (authToken: string) => {
    try {
      // Check if auth data exists in cookies
      const authCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('auth='));

      if (authCookie) {
        const authData = JSON.parse(decodeURIComponent(authCookie.split('=')[1]));
        if (authData && authData.token) {
          console.log('Using auth data from cookies:', authData);
          setCookie('role', authData.role, {
            maxAge: 60 * 60 * 24 * 30, //for one month 
            path: '/',
          }); 
          
          // Update cookies with latest user data
          setCookie('auth', JSON.stringify(authData), {
            maxAge: 60 * 60 * 24 * 30, // 1 day
            path: '/',
          });
          setIsAuthenticated(true);
          setUserRole(authData.role);
          setUserName(authData.name);
          setToken(authData.token);
          setUserId(authData.id || null);
          return true;
        }
      }

      // If no valid auth data in cookies, call the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.error('Failed to fetch current user:', response.status, response.statusText);
        return false;
      }
      const data = await response.json();
      console.log('API Response:', data); // Log the full response for debugging
      if (!data.success || !data.body || !data.data) {
        console.warn('Unexpected response structure. Falling back to defaults:', data);
        setIsAuthenticated(false);
        setUserId(null);
        return false;
      }
      setIsAuthenticated(true);
      setUserRole(data.data.role as string);
      setUserName(data.data.name);
      setToken(authToken);
      setUserId(data.data.id || null);
      // Create auth state object
      const authState = {
        isAuthenticated: true,
        token: authToken,
        role: data.data.role,
        name: data.data.name,
        id: data.data.id || null
      };
      console.log('data.data.role', data.data.role);

      setCookie('role', data.data.role, {
        maxAge: 60 * 60 * 24 * 30, //for one month 
        path: '/',
      }); 
      
      // Update cookies with latest user data
      setCookie('auth', JSON.stringify(authState), {
        maxAge: 60 * 60 * 24 * 30, // 1 day
        path: '/',
      });
      return true;
    } catch (error) {
      console.error('Error fetching current user:', error);
      setIsAuthenticated(false);
      setUserId(null);
      return false;
    }
  };

  // Check if user is already logged in from cookies on initial load
  useEffect(() => {
    const cookieAuth = getCookie('auth');
    if (cookieAuth) {
      try {
        const authData = JSON.parse(cookieAuth as string);
        // If we already have user info in state, skip API call
        if (isAuthenticated && userRole && userName && userId) {
          return;
        }
        // If all user info is present in cookie, use it and skip API call
        if (authData.role && authData.name && authData.id && authData.token) {
          setIsAuthenticated(true);
          setUserRole(authData.role);
          setUserName(authData.name);
          setUserId(authData.id);
          setToken(authData.token);
          return;
        } else if (authData.token) {
          // Only call fetchCurrentUser if we have no user info in state or cookie
          fetchCurrentUser(authData.token);
        }
      } catch (e) {
        console.error('Error parsing auth data from cookies', e);
        setUserId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        const authToken = data.data.token;
        const user = data.data.user;
        setIsAuthenticated(true);
        setUserRole(user.role as string);
        setUserName(user.name);
        setToken(authToken);
        setUserId(user.id || null);
        const authState = {
          isAuthenticated: true,
          role: user.role,
          name: user.name,
          token: authToken,
          id: user.id || null
        };
        setCookie('auth', JSON.stringify(authState), {
          maxAge: 60 * 60 * 24, // 1 day
          path: '/',
        });
        return true;
      } else {
        console.error('Login failed:', data.message || 'Unknown error');
        setUserId(null);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setUserId(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      const cookieAuth = getCookie('auth');
      if (cookieAuth) {
        const { token } = JSON.parse(cookieAuth as string);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsAuthenticated(false);
      setUserRole("APPLICANT");
      setUserName('');
      setToken(null);
      setUserId(null);
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
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
