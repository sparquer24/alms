'use client';

import React, { useEffect, useState } from 'react';
import ApplicationTable from './ApplicationTable';
import { fetchApplicationsByStatusKey } from '../services/sidebarApiCalls';
import { ApplicationData } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { useInbox } from '../context/InboxContext';
import axiosInstance from '../api/axiosConfig';
import { normalizeRenewalApplication } from '../utils/applicationFormatters';
import { analyticsService, ApplicationRecord } from '../services/analyticsService';

type FreshFormViewType = 'fresh' | 'renewal';

// Maps the analytics "Applications Overview" card types to the org-wide
// (state/zone-scoped, not per-user) analytics/applications/details query.
const ORG_WIDE_QUERY_MAP: Record<string, { status?: string; type?: string }> = {
  all: {},
  freshform: { type: 'fresh' },
  renewal: { type: 'renewal' },
  cancel: { type: 'cancel' },
  approved: { status: 'APPROVED' },
  pending: { status: 'PENDING' },
  returned: { status: 'RETURNED' },
};

const toApplicationData = (record: ApplicationRecord): ApplicationData => ({
  id: String(record.applicationId),
  acknowledgementNo: record.licenseId ?? undefined,
  applicantName: record.applicantName || 'N/A',
  applicantMobile: '',
  applicationType: record.applicationType || '',
  applicationDate: record.actionTakenAt || '',
  lastUpdated: record.actionTakenAt || '',
  assignedTo: record.currentUser?.name || '',
  status: record.status ? (record.status.toLowerCase() as ApplicationData['status']) : undefined,
  currentUser: record.currentUser
    ? { id: record.currentUser.id, username: record.currentUser.name }
    : undefined,
});

const fetchRenewalApplications = async (submittedOnly: boolean): Promise<ApplicationData[]> => {
  try {
    const response = await axiosInstance.get('/renewal-forms', {
      params: { page: 1, limit: 1000 },
    });

    const renewalApplications = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];

    return renewalApplications
      .filter((application: any) =>
        submittedOnly ? application?.isSubmit === true : application?.isSubmit === false
      )
      .map((application: any) => normalizeRenewalApplication(application, submittedOnly));
  } catch (error) {
    return [];
  }
};

const ORG_WIDE_PAGE_SIZE = 20;

const getPageTitle = (queryType: string, selectedFormType: FreshFormViewType) => {
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
    case 'approved':
      return 'Approved Applications';
    case 'pending':
      return 'Pending Applications';
    case 'renewal':
      return 'Renewal Applications';
    default:
      return 'Applications';
  }
};

/**
 * Renders the applications list for a given status/type key. Extracted from
 * the /inbox page so it can be embedded elsewhere (e.g. the analytics
 * "Applications" drill-down) without duplicating the fetch/table wiring.
 */
export default function ApplicationsByTypeView({
  queryType,
  source = 'inbox',
  showActionColumn = true,
  fromDate,
  toDate,
}: {
  queryType: string;
  /**
   * 'inbox' (default) fetches from the per-user inbox/work-queue APIs, matching
   * /inbox behavior. 'org-wide' fetches from the state/zone-scoped analytics
   * endpoint instead, so counts match the analytics dashboard's stat cards
   * regardless of what's currently assigned to the logged-in user.
   */
  source?: 'inbox' | 'org-wide';
  showActionColumn?: boolean;
  /** org-wide only: must match the date range used to compute the stat cards, or totals won't line up. */
  fromDate?: string;
  toDate?: string;
}) {
  const isOrgWide = source === 'org-wide';
  const isFreshFormsPage = !isOrgWide && queryType === 'freshform';
  const isDraftsPage = !isOrgWide && queryType === 'drafts';

  const [selectedFormType, setSelectedFormType] = useState<FreshFormViewType>('fresh');
  const { isAuthenticated, initialized } = useAuth();

  const { applications: contextApplications, isLoading: isContextLoading, loadType } = useInbox();

  const [localApplications, setLocalApplications] = useState<ApplicationData[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  const [orgApplications, setOrgApplications] = useState<ApplicationData[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [orgTotal, setOrgTotal] = useState(0);

  const applications = isOrgWide
    ? orgApplications
    : (queryType === 'renewal'
        ? contextApplications
        : queryType === 'freshform' || queryType === 'drafts'
          ? localApplications
          : contextApplications) || [];

  const isLoading = isOrgWide
    ? orgLoading
    : queryType === 'freshform' || queryType === 'drafts'
      ? localLoading
      : isContextLoading;

  // Reset to page 1 whenever the selected status/type or date range changes.
  useEffect(() => {
    setOrgPage(1);
  }, [queryType, fromDate, toDate]);

  useEffect(() => {
    if (!isOrgWide) return;
    const fetchOrgWideApplications = async () => {
      try {
        setOrgLoading(true);
        const queryParams = ORG_WIDE_QUERY_MAP[queryType] ?? {};
        const res = await analyticsService.getApplicationsDetails({
          ...queryParams,
          page: orgPage,
          limit: ORG_WIDE_PAGE_SIZE,
          fromDate,
          toDate,
        });
        setOrgApplications((res.data || []).map(toApplicationData));
        setOrgTotal(res.meta?.total ?? 0);
        setOrgTotalPages(res.meta?.pages ?? 1);
      } catch {
        setOrgApplications([]);
        setOrgTotal(0);
        setOrgTotalPages(1);
      } finally {
        setOrgLoading(false);
      }
    };
    fetchOrgWideApplications();
  }, [isOrgWide, queryType, orgPage, fromDate, toDate]);

  useEffect(() => {
    if (isOrgWide) return;
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

  // For every other type, load via the shared inbox context so this view works
  // regardless of which route it's embedded in (not just /inbox or /admin/*,
  // which is all InboxBootloaderClient watches for).
  useEffect(() => {
    if (isOrgWide) return;
    if (queryType === 'freshform' || queryType === 'drafts') return;
    if (initialized && isAuthenticated) {
      void loadType(queryType).catch(() => {});
    }
  }, [isOrgWide, queryType, initialized, isAuthenticated, loadType]);

  return (
    <div className='max-w-8xl w-full mx-auto flex-1 min-h-0 flex flex-col'>
      <div className='bg-white rounded-lg shadow p-4 sm:p-5 flex-1 flex flex-col min-h-0'>
        <h1 className='flex-none text-2xl font-bold mb-3'>
          {getPageTitle(queryType, selectedFormType)}
        </h1>

        {!isOrgWide && queryType === 'all' && (
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
              <span className='text-blue-800 font-medium'>Showing approved applications only</span>
            </div>
          </div>
        )}

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
              Fresh
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
              Renewal
            </button>
          </div>
        )}

        <div className='flex-1 min-h-0 flex flex-col'>
          <ApplicationTable
            applications={applications}
            isLoading={isLoading}
            pageType={queryType}
            selectedFormType={selectedFormType}
            onSelectedFormTypeChange={setSelectedFormType}
            showActionColumn={showActionColumn}
          />
        </div>

        {isOrgWide && orgTotalPages > 1 && (
          <div className='flex-none flex items-center justify-between border-t border-gray-200 pt-3 mt-3'>
            <div className='text-sm text-gray-700'>
              Page {orgPage} of {orgTotalPages} ({orgTotal} total)
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setOrgPage(p => Math.max(1, p - 1))}
                disabled={orgPage === 1 || orgLoading}
                className='px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Previous
              </button>
              <button
                type='button'
                onClick={() => setOrgPage(p => Math.min(orgTotalPages, p + 1))}
                disabled={orgPage === orgTotalPages || orgLoading}
                className='px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
