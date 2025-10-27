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
  const [checked, setChecked] = useState(false);

  // Debug log each render (can be removed later)
  if (typeof window !== 'undefined') {
  }

  useEffect(() => {
    // Only check auth once and don't redirect immediately
    if (checked || isLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!userRole) {
      // Middleware should have redirected already; perform a defensive redirect.
      router.replace('/login?error=no_role');
      return;
    }
    if (userRole.toUpperCase() !== 'ADMIN') {
      router.replace('/');
      return;
    }
    setChecked(true);
  }, [token, userRole, isLoading, checked, router]);

  // Show loading while checking authentication
  if (isLoading || !checked) {
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
  if (!token || !userRole || userRole.toUpperCase() !== 'ADMIN') {
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
