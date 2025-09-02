"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import Header from "../components/Header";
import ApplicationTable from "../components/ApplicationTable";
import DashboardSummary from "../components/DashboardSummary";
import { useAuthSync } from "../hooks/useAuthSync";
import { shouldRedirectOnStartup } from "../config/roleRedirections";
import { useLayout } from "../config/layoutContext";
import { filterApplications, ApplicationData } from "../config/mockData";
import { useApplications } from "../context/ApplicationContext";
import { ApplicationApi } from '../config/APIClient';
import { mapAPIApplicationToTableData } from "../utils/applicationMapper";

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
    if (!isLoading && isAuthenticated && userRole) {
      const redirectPath = shouldRedirectOnStartup(userRole, '/');
      if (redirectPath) {
        console.log(`Redirecting ${userRole} user from dashboard to: ${redirectPath}`);
        router.replace(redirectPath);
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
            
            if (tableData.length > 0) {
              setApplications(tableData);
              setHasLoadedInitialData(true);
            }
          }
        } catch (err) {
          console.error('Failed to load initial applications:', err);
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
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
      <main className="flex-1 p-8 overflow-y-auto ml-[18%] mt-[70px]">
        <div className="bg-white rounded-lg shadow p-6">
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
          
          {/* Dashboard Summary Component */}
          <div className="mb-8">
            <DashboardSummary />
          </div>

          <h2 className="text-xl font-bold mb-4">Recent Applications</h2>
          <ApplicationTable 
            applications={applications}
          />
        </div>
      </main>
    </div>
  );
}
