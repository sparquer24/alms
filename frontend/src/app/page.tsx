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
          router.push(redirectPath);
          return;
        }
      } else {
        // Fallback: if role isn't available yet, send to inbox by default after login
        router.push('/inbox/forwarded');
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
    <div className="flex items-center justify-center h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome to Arms License Management System</h1>
        <p className="mt-4 text-gray-600">Manage applications, track statuses, and process requests from a single dashboard.</p>
      </div>
    </div>
  );
}
