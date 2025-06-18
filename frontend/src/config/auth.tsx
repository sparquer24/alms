import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RoleType, RoleTypes } from './roles'; // Removed unused import getRoleConfig
import { setCookie, getCookie } from 'cookies-next';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: RoleType;
  userName: string;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<boolean>;
  setUserRole: (role: RoleType) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: RoleTypes.APPLICANT,
  userName: '',
  token: null,
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
  const [userRole, setUserRole] = useState<RoleType>(RoleTypes.DCP);
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // Function to fetch current user data from API
  const getCurrentUser = async (): Promise<boolean> => {
    const storedAuth = localStorage.getItem('auth');
    if (!storedAuth) return false;

    try {
      const { token: storedToken } = JSON.parse(storedAuth);
      return fetchCurrentUser(storedToken);
    } catch (e) {
      console.error('Error getting current user:', e);
      return false;
    }
  };

  // Helper function to fetch current user data from API
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
        const data = await response.json();
      
      if (data.success && data.data) {        setIsAuthenticated(true);
        setUserRole(data.data.role as RoleType);
        setUserName(data.data.name);
        setToken(authToken);
        
        // Create auth state object
        const authState = {
          isAuthenticated: true,
          role: data.data.role,
          name: data.data.name,
          token: authToken,
        };
        
        // Update both localStorage and cookies with latest user data
        localStorage.setItem('auth', JSON.stringify(authState));
        setCookie('auth', JSON.stringify(authState), {
          maxAge: 60 * 60 * 24, // 1 day
          path: '/',
        });
        
        return true;
      } else {
        // If API call fails, user session might be invalid
        console.error('Failed to get current user:', data.message || 'Unknown error');
        localStorage.removeItem('auth');
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      return false;
    }
  };

  // Check if user is already logged in from localStorage on initial load
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        
        if (authData.token) {
          // If we have a token, verify it by fetching current user
          fetchCurrentUser(authData.token);
        } else {
          // Legacy support for older auth format
          setIsAuthenticated(true);
          setUserRole(authData.role);
          setUserName(authData.name);
        }
      } catch (e) {
        console.error('Error parsing auth data from localStorage', e);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  // Mock users for testing different roles
  const mockUsers: { [key: string]: { role: RoleType; name: string } } = {
    // Applicant role
    'user@example.com': { role: RoleTypes.APPLICANT, name: 'Citizen Applicant' },
    // Administrative roles
    'dcp@example.com': { role: RoleTypes.DCP, name: 'Deputy Commissioner' },
    'acp@example.com': { role: RoleTypes.ACP, name: 'Assistant Commissioner' },
    'sho@example.com': { role: RoleTypes.SHO, name: 'Station House Officer' },
    'zs@example.com': { role: RoleTypes.ZS, name: 'Zonal Superintendent' },
    'as@example.com': { role: RoleTypes.AS, name: 'Arms Superintendent' },
    'arms-supdt@example.com': { role: RoleTypes.ARMS_SUPDT, name: 'ARMS Superintendent' },
    'arms-seat@example.com': { role: RoleTypes.ARMS_SEAT, name: 'ARMS Seat Officer' },
    'ado@example.com': { role: RoleTypes.ADO, name: 'Administrative Officer' },
    'cado@example.com': { role: RoleTypes.CADO, name: 'Chief Administrative Officer' },
    'jtcp@example.com': { role: RoleTypes.JTCP, name: 'Joint Commissioner' },
    'cp@example.com': { role: RoleTypes.CP, name: 'Commissioner of Police' },
    'admin@example.com': { role: RoleTypes.ADMIN, name: 'System Administrator' },
  };
    const login = async (username: string, password: string): Promise<boolean> => {
      try {
        // Use the API client to call the login endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (data.success && data.data?.token) {          const authToken = data.data.token;
          const user = data.data.user;
            setIsAuthenticated(true);
          setUserRole(user.role as RoleType);
          setUserName(user.name);
          setToken(authToken);
          
          // Create auth state object
          const authState = {
            isAuthenticated: true,
            role: user.role,
            name: user.name,
            token: authToken,
          };
          
          // Store auth state in localStorage
          localStorage.setItem('auth', JSON.stringify(authState));
          
          // Also store in cookies for middleware access
          setCookie('auth', JSON.stringify(authState), {
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
          });
          
          return true;
        } else {
          console.error('Login failed:', data.message || 'Unknown error');
          return false;
        }
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    };  const logout = async () => {
    try {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        const { token } = JSON.parse(storedAuth);
        
        // Call the logout API endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Even if the API call fails, we still clear the local state
        const data = await response.json();
        if (!data.success) {
          console.warn('Logout API call failed:', data.message);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {      // Always clear local state regardless of API response
      setIsAuthenticated(false);
      setUserRole(RoleTypes.APPLICANT); // Default to APPLICANT role after logout
      setUserName('');
      setToken(null);
      
      // Clear from both localStorage and cookies
      localStorage.removeItem('auth');
      setCookie('auth', '', { maxAge: 0, path: '/' });
    }
  };
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userName,
        token,
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
