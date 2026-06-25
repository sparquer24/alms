import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { getAuthTokenFromCookie, getUserFromCookie } from '../utils/authCookies';
import { PageLayoutSkeleton } from './Skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
}

const checkAuthentication = (): boolean => {
  try {
    const token = getAuthTokenFromCookie();
    const user = getUserFromCookie();
    return !!token && !!user;
  } catch (e) {
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
    // Show a premium visual layout skeleton while checking auth instead of plain text
    return <PageLayoutSkeleton />;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
