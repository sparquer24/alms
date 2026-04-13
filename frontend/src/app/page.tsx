"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSync } from "../hooks/useAuthSync";
import { shouldRedirectOnStartup } from "../config/roleRedirections";
import { useLayout } from "../config/layoutContext";
import { useApplications } from "../context/ApplicationContext";
import { ApplicationApi } from '../config/APIClient';
import { mapAPIApplicationToTableData } from "../utils/applicationMapper";

import { PageLayoutSkeleton, DashboardStatsSkeleton } from "../components/Skeleton";

import Footer from "@/components/Footer";



export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const { applications, setApplications } = useApplications();
  const { isAuthenticated, isLoading, userRole } = useAuthSync();
  const { setShowHeader, setShowSidebar } = useLayout();
  const router = useRouter();

  // Synchronous cookie-read fallback for faster role-based redirects.
  // This mirrors the logic used in Sidebar to avoid waiting for async hydration.
  const getUserRoleFromCookie = () => {
    if (typeof window === 'undefined' || !document?.cookie) return undefined;
    try {
      const raw = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('user='));
      if (!raw) return undefined;
      let value = raw.substring('user='.length);
      let decoded = decodeURIComponent(value);
      if (decoded.startsWith('j:')) decoded = decoded.slice(2);
      if ((decoded.startsWith('"') && decoded.endsWith('"')) || (decoded.startsWith("'") && decoded.endsWith("'"))) {
        decoded = decoded.slice(1, -1);
      }
      const parsed = JSON.parse(decoded);
      const roleObj = parsed?.role ?? parsed;
      if (!roleObj) return undefined;
      if (typeof roleObj === 'string') return roleObj.toUpperCase();
      if (typeof roleObj === 'object') {
        if (roleObj.code) return String(roleObj.code).toUpperCase();
        if (roleObj.name) return String(roleObj.name).toUpperCase();
      }
    } catch (err) {
      // ignore parse errors - fallback to async value from hook
    }
    return undefined;
  };

  useEffect(() => {
    // Only redirect if we're done loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // If authenticated, check if user should be redirected based on role
    if (!isLoading && isAuthenticated) {
      // Prefer role from hook but fall back to cookie-derived role synchronously
      const effectiveRole = userRole || getUserRoleFromCookie();
      if (effectiveRole) {
        const redirectPath = shouldRedirectOnStartup(effectiveRole, '/');
        if (redirectPath) {
          // Use replace to avoid extra history entries when redirecting on load
          router.replace(redirectPath);
          return;
        }
      }
      // If we still don't have a role, wait for hydration (no-op) — avoids redirect loops
    }
  }, [isAuthenticated, isLoading, userRole, router]);

  useEffect(() => {
    // Show header and sidebar on the Application Table page
    setShowHeader(true);
    setShowSidebar(true);
  }, [setShowHeader, setShowSidebar]);

  // Fetch initial data if context is empty and we haven't loaded data yet
  useEffect(() => {
    if (isAuthenticated && !hasLoadedInitialData) {
      const loadInitialData = async () => {
        try {
          // This matches the API structure that the Sidebar uses
          const response = await ApplicationApi.getAll();
          // Extract the data array from the response
          const apiApplications = response?.data || [];
          if (apiApplications && Array.isArray(apiApplications)) {
            // Convert API applications to table format using the same mapper as Sidebar
            const tableData = apiApplications.map(app => mapAPIApplicationToTableData(app));
            // Always update context with fetched data (may be empty)
            setApplications(tableData);
          }
        } catch (err) {
        } finally {
          // Mark initial load as completed regardless of result so UI can show empty state
          setHasLoadedInitialData(true);
        }
      };

      loadInitialData();
    }
  }, [isAuthenticated, setApplications, hasLoadedInitialData]); // Added hasLoadedInitialData to prevent multiple API calls

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Here you would typically fetch data based on the search query
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    // Here you would typically reset the data to its original state
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <PageLayoutSkeleton>
        <DashboardStatsSkeleton />
      </PageLayoutSkeleton>
    );
  }

  // Show skeleton while initial data for the page is being loaded
  if (isAuthenticated && !hasLoadedInitialData) {
    return (
      <PageLayoutSkeleton>
        <DashboardStatsSkeleton />
      </PageLayoutSkeleton>
    );
  }

  return (

    <div className="flex flex-col h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">

      <div className="flex-grow flex items-center justify-center">

        <div className="text-center p-6">

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome to Arms License Management System</h1>

          <p className="mt-4 text-gray-600">Manage applications, track statuses, and process requests from a single dashboard.</p>

        </div>

      </div>

    </div>

  );

}