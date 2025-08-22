import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

interface ProtectedRouteProps {
  children: ReactNode;
}

const checkAuthentication = (): boolean => {
  const authCookie = getCookie('auth');
  try {
    if (authCookie) {
      // Support legacy JSON shape or token-only string
      try {
        const parsed = JSON.parse(authCookie as string);
        const token = parsed?.token ?? parsed?.accessToken ?? null;
        return !!token;
      } catch (e) {
        return typeof authCookie === 'string' && authCookie.length > 0;
      }
    }
  } catch (e) {
    console.error('ProtectedRoute: Failed to parse auth cookie', e);
  }
  return false;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = checkAuthentication();
    setIsAuthenticated(authStatus);
    if (!authStatus) {
      router.replace('/login');
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
