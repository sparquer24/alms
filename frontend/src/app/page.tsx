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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const { applications, setApplications } = useApplications();
  const { isAuthenticated, isLoading, userRole } = useAuthSync();
  const { setShowHeader, setShowSidebar } = useLayout();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're done loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // If authenticated, check if user should be redirected based on role
    if (!isLoading && isAuthenticated) {
      if (userRole) {
        const redirectPath = shouldRedirectOnStartup(userRole, '/');
        if (redirectPath) {
          console.log(`Redirecting ${userRole} user from dashboard to: ${redirectPath}`);
          router.push(redirectPath);
          return;
        }
      } else {
        // Role not available yet (still hydrating). Don't perform a fallback navigation
        // which can create redirect loops; wait until `userRole` is populated.
        return;
      }
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
          console.error('Failed to load initial applications:', err);
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
    console.log("Searching for:", query);
    // Here you would typically fetch data based on the search query
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    console.log("Reset filters");
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
    <div className="flex items-center justify-center h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome to Arms License Management System</h1>
        <p className="mt-4 text-gray-600">Manage applications, track statuses, and process requests from a single dashboard.</p>
      </div>
    </div>
  );
}
