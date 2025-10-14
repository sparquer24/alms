import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { getAuthTokenFromCookie, getUserFromCookie } from '../utils/authCookies';

interface ProtectedRouteProps {
  children: ReactNode;
}

const checkAuthentication = (): boolean => {
  try {
    const token = getAuthTokenFromCookie();
    const user = getUserFromCookie();
    return !!token && !!user;
  } catch (e) {
    console.error('ProtectedRoute: Failed to read auth cookies', e);
    return false;
  }
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = checkAuthentication();
    setIsAuthenticated(authStatus);
    if (!authStatus) {
      router.push('/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    // Show a loading spinner while checking auth
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
