import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

interface PublicRouteProps {
  children: ReactNode;
}

const checkAuthentication = (): boolean => {
  const authCookie = getCookie('auth');
  try {
    if (authCookie) {
      const { token, user } = JSON.parse(authCookie as string);
      return !!token && !!user;
    }
  } catch (e) {
    console.error('PublicRoute: Failed to parse auth cookie', e);
  }
  return false;
};

const PublicRoute = ({ children }: PublicRouteProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = checkAuthentication();
    setIsAuthenticated(authStatus);
    if (authStatus) {
      router.replace('/');
    }
  }, [router]);

  if (isAuthenticated === null) {
    // Show a loading spinner while checking auth
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
};

export default PublicRoute;