'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCookie, setCookie } from 'cookies-next';
import ApplicationTable from '../../components/ApplicationTable';
import { useAuth } from '@/hooks/useAuth';
import { fetchApplicationsByStatusKey, fetchAllApplications } from '../../services/sidebarApiCalls';
import { ApplicationData } from '../../types';
import { PageLayoutSkeleton } from '../../components/Skeleton';
import { isAdminRole } from '../../utils/roleUtils';
import { getRoleBasedRedirectPath } from '../../config/roleRedirections';
import { apiClient } from '../../config/authenticatedApiClient';

import { normalizeRenewalApplication } from '../../utils/applicationFormatters';

type FreshFormViewType = 'fresh' | 'renewal';


const fetchRenewalApplications = async (submittedOnly: boolean): Promise<ApplicationData[]> => {
  try {
    const response = await apiClient.get<any>('/renewal-forms', {
      page: 1,
      limit: 1000,
      ordering: 'DESC',
      orderBy: 'createdAt',
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
    console.error('[InboxContent] failed to fetch renewal applications:', error);
    return [];
  }
};

// Component that uses useSearchParams - needs to be wrapped in Suspense
function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryType = searchParams?.get('type') || 'all'; // Default to 'all' if no type specified
  const shouldRefresh = searchParams?.get('refresh') === 'true';
  const isFreshFormsPage = queryType === 'freshform';
  const isDraftsPage = queryType === 'drafts';

  const [selectedFormType, setSelectedFormType] = useState<FreshFormViewType>('fresh');
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading, userRole, initialized } = useAuth();
  // Handle refresh parameter - only refresh once per login
  useEffect(() => {
    if (shouldRefresh) {
      const refreshed = getCookie('pageRefreshed');
      if (!refreshed) {
        const timer = setTimeout(() => {
          setCookie('pageRefreshed', 'true', { maxAge: 60 * 5 }); // 5 minute expiry
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
      return;
    }
  }, [initialized, userRole, router]);

  useEffect(() => {
    if (isFreshFormsPage || isDraftsPage) {
      setSelectedFormType('fresh');
    }
  }, [isFreshFormsPage, isDraftsPage]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        // debug: log requested type
        console.debug('[InboxContent] fetching applications for type:', queryType);

        if (queryType === 'freshform') {
          if (selectedFormType === 'renewal') {
            const renewalApps = await fetchRenewalApplications(true);
            console.debug('[InboxContent] renewal applications fetched:', renewalApps.length);
            setApplications(renewalApps);
          } else {
            const freshApps = await fetchApplicationsByStatusKey('freshform');
            console.debug('[InboxContent] fresh applications fetched:', freshApps.length);
            setApplications(freshApps);
          }
          return;
        }

        if (queryType === 'drafts') {
          if (selectedFormType === 'renewal') {
            const renewalDraftApps = await fetchRenewalApplications(false);
            console.debug('[InboxContent] renewal draft applications fetched:', renewalDraftApps.length);
            setApplications(renewalDraftApps);
          } else {
            const freshDraftApps = await fetchApplicationsByStatusKey('drafts');
            console.debug('[InboxContent] fresh draft applications fetched:', freshDraftApps.length);
            setApplications(freshDraftApps);
          }
          return;
        }
        
        // If type is 'all', fetch from all inbox categories and combine
        if (queryType === 'all') {
          if (selectedFormType === 'renewal') {
            const submittedRenewals = await fetchRenewalApplications(true);
            console.debug('[InboxContent] all renewal applications (excluding drafts) fetched:', submittedRenewals.length);
            setApplications(submittedRenewals);
          } else {
            const freshApps = await fetchAllApplications({ limit: 1000 });
            const nonDraftFresh = freshApps.filter((app) => {
              const statusName = (
                app.workflowStatus?.name ||
                (typeof app.status === 'string' ? app.status : (app.status as any)?.name) ||
                ''
              ).toLowerCase();
              const statusId = app.status_id;
              return statusId !== 12 && statusId !== 13 && !statusName.includes('draft');
            });
            console.debug('[InboxContent] all fresh applications (excluding drafts) fetched:', nonDraftFresh.length);
            setApplications(nonDraftFresh);
          }
        } else {
          const apps = await fetchApplicationsByStatusKey(queryType);
          console.debug(
            '[InboxContent] fetch result length for',
            queryType,
            ':',
            Array.isArray(apps) ? apps.length : typeof apps,
            apps && apps[0] ? apps[0] : null
          );
          setApplications(apps);
        }
      } catch {
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (initialized && isAuthenticated) fetchApplications();
    else if (initialized && !isAuthenticated) setIsLoading(false);
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
      case 'disposed':
        return 'Disposed Applications';
      case 'drafts':
        return selectedFormType === 'renewal' ? 'Renewal Draft Applications' : 'Draft Applications';
      case 'finaldisposal':
        return 'Final Disposal Applications';
      case 'sent':
        return 'Sent Applications';
      case 'closed':
        return 'Closed Applications';
      case 'freshform':
        return selectedFormType === 'renewal' ? 'Renewal Form Applications' : 'Fresh Form Applications';
      case 'reenquiry':
        return 'Re-Enquiry Applications';
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
                Showing all applications (Approved, Rejected, Returned, Forwarded, Re-Enquiry, Red Flag, Closed, Submitted, Initiated, etc.)
              </span>
            </div>
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
