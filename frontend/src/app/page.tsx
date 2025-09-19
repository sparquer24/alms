"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import Header from "../components/Header";
import Link from 'next/link';
import ApplicationTable from "../components/ApplicationTable";
import DashboardSummary from "../components/DashboardSummary";
import { useAuthSync } from "../hooks/useAuthSync";
import { shouldRedirectOnStartup } from "../config/roleRedirections";
import { useLayout } from "../config/layoutContext";
import { ApplicationData } from "../types";
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

  // Debug logging
  console.log('Home page - applications from context:', applications);
  console.log('Home page - applications length:', applications?.length);
  console.log('Home page - applications type:', typeof applications);

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
          router.replace(redirectPath);
          return;
        }
      } else {
        // Fallback: if role isn't available yet, send to inbox by default after login
        router.replace('/inbox/forwarded');
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
          console.log('Loading initial data for home page...');
          console.log('Current applications length:', applications.length);
          console.log('Current isAuthenticated:', isAuthenticated);

          // Use ApplicationApi.getAll() without parameters to get all applications
          // This matches the API structure that the Sidebar uses
          const response = await ApplicationApi.getAll();
          console.log('Initial API Response:', response);
          console.log('Initial API Response type:', typeof response);
          console.log('Initial API Response keys:', response ? Object.keys(response) : 'No response');

          // Extract the data array from the response
          const apiApplications = response?.data || [];
          console.log('Initial extracted apiApplications:', apiApplications);
          console.log('Initial extracted apiApplications type:', typeof apiApplications);
          console.log('Initial extracted apiApplications isArray:', Array.isArray(apiApplications));

          if (apiApplications && Array.isArray(apiApplications)) {
            console.log('Initial API applications:', apiApplications);

            // Convert API applications to table format using the same mapper as Sidebar
            const tableData = apiApplications.map(app => mapAPIApplicationToTableData(app));
            console.log('Initial converted table data:', tableData);

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

  const handleDateFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    console.log("Filtering by date range:", start, "to", end);
    // Here you would typically fetch data based on the date range
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

  // Debug logging before render
  console.log('Home page: About to render with applications:', applications);
  console.log('Home page: About to render with applications length:', applications?.length);

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />
  <main className="flex-1 p-8 overflow-y-auto w-full mt-[64px] md:ml-[18%] md:mt-[70px]">
        <div className="max-w-8xl w-full mx-auto">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col flex-1 min-h-[420px]">
            <h1 className="text-2xl font-bold text-black mb-6">Welcome to Arms License Dashboard</h1>
            <p className="text-gray-600 mb-4">
              This dashboard provides access to all arms license applications and their statuses.
              Use the sidebar navigation to access different sections.
            </p>

            {/* Display search and filter information if applied */}
            {(searchQuery || startDate || endDate) && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="font-semibold text-blue-700">Active Filters:</h3>
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  {searchQuery && <p>Search: {searchQuery}</p>}
                  {(startDate || endDate) && (
                    <p>Date Range: {startDate || "Any"} to {endDate || "Any"}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dashboard area: responsive grid (summary left, table right) */}
            <div className="mb-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <div className="md:col-span-1">
                  <DashboardSummary />
                </div>

                <div className="md:col-span-2 flex flex-col">
                  <h2 className="text-xl font-bold mb-4">Recent Applications</h2>
                  <div className="flex-1 overflow-hidden">
                    {(!applications || applications.length === 0) ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6M9 16h6M9 8h6M5 6h14M5 18h14" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800">No applications found</h3>
                        <p className="text-sm text-gray-500 mt-2">There are no applications to display right now.</p>
                        <div className="mt-4">
                          <Link href="/create-fresh-application" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500">
                            Create new application
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <ApplicationTable
                        applications={applications}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
