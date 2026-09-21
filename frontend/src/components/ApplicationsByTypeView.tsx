'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ApplicationTable from './ApplicationTable';
import { fetchApplicationsByStatusKey } from '../services/sidebarApiCalls';
import { ApplicationData } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { useInbox } from '../context/InboxContext';
import axiosInstance from '../api/axiosConfig';
import { normalizeRenewalApplication } from '../utils/applicationFormatters';
import { analyticsService, ApplicationRecord } from '../services/analyticsService';

import { PageSubHeader, SubHeaderPills, SubHeaderSearch, SubHeaderSelect, SubHeaderButton } from './common/PageSubHeader';
import { Download } from 'lucide-react';
import { ApplicationTableRef } from './ApplicationTable';

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

type FreshFormViewType = 'fresh' | 'renewal';

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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Persisted in the URL (not just local state) so that navigating into an
  // application's detail page and coming back with the browser/back button
  // restores the previously selected Fresh/Renewal pill instead of resetting
  // to the default.
  const [selectedFormType, setSelectedFormType] = useState<FreshFormViewType>(
    () => (searchParams?.get('formType') === 'renewal' ? 'renewal' : 'fresh')
  );

  useEffect(() => {
    const formType = searchParams?.get('formType');
    if (formType === 'renewal' || formType === 'fresh') {
      setSelectedFormType(formType);
    } else if (!formType) {
      setSelectedFormType('fresh');
    }
  }, [searchParams]);

  const handleSelectedFormTypeChange = (formType: FreshFormViewType) => {
    setSelectedFormType(formType);
    if (isOrgWide) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set('formType', formType);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [searchQuery, setSearchQuery] = useState('');

  // Same URL-persistence treatment as selectedFormType above, so the
  // Application Type dropdown also survives a trip into the application
  // detail page and back.
  const [applicationTypeFilter, setApplicationTypeFilter] = useState(
    () => searchParams?.get('appType') || 'All'
  );

  useEffect(() => {
    const appType = searchParams?.get('appType');
    if (appType) {
      setApplicationTypeFilter(appType);
    } else if (!appType) {
      setApplicationTypeFilter('All');
    }
  }, [searchParams]);

  const handleApplicationTypeFilterChange = (typeFilter: string) => {
    setApplicationTypeFilter(typeFilter);
    if (isOrgWide) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set('appType', typeFilter);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [isExporting, setIsExporting] = useState(false);
  const tableRef = React.useRef<ApplicationTableRef>(null);

  const handleExportExcel = async () => {
    if (tableRef.current) {
      try {
        setIsExporting(true);
        await tableRef.current.exportExcel();
      } finally {
        setIsExporting(false);
      }
    }
  };

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
    <div className='flex flex-col flex-1 min-h-0 w-full'>
      <PageSubHeader
        title={getPageTitle(queryType, selectedFormType)}
        metaBadge={applications.length > 0 ? `${applications.length} Application${applications.length !== 1 ? 's' : ''}` : undefined}
        actions={
          <div className='flex flex-wrap items-center gap-2 sm:gap-2.5'>
            {/* Search Input in SubHeader */}
            <SubHeaderSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder='Search (name, type, status)'
            />

            {/* Application Type Filter / Pills in SubHeader */}
            {(isDraftsPage || isFreshFormsPage) ? (
              <SubHeaderPills<FreshFormViewType>
                options={[
                  { key: 'fresh', label: 'Fresh' },
                  { key: 'renewal', label: 'Renewal' },
                ]}
                value={selectedFormType}
                onChange={handleSelectedFormTypeChange}
              />
            ) : (
              <SubHeaderSelect
                value={applicationTypeFilter}
                onChange={handleApplicationTypeFilterChange}
                options={[
                  { value: 'All', label: 'All Types' },
                  { value: 'Fresh', label: 'Fresh' },
                  { value: 'Renewal', label: 'Renewal' },
                  { value: 'Cancel', label: 'Cancel' },
                ]}
              />
            )}

            {/* Download Excel in SubHeader */}
            <SubHeaderButton
              variant='success'
              onClick={handleExportExcel}
              disabled={isExporting || isLoading}
              icon={<Download className='w-3.5 h-3.5' />}
              title='Download applications Excel file'
            >
              {isExporting ? 'Exporting...' : 'Download Excel'}
            </SubHeaderButton>
          </div>
        }
      />

      <div className='flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 md:p-4'>
        <div className='bg-white rounded-2xl shadow-xs border border-gray-200/80 p-2 sm:p-3 flex-1 flex flex-col min-h-0 overflow-hidden'>
          <div className='flex-1 min-h-0 flex flex-col'>
            <ApplicationTable
              ref={tableRef}
              applications={applications}
              isLoading={isLoading}
              pageType={queryType}
              selectedFormType={selectedFormType}
              onSelectedFormTypeChange={handleSelectedFormTypeChange}
              showActionColumn={showActionColumn}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              applicationTypeFilter={applicationTypeFilter}
              onApplicationTypeFilterChange={handleApplicationTypeFilterChange}
              hideControls={true}
            />
          </div>

          {isOrgWide && orgTotalPages > 1 && (
            <div className='flex-none flex items-center justify-between border-t border-gray-200 pt-3 mt-3'>
              <div className='text-xs text-gray-600'>
                Page {orgPage} of {orgTotalPages} ({orgTotal} total)
              </div>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setOrgPage(p => Math.max(1, p - 1))}
                  disabled={orgPage === 1 || orgLoading}
                  className='px-3 py-1 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors'
                >
                  Previous
                </button>
                <button
                  type='button'
                  onClick={() => setOrgPage(p => Math.min(orgTotalPages, p + 1))}
                  disabled={orgPage === orgTotalPages || orgLoading}
                  className='px-3 py-1 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
