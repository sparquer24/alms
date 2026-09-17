"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import { useLayout } from '../../config/layoutContext';
import { useAuth } from '@/hooks/useAuth';
import { filterApplications, getApplicationsByStatus, fetchApplicationsByStatusKey } from '../../services/sidebarApiCalls';
import { ApplicationData } from '../../types';
import { getRoleConfig } from '../../config/roles';
import { PageSubHeader, SubHeaderSearch, SubHeaderButton } from '@/components/common/PageSubHeader';
import { Plus } from 'lucide-react';
import Footer from '../../components/Footer';
import { canCreateApplications } from '@/utils/roleUtils';
import { PageLayoutSkeleton } from '../../components/Skeleton';



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

  const { isAuthenticated, userRole, isLoading: authLoading, initialized } = useAuth();
  const canCreate = canCreateApplications(userRole);
  const { setShowHeader, setShowSidebar, headerHeight } = useLayout();
  const searchParams = useSearchParams();
  const router = useRouter();



  useEffect(() => {
    if (initialized && !isAuthenticated) {
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
  }, [initialized, isAuthenticated, router, userRole]);

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

    if (initialized && isAuthenticated) {
      loadApplications();
    }
  }, [isAuthenticated, initialized]);

  // Redirect to create form if navigated with type query
  useEffect(() => {
    const type = searchParams?.get('type');
    if (type === 'fresh') {
      router.push('/forms/createFreshApplication/personal-information');
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
      router.push('/forms/createFreshApplication/personal-information');
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
  if (!initialized || authLoading || (!isAuthenticated && initialized)) {
    return <PageLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white">
      {/* Always render sidebar and header */}
      <Sidebar />
      <Header
        onCreateApplication={handleCreateApplication}
        onShowMessage={handleShowMessage}
      />

      {/* Main Content */}
      <main
        className="flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col pt-[52px] md:pt-[66px]"
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <PageSubHeader
          title="Fresh Applications"
          metaBadge={filteredApplications.length > 0 ? `${filteredApplications.length} Application${filteredApplications.length !== 1 ? 's' : ''}` : undefined}
          actions={
            <div className="flex items-center gap-2">
              <SubHeaderSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search fresh applications..."
              />
              {canCreate && (
                <SubHeaderButton
                  variant="primary"
                  onClick={() => router.push('/forms/createFreshApplication/personal-information')}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  New Fresh Application
                </SubHeaderButton>
              )}
            </div>
          }
        />

        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* Success message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 sm:p-6 flex-1 flex flex-col min-h-0">
            <ApplicationTable
              applications={filteredApplications}
              isLoading={isLoading}
              showActionColumn={true}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              hideControls={true}
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