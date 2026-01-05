"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useLayout } from '../../config/layoutContext';
import { useAuthSync } from '../../hooks/useAuthSync';
import { filterApplications, getApplicationsByStatus, fetchApplicationsByStatusKey } from '../../services/sidebarApiCalls';
import { ApplicationData } from '../../types';
import { getRoleConfig } from '../../config/roles';
import { PageLayoutSkeleton, TableSkeleton } from '../../components/Skeleton';

import Footer from '@/components/Footer';



// Force dynamic rendering

export const dynamic = 'force-dynamic';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function FreshFormContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isAuthenticated, userRole, isLoading: authLoading } = useAuthSync();
  const { setShowHeader, setShowSidebar } = useLayout();
  const searchParams = useSearchParams();
  const router = useRouter();



  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    // Check if the user has permission to view fresh forms
    const roleConfig = getRoleConfig(userRole);
    // Enforce permission check
    if (!roleConfig || !roleConfig.permissions.includes('canViewFreshForm')) {
      // Redirect to dashboard or show access denied
      router.push('/');
      return;
    }
  }, [isAuthenticated, router, userRole]);

  useEffect(() => {
    // Fetch applications on component mount
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        
        // Fetch freshform applications using the utility function
        const fetchedApplications = await fetchApplicationsByStatusKey('freshform');
        setApplications(fetchedApplications);
      } catch (error) {
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadApplications();
    }
  }, [isAuthenticated, authLoading]);

  // Redirect to create form if navigated with type query
  useEffect(() => {
    const type = searchParams?.get('type');
    if (type === 'fresh') {
      router.push('/create-fresh-application');
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Always show header and sidebar on this page
    setShowHeader(true);
    setShowSidebar(true);
  }, [setShowHeader, setShowSidebar]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDateFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };
  // Filter applications based on freshform and search/date filters
  const filteredApplications = filterApplications(
    applications,
    searchQuery,
    startDate,
    endDate
  );

  // Handler for create application dropdown
  const handleCreateApplication = (typeKey: string) => {
    if (typeKey === 'fresh') {
      router.push('/create-fresh-application');
    }
  };

  // Handler for showing messages from Header
  const handleShowMessage = (msg: string, type?: 'info' | 'error' | 'success') => {
    if (type === 'error') {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Show skeleton loading while authenticating or loading
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <PageLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      {/* Always render sidebar and header */}
      <Sidebar />
      <Header
        onCreateApplication={handleCreateApplication}
        onShowMessage={handleShowMessage}
      />

      {/* Main Content */}

  <main className="flex-1 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px] flex flex-col">          

    <div className="flex-grow p-8">



          {/* Success message */}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Display the regular list view with white background container */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Fresh Form Applications</h1>
              </div>

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
              
              {/* Show application count */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {filteredApplications.length} fresh application(s)
                </p>
              </div>

              {/* Display the application table */}
              <ApplicationTable

                applications={filteredApplications}

                isLoading={isLoading}

                showActionColumn={true}

              />

            </div>

      </div>

      <Footer />

      </main>

    </div>

  );

}

// Main component with Suspense boundary
export default function FreshFormPage() {
  return (
    <Suspense fallback={<PageLayoutSkeleton />}>
      <FreshFormContent />
    </Suspense>
  );
}