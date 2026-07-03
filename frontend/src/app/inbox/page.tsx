'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCookie, setCookie } from 'cookies-next';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuth } from '@/hooks/useAuth';
import { fetchApplicationsByStatusKey } from '../../services/sidebarApiCalls';
import { ApplicationData } from '../../types';
import { PageLayoutSkeleton } from '../../components/Skeleton';
import { isAdminRole } from '../../utils/roleUtils';
import { getRoleBasedRedirectPath } from '../../config/roleRedirections';
import { useInbox } from '../../context/InboxContext';
import axiosInstance from '../../api/axiosConfig';
import { normalizeRenewalApplication } from '../../utils/applicationFormatters';

type FreshFormViewType = 'fresh' | 'renewal';

// Helper function for fetching renewal applications
const fetchRenewalApplications = async (submittedOnly: boolean): Promise<ApplicationData[]> => {
  try {
    const response = await axiosInstance.get('/renewal-forms', {
      params: {
        page: 1,
        limit: 1000,
      },
    });

    const renewalApplications = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];

    return renewalApplications
      .filter((application: any) => (submittedOnly ? application?.isSubmit === true : application?.isSubmit === false))
      .map((application: any) => normalizeRenewalApplication(application, submittedOnly));
  } catch (error) {
    return [];
  }
};

function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryType = searchParams?.get('type') || 'all';
  const shouldRefresh = searchParams?.get('refresh') === 'true';
  const isFreshFormsPage = queryType === 'freshform';
  const isDraftsPage = queryType === 'drafts';

  const [selectedFormType, setSelectedFormType] = useState<FreshFormViewType>('fresh');
  const { isAuthenticated, isLoading: authLoading, userRole, initialized } = useAuth();

  // Use inbox context for shared applications and loading state
  const { applications: contextApplications, isLoading: isContextLoading } = useInbox();

  // Local applications state for special cases (freshform, drafts)
  const [localApplications, setLocalApplications] = useState<ApplicationData[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // Combine context and local applications based on query type
  // For 'all' and 'renewal', use context; for freshform/drafts use local
  const applications = (queryType === 'renewal'
    ? contextApplications
    : (queryType === 'freshform' || queryType === 'drafts')
      ? localApplications
      : contextApplications) || [];

  // Determine loading state - use local loading for freshform/drafts, context loading otherwise
  const isLoading = (queryType === 'freshform' || queryType === 'drafts') ? localLoading : isContextLoading;

  // Handle refresh parameter - only refresh once per login
  useEffect(() => {
    if (shouldRefresh) {
      const refreshed = getCookie('pageRefreshed');
      if (!refreshed) {
        const timer = setTimeout(() => {
          setCookie('pageRefreshed', 'true', { maxAge: 60 * 5 });
          window.location.reload();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [shouldRefresh]);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (initialized && isAdminRole(userRole)) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      router.push(redirectPath);
    }
  }, [initialized, userRole, router]);

  // NOTE: selectedFormType intentionally keeps its current value when navigating
  // between pages. Resetting it here would prevent renewal drafts from being
  // shown if the user had previously switched to the renewal tab.

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [initialized, isAuthenticated, router]);

  // Fetch local data for freshform/drafts pages
  useEffect(() => {
    if (queryType === 'freshform' || queryType === 'drafts') {
      const fetchApplications = async () => {
        try {
          setLocalLoading(true);
          if (queryType === 'freshform') {
            if (selectedFormType === 'renewal') {
              const renewalApps = await fetchRenewalApplications(true);
              setLocalApplications(renewalApps);
            } else {
              const freshApps = await fetchApplicationsByStatusKey('freshform');
              setLocalApplications(freshApps);
            }
          } else if (queryType === 'drafts') {
            if (selectedFormType === 'renewal') {
              const renewalDraftApps = await fetchRenewalApplications(false);
              setLocalApplications(renewalDraftApps);
            } else {
              const freshDraftApps = await fetchApplicationsByStatusKey('drafts');
              setLocalApplications(freshDraftApps);
            }
          }
        } catch {
          setLocalApplications([]);
        } finally {
          setLocalLoading(false);
        }
      };
      if (initialized && isAuthenticated) fetchApplications();
    }
  }, [queryType, selectedFormType, initialized, isAuthenticated]);

  const getPageTitle = () => {
    switch (queryType) {
      case 'all':
        return 'All Applications';
      case 'forwarded':
        return 'Forwarded Applications';
      case 'returned':
        return 'Returned Applications';
      case 'redflagged':
        return 'Red Flagged Applications';
      case 'drafts':
        return selectedFormType === 'renewal' ? 'Renewal Draft Applications' : 'Draft Applications';
      case 'sent':
        return 'Sent Applications';
      case 'closed':
        return 'Closed Applications';
      case 'freshform':
        return selectedFormType === 'renewal' ? 'Renewal Form Applications' : 'Fresh Form Applications';
      case 'reenquiry':
        return 'Re-Enquiry Applications';
      case 'cancel':
        return 'Cancellation Requests';
      default:
        return 'Applications';
    }
  };

  return (
    <div className='max-w-8xl w-full mx-auto'>
      <div className='bg-white rounded-lg shadow p-4 sm:p-5'>
        <h1 className='text-2xl font-bold mb-3'>{getPageTitle()}</h1>

        {queryType === 'all' && (
          <div className='mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5 text-blue-600 mr-2'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-blue-800 font-medium'>
                Showing approved applications only
              </span>
            </div>
          </div>
        )}

        {/* Tab switcher for pages that support both fresh and renewal application types */}
        {(isDraftsPage || isFreshFormsPage) && (
          <div className='mb-4 flex gap-2'>
            <button
              type='button'
              onClick={() => setSelectedFormType('fresh')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedFormType === 'fresh'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedFormType === 'fresh'}
            >
              Fresh License
            </button>
            <button
              type='button'
              onClick={() => setSelectedFormType('renewal')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedFormType === 'renewal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedFormType === 'renewal'}
            >
              Renewal Application
            </button>
          </div>
        )}

        <ApplicationTable
          applications={applications}
          isLoading={isLoading}
          pageType={queryType}
          selectedFormType={selectedFormType}
          onSelectedFormTypeChange={setSelectedFormType}
          showActionColumn={true}
        />
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function InboxQueryPage() {
  return (
    <Suspense fallback={<PageLayoutSkeleton />}>
      <InboxContent />
    </Suspense>
  );
}