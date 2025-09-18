"use client";

import { useAuthSync } from '../../hooks/useAuthSync';
import { PageLayoutSkeleton } from '../../components/Skeleton';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { LayoutProvider } from "@/config/layoutContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, token, isLoading } = useAuthSync();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Only check auth once and don't redirect immediately
    if (!isLoading) {
      // Check if user is authenticated and is admin
      if (!token || userRole !== 'ADMIN') {
        console.log('User not authenticated as admin, redirecting to login');
        router.push('/login');
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [userRole, token, router, isLoading]);

  // Show loading while checking authentication
  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated as admin
  if (!token || userRole !== 'ADMIN') {
    return null; // Don't render anything while redirecting
  }

  return (
    <LayoutProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-[80px] md:ml-[18%] min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </LayoutProvider>
  );
}
