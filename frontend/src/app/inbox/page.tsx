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
import { apiClient } from '../../config/authenticatedApiClient';

type FreshFormViewType = 'fresh' | 'renewal';

const normalizeRenewalApplication = (application: any, submittedOnly: boolean): ApplicationData => {
  const applicantName =
    application?.applicantName ||
    [application?.firstName, application?.middleName, application?.lastName].filter(Boolean).join(' ') ||
    'Unknown Applicant';

  return {
    id: String(application?.id || ''),
    acknowledgementNo: application?.acknowledgementNo,
    firstName: application?.firstName,
    middleName: application?.middleName,
    lastName: application?.lastName,
    applicantName,
    applicantMobile: application?.mobileNumber || application?.contactInfo?.mobileNumber || '',
    applicantEmail: application?.email || application?.contactInfo?.email || undefined,
    mobileNumber: application?.mobileNumber || application?.contactInfo?.mobileNumber || '',
    email: application?.email || application?.contactInfo?.email || undefined,
    parentOrSpouseName: application?.parentOrSpouseName,
    sex: application?.sex,
    dob: application?.dateOfBirth ? new Date(application.dateOfBirth).toISOString() : undefined,
    dobInWords: application?.dobInWords,
    panNumber: application?.panNumber,
    aadharNumber: application?.aadharNumber,
    applicationType: 'Renewal Application',
    applicationDate: application?.createdAt || new Date().toISOString(),
    applicationTime: application?.createdAt ? new Date(application.createdAt).toTimeString() : undefined,
    status: application?.workflowStatus?.name || (submittedOnly ? 'Submitted' : 'Draft'),
    status_id: application?.workflowStatusId ?? (application?.isSubmit ? 1 : 9),
    workflowStatus: application?.workflowStatus,
    assignedTo: String(application?.currentUserId || ''),
    lastUpdated: application?.updatedAt || application?.createdAt || new Date().toISOString(),
    createdAt: application?.createdAt,
    updatedAt: application?.updatedAt,
    documents: Array.isArray(application?.documents) ? application.documents : [],
    currentUser: application?.currentUser,
    history: Array.isArray(application?.history) ? application.history : [],
    workflowHistories: Array.isArray(application?.workflowHistories) ? application.workflowHistories : [],
    actions: application?.actions || {
      canForward: false,
      canReport: true,
      canApprove: false,
      canReject: false,
      canRaiseRedflag: false,
      canReturn: false,
      canDispose: false,
    },
    usersInHierarchy: Array.isArray(application?.usersInHierarchy) ? application.usersInHierarchy : [],
    // Keep linkage IDs for renewal edit-routing in draft mode.
    ...( {
      renewalId: application?.id,
      renewalApplicationId: application?.id,
      applicationId:
        application?.applicationId ||
        application?.freshApplicationId ||
        application?.sourceApplicationId ||
        application?.renewalLicenseId ||
        '',
      freshApplicationId: application?.freshApplicationId || application?.applicationId || '',
      sourceApplicationId: application?.sourceApplicationId || application?.applicationId || '',
      renewalLicenseId: application?.renewalLicenseId || '',
    } as any),
  };
};

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

  const [type, setType] = useState<string | null>(null);
  const [selectedFormType, setSelectedFormType] = useState<FreshFormViewType>('fresh');
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading, userRole } = useAuth();

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
    if (!authLoading && isAdminRole(userRole)) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      router.push(redirectPath);
      return;
    }
  }, [authLoading, userRole, router]);

  useEffect(() => {
    if (!queryType) return;
    setType(queryType);
  }, [queryType]);

  useEffect(() => {
    if (isFreshFormsPage || isDraftsPage) {
      setSelectedFormType('fresh');
    }
  }, [isFreshFormsPage, isDraftsPage]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!type) return;

    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        // debug: log requested type
        console.debug('[InboxContent] fetching applications for type:', type);

        if (type === 'freshform') {
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

        if (type === 'drafts') {
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
        if (type === 'all') {
          const [forwarded, returned, redflagged, reenquiry] = await Promise.all([
            fetchApplicationsByStatusKey('forwarded'),
            fetchApplicationsByStatusKey('returned'),
            fetchApplicationsByStatusKey('redflagged'),
            fetchApplicationsByStatusKey('reenquiry')
          ]);
          
          // Combine all results and remove duplicates based on application ID
          const combined = [...forwarded, ...returned, ...redflagged, ...reenquiry];
          const uniqueApps = combined.filter((app, index, self) =>
            index === self.findIndex((a) => a.id === app.id)
          );
          
          console.debug('[InboxContent] combined inbox applications:', uniqueApps.length);
          setApplications(uniqueApps);
        } else {
          const apps = await fetchApplicationsByStatusKey(type);
          console.debug(
            '[InboxContent] fetch result length for',
            type,
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

    if (!authLoading && isAuthenticated) fetchApplications();
    else if (!authLoading && !isAuthenticated) setIsLoading(false);
  }, [type, selectedFormType, authLoading, isAuthenticated]);

  if (!type) return <PageLayoutSkeleton />;

  const getPageTitle = () => {
    switch (type) {
      case 'all':
        return 'All Inbox Applications';
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

        {type === 'all' && (
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
                Showing all inbox applications (Forwarded, Returned, Red Flagged, and Re-Enquiry)
              </span>
            </div>
          </div>
        )}

        <ApplicationTable
          applications={applications}
          isLoading={isLoading}
          pageType={type || undefined}
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
