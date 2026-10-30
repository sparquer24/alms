'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileDown,
  History,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import LicenseService from '@/services/licenseService';
import { LicenseData } from '@/types';
import { normalizeRole } from '@/utils/roleUtils';
import { LayoutProvider, useLayout } from '@/config/layoutContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageSubHeader, SubHeaderButton, SubHeaderSearch, SubHeaderPills, SubHeaderSelect } from '@/components/common/PageSubHeader';
import BulkLicenseImport, { downloadLicenseImportTemplate } from '@/components/licenses/BulkLicenseImport';
import { markLicenseOpenedFromList, saveLicensesListUrl } from '@/components/licenses/licensesListUrl';
import { PageLayoutSkeleton } from '@/components/Skeleton';
import { getPendingRenewalId } from '@/utils/licenseRenewal';

type LicenseTab = 'all' | 'expiring' | 'expired' | 'import' | 'audit';

const LICENSE_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'ZS', 'DCP', 'CP', 'JTCP', 'ARMS_SUPDT', 'ARMS_SEAT', 'ACO']);

const VALID_TABS: LicenseTab[] = ['all', 'expiring', 'expired', 'import', 'audit'];

const PURPOSE_OPTIONS = [
  { value: '', label: 'All Purposes' },
  { value: 'SELF_PROTECTION', label: 'Self Protection' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'HEIRLOOM_POLICY', label: 'Heirloom Policy' },
  { value: 'CROP_PROTECTION', label: 'Crop Protection' },
];

const AUDIT_ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'RENEWED', label: 'Renewed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const auditColumns = [
  'Date & Time',
  'License Number',
  'License Holder',
  'Action',
  'Previous Status',
  'New Status',
  'Officer',
  'Remarks',
];

const columns = [
  'License Number',
  'License Holder Name',
  'Expiry Date',
  'License Status',
  'Created From',
  'Father/Guardian Name',
  'Address',
  'Weapon Type',
  'Weapon Details',
  'License Purpose',
  'Issue Date',
  'Current Workflow Status',
  'Created Date',
  'Updated Date',
  'Mobile Number',
  'Email',
  'District',
];

const columnWidths: Record<string, string> = {
  'License Number': 'w-[250px] min-w-[250px]',
  'License Holder Name': 'w-[220px] min-w-[220px]',
  'Expiry Date': 'w-[150px] min-w-[150px]',
  'License Status': 'w-[150px] min-w-[150px]',
  'Father/Guardian Name': 'w-[230px] min-w-[230px]',
  Address: 'w-[300px] min-w-[300px]',
  'Weapon Type': 'w-[160px] min-w-[160px]',
  'Weapon Details': 'w-[240px] min-w-[240px]',
  'License Purpose': 'w-[180px] min-w-[180px]',
  'Issue Date': 'w-[140px] min-w-[140px]',
  'Current Workflow Status': 'w-[190px] min-w-[190px]',
  'Created From': 'w-[160px] min-w-[160px]',
  'Created Date': 'w-[140px] min-w-[140px]',
  'Updated Date': 'w-[140px] min-w-[140px]',
  'Mobile Number': 'w-[150px] min-w-[150px]',
  Email: 'w-[220px] min-w-[220px]',
  District: 'w-[160px] min-w-[160px]',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFullName = (license: LicenseData | null | undefined) =>
  [license?.firstName, license?.middleName, license?.lastName].filter(Boolean).join(' ') || '-';

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'FRESH', label: 'Fresh Application' },
  { value: 'RENEWAL', label: 'Renewal' },
  { value: 'IMPORT', label: 'Imported' },
  { value: 'CANCELLATION', label: 'Cancellation' },
];

/**
 * `lastModifiedAppType` is the authoritative source marker written by the
 * fresh/renewal/cancel/import flows themselves — unlike `freshApplicationId`,
 * it doesn't misclassify renewal-only or cancelled licenses as "Imported".
 */
const getLicenseSource = (license: LicenseData): { label: string; badge: string } => {
  const type = (license.lastModifiedAppType || '').toUpperCase();
  switch (type) {
    case 'IMPORT':
      return { label: 'Imported', badge: 'bg-amber-100 text-amber-800' };
    case 'RENEWAL':
      return { label: 'Renewal', badge: 'bg-blue-100 text-blue-700' };
    case 'CANCELLATION':
      return { label: 'Cancellation', badge: 'bg-red-100 text-red-700' };
    case 'FRESH':
      return { label: 'Fresh Application', badge: 'bg-green-100 text-green-700' };
    default:
      return license.freshApplicationId
        ? { label: 'Fresh Application', badge: 'bg-green-100 text-green-700' }
        : { label: 'Imported', badge: 'bg-amber-100 text-amber-800' };
  }
};


const getExpiryState = (license: LicenseData) => {
  if (!license.validTill) return { };
  const today = new Date();
  const expiry = new Date(license.validTill);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0 || license.status === 'EXPIRED') {
    return { label: 'Expired', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  }
  if (days <= 30) {
    return { label: `${days} days`, color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' };
  }
  if (days <= 90) {
    return { label: `${days} days`, color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' };
  }
  return { label: 'Valid', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
};

const mapLicenseToRow = (license: LicenseData) => ({
  'License Number': license.licenseNumber,
  'License Holder Name': getFullName(license),
  'Father/Guardian Name': license.parentOrSpouseName || '-',
  'Mobile Number': (license as any).mobileNumber || (license as any).applicantMobile || '-',
  Email: (license as any).email || (license as any).applicantEmail || '-',
  District:
    (license as any).presentDistrict?.name ||
    (license as any).presentDistrictName ||
    (typeof (license as any).presentDistrict === 'string' ? (license as any).presentDistrict : undefined) ||
    ((license as any).presentDistrictId != null ? `District #${(license as any).presentDistrictId}` : '-'),
  Address: license.presentAddressLine || '-',
  'Weapon Type': license.armsCategory || '-',
  'Weapon Details': license.endorsedWeapons?.map(weapon => weapon.name).join(', ') || license.ammunitionDescription || '-',
  'License Purpose': license.needForLicense || '-',
  'Issue Date': formatDate(license.issueDate || license.validFrom),
  'Expiry Date': formatDate(license.validTill),
  'License Status': license.status,
  'Current Workflow Status': license.workflowHistories?.[0]?.newStatus || license.status,
  'Created From': getLicenseSource(license).label,
  'Created Date': formatDate(license.createdAt),
  'Updated Date': formatDate(license.updatedAt),
});

const coerceLicenseList = (value: any): { data: LicenseData[]; total: number } => {
  if (Array.isArray(value)) {
    return { data: value, total: value.length };
  }

  const nested = value?.data;
  if (Array.isArray(nested)) {
    return { data: nested, total: Number(value?.total ?? nested.length) };
  }

  if (Array.isArray(nested?.data)) {
    return { data: nested.data, total: Number(nested.total ?? nested.data.length) };
  }

  return { data: [], total: 0 };
};

/**
 * Local draft for a text filter that lives in the URL. Edits are committed after
 * `delay` ms; URL changes coming from elsewhere (Back/Forward, card clicks) are
 * pulled back into the draft, but our own commits landing late are ignored so
 * characters typed in the meantime aren't overwritten.
 */
function useDebouncedUrlValue(urlValue: string, commit: (value: string) => void, delay = 350) {
  const [draft, setDraft] = useState(urlValue);
  const lastCommitted = useRef(urlValue);
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  useEffect(() => {
    if (urlValue !== lastCommitted.current) setDraft(urlValue);
    lastCommitted.current = urlValue;
  }, [urlValue]);

  useEffect(() => {
    if (draft === lastCommitted.current) return;
    const timer = setTimeout(() => {
      lastCommitted.current = draft;
      commitRef.current(draft);
    }, delay);
    return () => clearTimeout(timer);
  }, [draft, delay]);

  return [draft, setDraft] as const;
}

function LicenseManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole, isAuthenticated, isLoading, initialized } = useAuth();
  const { setShowSidebar, headerHeight } = useLayout();
  const [checkedState, setChecked] = useState(false);

  // The URL is the single source of truth for tab/filters/pagination, so a page
  // refresh or browser Back/Forward always lands on exactly what the URL says.
  // Every change goes through exactly one router.push/replace — dispatching two
  // navigations back to back makes Next discard the first (losing history entries).
  const tabParam = searchParams?.get('tab') as LicenseTab | null;
  const tab: LicenseTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'all';
  const search = searchParams?.get('search') || '';
  const statusFilter = searchParams?.get('status') || '';
  const purposeFilter = searchParams?.get('purpose') || '';
  const sourceFilter = searchParams?.get('source') || '';
  const expiringDays = Number(searchParams?.get('days')) || 90;
  const renewedOnly = searchParams?.get('renewed') === 'true';
  const page = Number(searchParams?.get('page')) || 1;
  const [sortBy, setSortBy] = useState('validTill');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  const auditSearch = searchParams?.get('auditSearch') || '';
  const auditAction = searchParams?.get('auditAction') || '';
  const auditDateFrom = searchParams?.get('dateFrom') || '';
  const auditDateTo = searchParams?.get('dateTo') || '';
  const auditPage = Number(searchParams?.get('auditPage')) || 1;
  const auditLimit = 10;

  const role = useMemo(() => normalizeRole(userRole), [userRole]);
  const canAccess = role ? LICENSE_ROLES.has(role) : false;
  // Already signed in with access (client-side navigation): skip the loading
  // skeleton on first render. The effect below still handles redirects.
  const checked = checkedState || (initialized && !isLoading && isAuthenticated && canAccess);
  const isZS = role === 'ZS';

  useEffect(() => {
    setShowSidebar(false);
    return () => setShowSidebar(true);
  }, [setShowSidebar]);

  useEffect(() => {
    if (!initialized || isLoading || checked) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!canAccess) {
      router.replace('/inbox');
      return;
    }
    setChecked(true);
  }, [canAccess, checked, initialized, isAuthenticated, isLoading, router]);

  // License dashboard stat cards — independent of the list/tab so they don't
  // get refetched on every page/filter change, only when actually stale.
  const statsQuery = useQuery({
    queryKey: ['licenseDashboard'],
    queryFn: () => LicenseService.getLicenseDashboard(),
    enabled: checked,
    staleTime: 60_000,
  });
  const stats = statsQuery.data ?? null;

  const licensesQueryKey = useMemo(
    () => [
      'licenses',
      tab,
      page,
      limit,
      search,
      statusFilter,
      purposeFilter,
      sourceFilter,
      renewedOnly,
      sortBy,
      sortOrder,
      expiringDays,
    ],
    [tab, page, limit, search, statusFilter, purposeFilter, sourceFilter, renewedOnly, sortBy, sortOrder, expiringDays]
  );

  const licensesQuery = useQuery({
    queryKey: licensesQueryKey,
    queryFn: async () => {
      const list =
        tab === 'expiring'
          ? await LicenseService.getExpiringLicenses(expiringDays, {
            page,
            limit,
            search,
            purpose: purposeFilter || undefined,
            renewedOnly,
          })
          : tab === 'expired'
            ? await LicenseService.getExpiredLicenses({
              page,
              limit,
              search,
              purpose: purposeFilter || undefined,
              renewedOnly,
            })
            : await LicenseService.getAllLicenses({
              page,
              limit,
              search,
              status: statusFilter || undefined,
              purpose: purposeFilter || undefined,
              createdFrom: sourceFilter || undefined,
              renewedOnly,
              orderBy: sortBy,
              order: sortOrder,
            });
      return coerceLicenseList(list);
    },
    enabled: checked && tab !== 'import' && tab !== 'audit',
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const licenses = useMemo(() => licensesQuery.data?.data ?? [], [licensesQuery.data]);
  const total = licensesQuery.data?.total ?? 0;
  const loading = licensesQuery.isLoading;
  const error = licensesQuery.error
    ? (licensesQuery.error as any)?.message || 'Failed to load licenses.'
    : null;

  // Manual refresh (Refresh button, post-bulk-import callback): force both
  // the current license list and the stat cards to revalidate immediately.
  const loadLicenses = useCallback(() => {
    licensesQuery.refetch();
    statsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const auditQueryKey = useMemo(
    () => ['licenseAuditLogs', auditPage, auditLimit, auditSearch, auditAction, auditDateFrom, auditDateTo],
    [auditPage, auditLimit, auditSearch, auditAction, auditDateFrom, auditDateTo]
  );

  const auditQuery = useQuery({
    queryKey: auditQueryKey,
    queryFn: async () => {
      const list = await LicenseService.getLicenseAuditLogs({
        page: auditPage,
        limit: auditLimit,
        search: auditSearch,
        action: auditAction || undefined,
        dateFrom: auditDateFrom || undefined,
        dateTo: auditDateTo || undefined,
      });
      return coerceLicenseList(list);
    },
    enabled: checked && tab === 'audit',
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const auditLogRows = useMemo(() => auditQuery.data?.data ?? [], [auditQuery.data]);
  const auditLogTotal = auditQuery.data?.total ?? 0;
  const auditLogLoading = auditQuery.isLoading;
  const auditLogError = auditQuery.error
    ? (auditQuery.error as any)?.message || 'Failed to load audit logs.'
    : null;

  const buildLicensesUrl = (state: {
    tab: LicenseTab;
    status?: string;
    purpose?: string;
    source?: string;
    renewed?: boolean;
    days?: number;
    search?: string;
    page?: number;
    auditSearch?: string;
    auditAction?: string;
    auditDateFrom?: string;
    auditDateTo?: string;
    auditPage?: number;
  }) => {
    const params = new URLSearchParams();
    params.set('tab', state.tab);
    if (state.tab === 'audit') {
      if (state.auditSearch) params.set('auditSearch', state.auditSearch);
      if (state.auditAction) params.set('auditAction', state.auditAction);
      if (state.auditDateFrom) params.set('dateFrom', state.auditDateFrom);
      if (state.auditDateTo) params.set('dateTo', state.auditDateTo);
      if (state.auditPage && state.auditPage > 1) params.set('auditPage', String(state.auditPage));
    } else {
      if (state.status) params.set('status', state.status);
      if (state.purpose) params.set('purpose', state.purpose);
      if (state.source) params.set('source', state.source);
      if (state.renewed) params.set('renewed', 'true');
      if (state.tab === 'expiring' && state.days && state.days !== 90) params.set('days', String(state.days));
      if (state.search) params.set('search', state.search);
      if (state.page && state.page > 1) params.set('page', String(state.page));
    }
    const query = params.toString();
    return query ? `/licenses?${query}` : '/licenses';
  };

  const currentUrlState = {
    tab,
    status: statusFilter,
    purpose: purposeFilter,
    source: sourceFilter,
    renewed: renewedOnly,
    days: expiringDays,
    search,
    page,
    auditSearch,
    auditAction,
    auditDateFrom,
    auditDateTo,
    auditPage,
  };

  // In-tab tweaks (filters, pagination, search) replace the current history entry;
  // tab/card switches push a new one so Back/Forward steps between them.
  const updateUrl = (patch: Partial<typeof currentUrlState>, mode: 'push' | 'replace' = 'replace') => {
    const url = buildLicensesUrl({ ...currentUrlState, ...patch });
    if (mode === 'push') router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  };
  const updateUrlRef = useRef(updateUrl);
  updateUrlRef.current = updateUrl;

  // Remember the exact list URL so the detail page's Back button returns here
  // with the same tab/filters/page instead of the unfiltered list.
  useEffect(() => {
    saveLicensesListUrl(buildLicensesUrl(currentUrlState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Search boxes keep a local draft so typing stays responsive, and commit to
  // the URL after a short pause.
  const [searchInput, setSearchInput] = useDebouncedUrlValue(search, value =>
    updateUrlRef.current({ search: value, page: 1 })
  );
  const [auditSearchInput, setAuditSearchInput] = useDebouncedUrlValue(auditSearch, value =>
    updateUrlRef.current({ auditSearch: value, auditPage: 1 })
  );

  const openDetails = (license: LicenseData) => {
    markLicenseOpenedFromList(license.id);
    router.push(`/licenses/${license.id}`);
  };

  const visibleRows = useMemo(() => licenses.map(mapLicenseToRow), [licenses]);

  const exportCsv = () => {
    const rows = visibleRows.map(row => columns.map(col => `"${String((row as any)[col] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [columns.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'licenses.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(visibleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Licenses');
    XLSX.writeFile(workbook, 'licenses.xlsx');
  };

  const mapAuditLogToRow = (entry: any) => ({
    'Date & Time': formatDateTime(entry.createdAt),
    'License Number': entry.licenseNumber || '-',
    'License Holder': entry.licenseHolderName || '-',
    Action: entry.event || '-',
    'Previous Status': entry.previousStatus || '-',
    'New Status': entry.newStatus || '-',
    Officer: entry.officer || '-',
    Remarks: entry.remarks || '-',
  });

  const visibleAuditRows = useMemo(() => auditLogRows.map(mapAuditLogToRow), [auditLogRows]);

  const exportAuditCsv = () => {
    const rows = visibleAuditRows.map(row =>
      auditColumns.map(col => `"${String((row as any)[col] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [auditColumns.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'license-audit-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // The import template lives with the import panel so the columns it ships and
  // the columns the panel documents can never drift apart.
  const downloadTemplate = downloadLicenseImportTemplate;

  const printTable = () => window.print();

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const fieldMap: Record<string, string> = {
    'License Number': 'licenseNumber',
    'License Holder Name': 'firstName',
    'Expiry Date': 'validTill',
    'License Status': 'status',
    'Created Date': 'createdAt',
    'Updated Date': 'updatedAt',
    'Issue Date': 'validFrom',
  };

  if (!initialized || isLoading || !checked) {
    return <PageLayoutSkeleton sidebar={false} />;
  }

  return (
    <div className='flex h-screen bg-[#F3F5F8] font-sans antialiased overflow-hidden selection:bg-[#0B1F3A] selection:text-white print:h-auto print:overflow-visible'>
      <Header showCreateForm showBackButton />

      <main
        className='isolate flex-1 ml-0 min-w-0 overflow-auto flex flex-col pt-[54px] md:pt-[58px] print:ml-0 print:pt-0'
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <PageSubHeader
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'License Management', isCurrent: true },
          ]}
          title="License Management"
          metaBadge={`${(tab === 'audit' ? auditLogTotal : (total || stats?.total || 0)).toLocaleString()} Total Records`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Tabs as Pills in SubHeader */}
              <SubHeaderPills<LicenseTab>
                options={[
                  { key: 'all', label: 'All Licenses' },
                  { key: 'expiring', label: 'Expiring' },
                  { key: 'expired', label: 'Expired' },
                  { key: 'import', label: 'Import' },
                  { key: 'audit', label: 'Audit Logs' },
                ]}
                value={tab}
                onChange={nextTab => {
                  if (nextTab === tab) return;
                  setAuditSearchInput('');
                  router.push(buildLicensesUrl({ tab: nextTab, search }), { scroll: false });
                }}
              />

              {tab === 'import' ? (
                <SubHeaderButton
                  variant="primary"
                  onClick={downloadTemplate}
                  title="Download Import Template"
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Template
                </SubHeaderButton>
              ) : tab === 'audit' ? (
                <>
                  <SubHeaderButton
                    onClick={() => { auditQuery.refetch(); }}
                    disabled={auditLogLoading}
                    title="Refresh audit logs"
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${auditLogLoading ? 'animate-spin' : ''}`} />}
                  >
                    Refresh
                  </SubHeaderButton>
                  <SubHeaderButton
                    variant="primary"
                    onClick={exportAuditCsv}
                    title="Export Audit CSV"
                    icon={<FileDown className="w-3.5 h-3.5" />}
                  >
                    Export CSV
                  </SubHeaderButton>
                </>
              ) : (
                <>
                  <SubHeaderButton
                    onClick={() => loadLicenses()}
                    disabled={loading}
                    title="Refresh licenses"
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                  >
                    Refresh
                  </SubHeaderButton>

                  <SubHeaderButton
                    variant="primary"
                    onClick={exportExcel}
                    title="Export Excel"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Excel
                  </SubHeaderButton>
                </>
              )}
            </div>
          }
        />

        <div className='flex-grow p-3 sm:p-4 md:p-6 flex flex-col gap-3 min-h-0'>
        <section className='flex-none grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5 print:hidden'>
          {[
            {
              label: 'Total Licenses',
              value: stats?.total ?? 0,
              icon: ShieldCheck,
              tab: 'all' as LicenseTab,
              status: '',
              color: 'text-[#0B1F3A]',
            },
            {
              label: 'Active Licenses',
              value: stats?.active ?? 0,
              icon: CheckCircle2,
              tab: 'all' as LicenseTab,
              status: 'ACTIVE',
              color: 'text-emerald-600',
            },
            {
              label: 'Expiring in 90 Days',
              value: stats?.expiringWithin90Days ?? 0,
              icon: Clock,
              tab: 'expiring' as LicenseTab,
              days: 90,
              color: 'text-amber-500',
            },
            {
              label: 'Expiring in 60 Days',
              value: stats?.expiringWithin60Days ?? 0,
              icon: Clock,
              tab: 'expiring' as LicenseTab,
              days: 60,
              color: 'text-orange-500',
            },
            {
              label: 'Expiring in 30 Days',
              value: stats?.expiringWithin30Days ?? 0,
              icon: AlertTriangle,
              tab: 'expiring' as LicenseTab,
              days: 30,
              color: 'text-red-500',
            },
            {
              label: 'Expired Licenses',
              value: stats?.expired ?? 0,
              icon: XCircle,
              tab: 'expired' as LicenseTab,
              color: 'text-slate-500',
            },
            {
              label: 'Renewed Licenses',
              value: stats?.renewed ?? 0,
              icon: History,
              tab: 'all' as LicenseTab,
              status: '',
              renewedOnly: true,
              color: 'text-indigo-600',
            },
            {
              label: 'Cancelled Licenses',
              value: stats?.cancelled ?? 0,
              icon: XCircle,
              tab: 'all' as LicenseTab,
              status: 'CANCELLED',
              color: 'text-rose-600',
            },
          ].map(card => {
            const Icon = card.icon;
            const isActiveCard =
              tab === card.tab &&
              (card.status === undefined || statusFilter === card.status) &&
              (card.days === undefined || expiringDays === card.days) &&
              renewedOnly === !!card.renewedOnly;

            return (
              <button
                key={card.label}
                type='button'
                onClick={() => {
                  const target = buildLicensesUrl({
                    tab: card.tab,
                    status: card.status ?? '',
                    days: card.days ?? 90,
                    renewed: !!card.renewedOnly,
                  });
                  setSearchInput('');
                  if (target === buildLicensesUrl(currentUrlState)) return;
                  router.push(target, { scroll: false });
                }}
                aria-pressed={isActiveCard}
                className={`group relative rounded-xl border bg-white p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs text-left flex flex-col justify-between ${
                  isActiveCard
                    ? 'border-[#0B1F3A] ring-2 ring-[#0B1F3A]/20 border-t-3 border-t-[#D4AF37]'
                    : 'border-slate-200 border-t-3 border-t-slate-300 hover:border-slate-300 hover:border-t-[#0B1F3A]'
                }`}
              >
                {/* Icon + Label */}
                <div className='flex items-center justify-between gap-1 w-full'>
                  <span className='text-[11px] font-medium text-slate-600 truncate' title={card.label}>
                    {card.label}
                  </span>
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${card.color}`} />
                </div>

                {/* Value */}
                <div className='mt-1.5 flex items-baseline'>
                  <span className='text-lg font-bold text-[#0B1F3A] tracking-tight'>
                    {Number(card.value).toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })}
        </section>
        <section className='mt-1 flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xs print:flex-none overflow-hidden'>
          {tab === 'import' ? (
            <BulkLicenseImport
              onChanged={() => loadLicenses()}
              onViewLicenses={() => router.push(buildLicensesUrl({ tab: 'all' }), { scroll: false })}
            />
          ) : tab === 'audit' ? (
            <>
              {auditLogError && (
                <div className='flex-none m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                  {auditLogError}
                </div>
              )}

              {/* Audit Toolbar */}
              <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50/70'>
                <div className='flex flex-wrap items-center gap-2 flex-1 min-w-0'>
                  <div className='relative w-full sm:w-60'>
                    <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none' />
                    <input
                      type='text'
                      value={auditSearchInput}
                      onChange={e => setAuditSearchInput(e.target.value)}
                      placeholder='Search audit logs...'
                      className='w-full pl-8 pr-7 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                    />
                    {auditSearchInput && (
                      <button
                        type='button'
                        onClick={() => setAuditSearchInput('')}
                        className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                        aria-label='Clear audit search'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    )}
                  </div>

                  <select
                    value={auditAction}
                    onChange={e => updateUrl({ auditAction: e.target.value, auditPage: 1 })}
                    className='px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                    aria-label='Filter by audit action'
                  >
                    {AUDIT_ACTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <div className='flex items-center gap-1.5 text-xs text-slate-600'>
                    <span className='font-medium text-slate-500'>From:</span>
                    <input
                      type='date'
                      value={auditDateFrom}
                      onChange={e => updateUrl({ auditDateFrom: e.target.value, auditPage: 1 })}
                      max={auditDateTo || undefined}
                      className='px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                      aria-label='From date'
                    />
                    <span className='font-medium text-slate-500'>To:</span>
                    <input
                      type='date'
                      value={auditDateTo}
                      onChange={e => updateUrl({ auditDateTo: e.target.value, auditPage: 1 })}
                      min={auditDateFrom || undefined}
                      className='px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                      aria-label='To date'
                    />
                  </div>

                  {(auditSearch || auditAction || auditDateFrom || auditDateTo) && (
                    <button
                      type='button'
                      onClick={() => {
                        setAuditSearchInput('');
                        updateUrl({ auditSearch: '', auditAction: '', auditDateFrom: '', auditDateTo: '', auditPage: 1 });
                      }}
                      className='inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors'
                    >
                      <X className='w-3 h-3' />
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    type='button'
                    onClick={printTable}
                    title='Print Audit Logs'
                    className='inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all'
                  >
                    <Printer className='w-3.5 h-3.5 text-slate-500' />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-auto isolate'>
                <table className='min-w-[1200px] w-full border-separate border-spacing-0 text-sm'>
                  <thead className='sticky top-0 z-20 bg-[#0B1F3A] text-left text-xs uppercase tracking-wide text-white'>
                    <tr>
                      {auditColumns.map(col => (
                        <th key={col} className='border-b border-[#1A3860] px-3 py-2 font-semibold whitespace-nowrap'>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogLoading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className='animate-pulse'>
                          {auditColumns.map(col => (
                            <td key={col} className='border-b border-slate-100 px-3 py-2'>
                              <div className='h-4 rounded bg-slate-200' />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : auditLogRows.length === 0 ? (
                      <tr>
                        <td colSpan={auditColumns.length} className='px-4 py-16 text-center text-slate-500'>
                          No activity found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      auditLogRows.map(entry => {
                        const row = mapAuditLogToRow(entry);
                        return (
                          <tr key={entry.id} className='group odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/70 transition-colors'>
                            {auditColumns.map(col => (
                              <td
                                key={col}
                                className='border-b border-slate-100 px-3 py-2 align-middle text-xs text-slate-700 whitespace-nowrap'
                              >
                                {col === 'Action' ? (
                                  <span className='inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60'>
                                    {row[col as keyof typeof row]}
                                  </span>
                                ) : (
                                  String(row[col as keyof typeof row] ?? '-')
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className='flex-none flex flex-wrap items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-white text-xs text-slate-600 print:hidden gap-3'>
                <div>
                  Showing <span className='font-semibold text-slate-900'>{auditLogTotal > 0 ? (auditPage - 1) * auditLimit + 1 : 0}</span> to{' '}
                  <span className='font-semibold text-slate-900'>{Math.min(auditPage * auditLimit, auditLogTotal)}</span> of{' '}
                  <span className='font-semibold text-slate-900'>{auditLogTotal}</span> records
                </div>
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    disabled={auditPage <= 1}
                    onClick={() => updateUrl({ auditPage: Math.max(auditPage - 1, 1) })}
                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs'
                  >
                    <ChevronLeft className='h-3.5 w-3.5' />
                    <span>Previous</span>
                  </button>
                  <span className='px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-semibold text-xs'>
                    {auditPage} / {Math.max(Math.ceil(auditLogTotal / auditLimit), 1)}
                  </span>
                  <button
                    type='button'
                    disabled={auditPage >= Math.ceil(auditLogTotal / auditLimit)}
                    onClick={() => updateUrl({ auditPage: auditPage + 1 })}
                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs'
                  >
                    <span>Next</span>
                    <ChevronRight className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {error && (
                <div className='flex-none m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                  {error}
                </div>
              )}

              {/* License Table Filter Toolbar */}
              <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50/70'>
                <div className='flex flex-wrap items-center gap-2 flex-1 min-w-0'>
                  <div className='relative w-full sm:w-64'>
                    <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none' />
                    <input
                      type='text'
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      placeholder='Search name, license no...'
                      className='w-full pl-8 pr-7 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                    />
                    {searchInput && (
                      <button
                        type='button'
                        onClick={() => setSearchInput('')}
                        className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                        aria-label='Clear search'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    )}
                  </div>

                  <select
                    value={statusFilter}
                    onChange={e => updateUrl({ status: e.target.value, page: 1 })}
                    className='px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                    aria-label='Filter by status'
                  >
                    <option value=''>All Statuses</option>
                    <option value='ACTIVE'>Active</option>
                    <option value='EXPIRED'>Expired</option>
                    <option value='CANCELLED'>Cancelled</option>
                    <option value='SUSPENDED'>Suspended</option>
                    <option value='REVOKED'>Revoked</option>
                  </select>

                  <select
                    value={purposeFilter}
                    onChange={e => updateUrl({ purpose: e.target.value, page: 1 })}
                    className='px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                    aria-label='Filter by purpose'
                  >
                    {PURPOSE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {tab === 'all' && (
                    <select
                      value={sourceFilter}
                      onChange={e => updateUrl({ source: e.target.value, page: 1 })}
                      className='px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]'
                      aria-label='Filter by source'
                    >
                      {SOURCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}

                  {(search || statusFilter || purposeFilter || sourceFilter) && (
                    <button
                      type='button'
                      onClick={() => {
                        setSearchInput('');
                        updateUrl({ search: '', status: '', purpose: '', source: '', page: 1 });
                      }}
                      className='inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors'
                    >
                      <X className='w-3 h-3' />
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    type='button'
                    onClick={exportCsv}
                    title='Export CSV'
                    className='inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all'
                  >
                    <FileDown className='w-3.5 h-3.5 text-slate-500' />
                    <span>CSV</span>
                  </button>
                  <button
                    type='button'
                    onClick={printTable}
                    title='Print Table'
                    className='inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all'
                  >
                    <Printer className='w-3.5 h-3.5 text-slate-500' />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-auto isolate'>
                <table className='min-w-[1900px] w-full border-separate border-spacing-0 text-sm'>
                  <thead className='sticky top-0 z-20 bg-[#0B1F3A] text-left text-xs uppercase tracking-wide text-white'>
                    <tr>
                      <th className='sticky left-0 z-30 border-b border-[#1A3860] bg-[#0B1F3A] px-3 py-2 font-semibold w-[56px] min-w-[56px] text-center'>
                        S.No
                      </th>
                      <th className='sticky left-[56px] z-30 border-b border-[#1A3860] bg-[#0B1F3A] px-3 py-2 font-semibold w-[200px] min-w-[200px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.25)]'>
                        <button
                          type='button'
                          onClick={() => handleSort('licenseNumber')}
                          className='inline-flex items-center gap-1.5 text-white hover:text-[#D4AF37] transition-colors focus:outline-none'
                        >
                          <span>License Number</span>
                          {sortBy === 'licenseNumber' ? (
                            sortOrder === 'asc' ? <ArrowUp className='w-3 h-3 text-[#D4AF37]' /> : <ArrowDown className='w-3 h-3 text-[#D4AF37]' />
                          ) : (
                            <ArrowUpDown className='w-3 h-3 text-slate-400 opacity-60' />
                          )}
                        </button>
                      </th>
                      {columns.filter(c => c !== 'License Number').map(col => {
                        const field = fieldMap[col];
                        return (
                          <th
                            key={col}
                            className={`border-b border-[#1A3860] px-3 py-2 font-semibold ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
                          >
                            {field ? (
                              <button
                                type='button'
                                onClick={() => handleSort(field)}
                                className='inline-flex items-center gap-1.5 text-white hover:text-[#D4AF37] transition-colors focus:outline-none'
                              >
                                <span className='whitespace-nowrap'>{col}</span>
                                {sortBy === field ? (
                                  sortOrder === 'asc' ? <ArrowUp className='w-3 h-3 text-[#D4AF37]' /> : <ArrowDown className='w-3 h-3 text-[#D4AF37]' />
                                ) : (
                                  <ArrowUpDown className='w-3 h-3 text-slate-400 opacity-60' />
                                )}
                              </button>
                            ) : (
                              <span className='whitespace-nowrap'>{col}</span>
                            )}
                          </th>
                        );
                      })}
                      {isZS && (
                        <th className='sticky right-0 z-30 border-b border-[#1A3860] bg-[#0B1F3A] px-3 py-2 font-semibold w-[220px] min-w-[220px] text-center shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.25)] print:hidden'>
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, idx) => (
                        <tr key={idx} className='animate-pulse'>
                          <td className='sticky left-0 border-b border-slate-100 bg-white px-3 py-2 w-[56px] min-w-[56px]'>
                            <div className='h-4 rounded bg-slate-200' />
                          </td>
                          <td className='sticky left-[56px] border-b border-slate-100 bg-white px-3 py-2 w-[200px] min-w-[200px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]'>
                            <div className='h-4 rounded bg-slate-200' />
                          </td>
                          {columns.filter(c => c !== 'License Number').map(col => (
                            <td key={col} className={`border-b border-slate-100 px-3 py-2 ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}>
                              <div className='h-4 rounded bg-slate-200' />
                            </td>
                          ))}
                          {isZS && (
                            <td className='sticky right-0 border-b border-slate-100 bg-white px-3 py-2 w-[220px] min-w-[220px] shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] print:hidden'>
                              <div className='h-4 rounded bg-slate-200' />
                            </td>
                          )}
                        </tr>
                      ))
                    ) : licenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length + 1 + (isZS ? 1 : 0)}
                          className='px-4 py-16 text-center text-slate-500'
                        >
                          No licenses found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      licenses.map((license, rowIdx) => {
                        const row = mapLicenseToRow(license);
                        const expiry = getExpiryState(license);
                        const source = getLicenseSource(license);
                        return (
                          <tr
                            key={license.id}
                            className='group odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/70 transition-colors'
                          >
                            <td className='sticky left-0 z-10 border-b border-slate-100 bg-white group-even:bg-[#f8fafc] group-hover:bg-[#eff6ff] px-3 py-2 text-center text-xs font-semibold text-slate-600 w-[56px] min-w-[56px] align-middle'>
                              {(page - 1) * limit + rowIdx + 1}
                            </td>
                            <td className='sticky left-[56px] z-10 border-b border-slate-100 bg-white group-even:bg-[#f8fafc] group-hover:bg-[#eff6ff] px-3 py-2 text-xs font-bold text-[#0B1F3A] w-[200px] min-w-[200px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] align-middle'>
                              <button
                                type='button'
                                onClick={() => openDetails(license)}
                                className='hover:underline hover:text-blue-700 text-left font-mono truncate max-w-full block'
                                title={`View details for ${license.licenseNumber}`}
                              >
                                {license.licenseNumber}
                              </button>
                            </td>
                            {columns.filter(c => c !== 'License Number').map(col => (
                              <td
                                key={col}
                                className={`border-b border-slate-100 px-3 py-2 align-middle text-xs text-slate-700 ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
                              >
                                {col === 'License Status' ? (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${expiry.color}`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${expiry.dot}`} />
                                    {row[col as keyof typeof row]}
                                  </span>
                                ) : col === 'Expiry Date' ? (
                                  <div className='flex items-center gap-1.5 whitespace-nowrap'>
                                    <span>{row[col as keyof typeof row]}</span>
                                    {expiry.label && (
                                      <span
                                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${expiry.color}`}
                                      >
                                        {expiry.label}
                                      </span>
                                    )}
                                  </div>
                                ) : col === 'Created From' ? (
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${source.badge}`}
                                  >
                                    {source.label}
                                  </span>
                                ) : (
                                  <span
                                    className='block truncate'
                                    title={String(row[col as keyof typeof row] ?? '-')}
                                  >
                                    {String(row[col as keyof typeof row] ?? '-')}
                                  </span>
                                )}
                              </td>
                            ))}
                            {isZS && (
                              <td className='sticky right-0 z-10 border-b border-slate-100 bg-white group-even:bg-[#f8fafc] group-hover:bg-[#eff6ff] px-3 py-1.5 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] align-middle text-center print:hidden w-[220px] min-w-[220px]'>
                                <div className='flex items-center justify-center gap-1.5'>
                                  <button
                                    type='button'
                                    onClick={() => openDetails(license)}
                                    className='p-1.5 text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 rounded-md transition-colors'
                                    title='View details'
                                  >
                                    <Eye className='h-4 w-4' />
                                  </button>
                                  {(() => {
                                    const pendingRenewalId = getPendingRenewalId(license);
                                    return (
                                      <div className='relative group/tooltip'>
                                        <button
                                          type='button'
                                          disabled={license.status === 'CANCELLED'}
                                          onClick={() =>
                                            pendingRenewalId
                                              ? router.push(`/renewalApplication/${pendingRenewalId}`)
                                              : router.push(`/forms/renewal?licenseId=${license.id}`)
                                          }
                                          className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors shadow-2xs ${
                                            license.status === 'CANCELLED'
                                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                              : pendingRenewalId
                                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                              : 'bg-[#0B1F3A] text-white hover:bg-[#1A3860]'
                                          }`}
                                        >
                                          {pendingRenewalId ? 'View Renewal' : 'Renewal'}
                                        </button>
                                        {(license.status === 'CANCELLED' || pendingRenewalId) && (
                                          <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50'>
                                            <div className='bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap'>
                                              {license.status === 'CANCELLED'
                                                ? 'This license has been cancelled.'
                                                : 'This license is already in renewal.'}
                                              <div className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900' />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  <div className='relative group/tooltip'>
                                    <button
                                      type='button'
                                      disabled={license.status === 'CANCELLED'}
                                      onClick={() =>
                                        license.cancelApplicationId
                                          ? router.push(`/cancelForm/${license.cancelApplicationId}`)
                                          : router.push(`/cancelForm/new?licenseId=${license.id}`)
                                      }
                                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors shadow-2xs ${
                                        license.status === 'CANCELLED'
                                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                          : license.cancelApplicationId
                                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                                          : 'bg-rose-600 text-white hover:bg-rose-700'
                                      }`}
                                    >
                                      {license.cancelApplicationId ? 'View Cancel' : 'Cancel'}
                                    </button>
                                    {(license.status === 'CANCELLED' || license.cancelApplicationId) && (
                                      <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50'>
                                        <div className='bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap'>
                                          {license.status === 'CANCELLED'
                                            ? 'This license has been cancelled.'
                                            : 'This license is in cancellation.'}
                                          <div className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900' />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className='flex-none flex flex-wrap items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-white text-xs text-slate-600 print:hidden gap-3'>
                <div>
                  Showing <span className='font-semibold text-slate-900'>{total > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
                  <span className='font-semibold text-slate-900'>{Math.min(page * limit, total)}</span> of{' '}
                  <span className='font-semibold text-slate-900'>{total}</span> records
                </div>
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    disabled={page <= 1}
                    onClick={() => updateUrl({ page: Math.max(page - 1, 1) })}
                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs'
                  >
                    <ChevronLeft className='h-3.5 w-3.5' />
                    <span>Previous</span>
                  </button>
                  <span className='px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-semibold text-xs'>
                    {page} / {Math.max(Math.ceil(total / limit), 1)}
                  </span>
                  <button
                    type='button'
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => updateUrl({ page: page + 1 })}
                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs'
                  >
                    <span>Next</span>
                    <ChevronRight className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
        </div>
        <Footer />
      </main>

    </div>
  );
}

export default function LicenseManagementPage() {
  return (
    <LayoutProvider initialShowSidebar={false}>
      <Suspense fallback={<PageLayoutSkeleton sidebar={false} />}>
        <LicenseManagementContent />
      </Suspense>
    </LayoutProvider>
  );
}
