'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ban,
  Download,
  Eye,
  FileDown,
  History,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import LicenseService from '@/services/licenseService';
import { LicenseData, LicenseStatistics } from '@/types';
import { normalizeRole } from '@/utils/roleUtils';
import { getRoleBasedRedirectPath } from '@/config/roleRedirections';
import { LayoutProvider, useLayout } from '@/config/layoutContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PageSubHeader, SubHeaderButton, SubHeaderSearch, SubHeaderPills, SubHeaderSelect } from '@/components/common/PageSubHeader';
import BulkLicenseImport, { downloadLicenseImportTemplate } from '@/components/licenses/BulkLicenseImport';
import { PageLayoutSkeleton } from '@/components/Skeleton';

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
  'Father/Guardian Name',
  'Address',
  'Weapon Type',
  'Weapon Details',
  'License Purpose',
  'Issue Date',
  'Current Workflow Status',
  'Created From',
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

/**
 * Prefer the name resolved by the API, then a raw name field, and only fall back
 * to the stored id so a stale id (e.g. a district that no longer exists) is at
 * least visible rather than silently blank.
 */
const locationValue = (name?: string | null, id?: number | null, label = 'Record') =>
  name || (id != null ? `${label} #${id}` : undefined);

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

function LicenseManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole, isAuthenticated, isLoading, initialized } = useAuth();
  const { setShowSidebar, headerHeight } = useLayout();
  const [checked, setChecked] = useState(false);

  const initialTab = (() => {
    const value = searchParams?.get('tab') as LicenseTab | null;
    return value && VALID_TABS.includes(value) ? value : 'all';
  })();

  const [tab, setTab] = useState<LicenseTab>(initialTab);
  const [selectedLicense, setSelectedLicense] = useState<LicenseData | null>(null);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || '');
  const [purposeFilter, setPurposeFilter] = useState(searchParams?.get('purpose') || '');
  const [sourceFilter, setSourceFilter] = useState(searchParams?.get('source') || '');
  const [expiringDays, setExpiringDays] = useState(Number(searchParams?.get('days')) || 90);
  const [renewedOnly, setRenewedOnly] = useState(searchParams?.get('renewed') === 'true');
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [sortBy, setSortBy] = useState('validTill');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  const [auditSearch, setAuditSearch] = useState(searchParams?.get('auditSearch') || '');
  const [auditAction, setAuditAction] = useState(searchParams?.get('auditAction') || '');
  const [auditDateFrom, setAuditDateFrom] = useState(searchParams?.get('dateFrom') || '');
  const [auditDateTo, setAuditDateTo] = useState(searchParams?.get('dateTo') || '');
  const [auditPage, setAuditPage] = useState(Number(searchParams?.get('auditPage')) || 1);
  const auditLimit = 10;

  const role = useMemo(() => normalizeRole(userRole), [userRole]);
  const canAccess = role ? LICENSE_ROLES.has(role) : false;

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

  const licenses = licensesQuery.data?.data ?? [];
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

  const auditLogRows = auditQuery.data?.data ?? [];
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

  // Keep the URL mirroring in-tab filter tweaks (search keystrokes, pagination,
  // status/purpose changes) without spamming browser history — tab/card clicks push
  // their own history entry explicitly (see onClick handlers below) so Back/Forward
  // can still step between tabs.
  useEffect(() => {
    const url = buildLicensesUrl({
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
    });
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tab,
    statusFilter,
    purposeFilter,
    sourceFilter,
    renewedOnly,
    expiringDays,
    search,
    page,
    auditSearch,
    auditAction,
    auditDateFrom,
    auditDateTo,
    auditPage,
  ]);

  // Restore state when the user navigates via browser Back/Forward.
  useEffect(() => {
    const nextTab = (searchParams?.get('tab') as LicenseTab | null) || 'all';
    if (VALID_TABS.includes(nextTab)) setTab(nextTab);
    setStatusFilter(searchParams?.get('status') || '');
    setPurposeFilter(searchParams?.get('purpose') || '');
    setSourceFilter(searchParams?.get('source') || '');
    setRenewedOnly(searchParams?.get('renewed') === 'true');
    setExpiringDays(Number(searchParams?.get('days')) || 90);
    setSearch(searchParams?.get('search') || '');
    setPage(Number(searchParams?.get('page')) || 1);
    setAuditSearch(searchParams?.get('auditSearch') || '');
    setAuditAction(searchParams?.get('auditAction') || '');
    setAuditDateFrom(searchParams?.get('dateFrom') || '');
    setAuditDateTo(searchParams?.get('dateTo') || '');
    setAuditPage(Number(searchParams?.get('auditPage')) || 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openDetails = async (license: LicenseData) => {
    // Use the row data from the /licenses list response as-is — it already has
    // every field the drawer needs. (The /licenses/:id detail endpoint returns a
    // differently-shaped "source application" record that leaves most license
    // fields blank, so we deliberately don't fetch or merge it here.)
    setSelectedLicense(license);
    const audit = await LicenseService.getLicenseAudit(license.id);
    setAuditRows(audit);
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

  if (!initialized || isLoading || !checked) {
    return <PageLayoutSkeleton />;
  }

  return (
    <div className='flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white print:h-auto print:overflow-visible'>
      <Header showCreateForm showBackButton />

      <main
        className='isolate flex-1 ml-0 min-w-0 overflow-auto flex flex-col pt-[52px] md:pt-[66px] print:ml-0 print:pt-0'
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <PageSubHeader
          title="License Management"
          metaBadge={`${total || stats?.total || 0} Total Records`}
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
                  setTab(nextTab);
                  setStatusFilter('');
                  setPurposeFilter('');
                  setSourceFilter('');
                  setExpiringDays(90);
                  setRenewedOnly(false);
                  setPage(1);
                  setAuditSearch('');
                  setAuditAction('');
                  setAuditDateFrom('');
                  setAuditDateTo('');
                  setAuditPage(1);
                  router.push(buildLicensesUrl({ tab: nextTab, search }), { scroll: false });
                }}
              />

              {tab === 'audit' ? (
                <>
                  <SubHeaderSearch
                    value={auditSearch}
                    onChange={val => {
                      setAuditSearch(val);
                      setAuditPage(1);
                    }}
                    placeholder="Search audit logs..."
                  />

                  <SubHeaderSelect
                    value={auditAction}
                    onChange={val => {
                      setAuditAction(val);
                      setAuditPage(1);
                    }}
                    options={AUDIT_ACTION_OPTIONS}
                  />

                  <input
                    type="date"
                    value={auditDateFrom}
                    onChange={event => {
                      setAuditDateFrom(event.target.value);
                      setAuditPage(1);
                    }}
                    max={auditDateTo || undefined}
                    className="rounded-lg bg-[#1E3A8A]/40 border border-[#3B82F6]/30 px-2 py-1 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    aria-label="From date"
                    title="From date"
                  />

                  <input
                    type="date"
                    value={auditDateTo}
                    onChange={event => {
                      setAuditDateTo(event.target.value);
                      setAuditPage(1);
                    }}
                    min={auditDateFrom || undefined}
                    className="rounded-lg bg-[#1E3A8A]/40 border border-[#3B82F6]/30 px-2 py-1 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    aria-label="To date"
                    title="To date"
                  />

                  <SubHeaderButton
                    onClick={exportAuditCsv}
                    title="Export Audit CSV"
                    icon={<FileDown className="w-3.5 h-3.5" />}
                  >
                    CSV
                  </SubHeaderButton>

                  <SubHeaderButton
                    onClick={printTable}
                    title="Print"
                    icon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print
                  </SubHeaderButton>
                </>
              ) : tab === 'import' ? (
                <SubHeaderButton
                  variant="primary"
                  onClick={downloadTemplate}
                  title="Download Import Template"
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Template
                </SubHeaderButton>
              ) : (
                <>
                  {/* Search Bar in SubHeader */}
                  <SubHeaderSearch
                    value={search}
                    onChange={val => {
                      setSearch(val);
                      setPage(1);
                    }}
                    placeholder="Search name, license no..."
                  />

                  {/* Status Dropdown in SubHeader */}
                  <SubHeaderSelect
                    value={statusFilter}
                    onChange={val => {
                      setStatusFilter(val);
                      setPage(1);
                    }}
                    options={[
                      { value: '', label: 'All Status' },
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'EXPIRED', label: 'Expired' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                      { value: 'SUSPENDED', label: 'Suspended' },
                      { value: 'REVOKED', label: 'Revoked' },
                    ]}
                  />

                  <SubHeaderSelect
                    value={purposeFilter}
                    onChange={val => {
                      setPurposeFilter(val);
                      setPage(1);
                    }}
                    options={PURPOSE_OPTIONS}
                  />

                  {tab === 'all' && (
                    <SubHeaderSelect
                      value={sourceFilter}
                      onChange={val => {
                        setSourceFilter(val);
                        setPage(1);
                      }}
                      options={SOURCE_OPTIONS}
                    />
                  )}

                  {/* Refresh Button */}
                  <SubHeaderButton
                    onClick={() => loadLicenses()}
                    disabled={loading}
                    title="Refresh licenses"
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                  >
                    Refresh
                  </SubHeaderButton>

                  {/* Export Excel Button */}
                  <SubHeaderButton
                    variant="primary"
                    onClick={exportExcel}
                    title="Export Excel"
                    icon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Excel
                  </SubHeaderButton>

                  <SubHeaderButton
                    onClick={exportCsv}
                    title="Export CSV"
                    icon={<FileDown className="w-3.5 h-3.5" />}
                  >
                    CSV
                  </SubHeaderButton>

                  <SubHeaderButton
                    onClick={printTable}
                    title="Print Table"
                    icon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print
                  </SubHeaderButton>
                </>
              )}
            </div>
          }
        />

        <div className='flex-grow p-3 sm:p-4 md:p-6 flex flex-col gap-4 min-h-0'>
        <section className='flex-none grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 print:hidden'>
          {[
            {
              label: 'Total Licenses',
              value: stats?.total ?? 0,
              icon: ShieldCheck,
              tab: 'all' as LicenseTab,
              status: '',
              color: 'text-[#001F54]',
            },
            {
              label: 'Active Licenses',
              value: stats?.active ?? 0,
              icon: CheckCircle2,
              tab: 'all' as LicenseTab,
              status: 'ACTIVE',
              color: 'text-green-600',
            },
            {
              label: 'Expiring in 90 Days',
              value: stats?.expiringWithin90Days ?? 0,
              icon: Clock,
              tab: 'expiring' as LicenseTab,
              days: 90,
              color: 'text-orange-500',
            },
            {
              label: 'Expiring in 60 Days',
              value: stats?.expiringWithin60Days ?? 0,
              icon: Clock,
              tab: 'expiring' as LicenseTab,
              days: 60,
              color: 'text-amber-500',
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
              color: 'text-gray-500',
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
                  setTab(card.tab);
                  setStatusFilter(card.status ?? '');
                  setExpiringDays(card.days ?? 90);
                  setRenewedOnly(!!card.renewedOnly);
                  setPurposeFilter('');
                  setSourceFilter('');
                  setSearch('');
                  setPage(1);
                  router.push(
                    buildLicensesUrl({
                      tab: card.tab,
                      status: card.status ?? '',
                      days: card.days ?? 90,
                      renewed: !!card.renewedOnly,
                    }),
                    { scroll: false }
                  );
                }}
                aria-pressed={isActiveCard}
                className={`group rounded-lg border bg-white p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isActiveCard
                    ? 'border-[#001F54] border-t-4 ring-1 ring-[#001F54]'
                    : 'border-gray-200 border-t-4 border-t-[#001F54]'
                }`}
              >
                {/* Icon + Label */}
                <div className='flex items-center gap-1.5'>
                  <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                  <span className='text-xs font-medium text-gray-600'>{card.label}</span>
                </div>

                {/* Centered Value */}
                <div className='mt-0.5 flex justify-center'>
                  <span className='text-xl font-bold text-[#001F54]'>{card.value}</span>
                </div>
              </button>
            );
          })}
        </section>
        <section className='mt-2 flex-1 min-h-0 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden print:flex-none'>
          {tab === 'import' ? (
            <BulkLicenseImport
              onChanged={() => loadLicenses()}
              onViewLicenses={() => {
                setTab('all');
                setStatusFilter('');
                setPurposeFilter('');
                setRenewedOnly(false);
                setPage(1);
                router.push(buildLicensesUrl({ tab: 'all' }), { scroll: false });
              }}
            />
          ) : tab === 'audit' ? (
            <>
              {auditLogError && (
                <div className='flex-none m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                  {auditLogError}
                </div>
              )}

              <div className='flex-1 min-h-0 overflow-auto isolate'>
                <table className='min-w-[1200px] w-full border-separate border-spacing-0 text-sm'>
                  <thead className='sticky top-0 z-10 bg-[#001F54] text-left text-xs uppercase tracking-wide text-white'>
                    <tr>
                      {auditColumns.map(col => (
                        <th key={col} className='border-b border-[#001F54] px-3 py-3 font-semibold whitespace-nowrap'>
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
                            <td key={col} className='border-b px-3 py-3'>
                              <div className='h-4 rounded bg-gray-200' />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : auditLogRows.length === 0 ? (
                      <tr>
                        <td colSpan={auditColumns.length} className='px-3 py-12 text-center text-gray-500'>
                          No activity found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      auditLogRows.map(entry => {
                        const row = mapAuditLogToRow(entry);
                        return (
                          <tr key={entry.id} className='odd:bg-white even:bg-gray-50 hover:bg-blue-50/70'>
                            {auditColumns.map(col => (
                              <td
                                key={col}
                                className='border-b border-gray-100 px-3 py-3 align-top text-gray-700 whitespace-nowrap'
                              >
                                {col === 'Action' ? (
                                  <span className='inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700'>
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

              <div className='flex-none flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600 print:hidden'>
                <span>
                  Showing page {auditPage} of {Math.max(Math.ceil(auditLogTotal / auditLimit), 1)} ({auditLogTotal} records)
                </span>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                    className='rounded-md border px-3 py-2 disabled:opacity-50'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    disabled={auditPage >= Math.ceil(auditLogTotal / auditLimit)}
                    onClick={() => setAuditPage(prev => prev + 1)}
                    className='rounded-md border px-3 py-2 disabled:opacity-50'
                  >
                    <ChevronRight className='h-4 w-4' />
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

              <div className='flex-1 min-h-0 overflow-x-auto overflow-y-hidden isolate'>
                <table className='min-w-[1900px] w-full border-separate border-spacing-0 text-sm'>
                  <thead className='sticky top-0 z-10 bg-[#001F54] text-left text-xs uppercase tracking-wide text-white'>
                    <tr>
                      {columns.map(col => (
                        <th
                          key={col}
                          className={`border-b border-[#001F54] px-3 py-1.5 font-semibold ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
                        >
                          <button
                            type='button'
                            onClick={() => {
                              const fieldMap: Record<string, string> = {
                                'License ID': 'id',
                                'License Number': 'licenseNumber',
                                'License Holder Name': 'firstName',
                                'Expiry Date': 'validTill',
                                'License Status': 'status',
                                'Created Date': 'createdAt',
                                'Updated Date': 'updatedAt',
                              };
                              if (!fieldMap[col]) return;
                              setSortBy(fieldMap[col]);
                              setSortOrder(prev =>
                                sortBy === fieldMap[col] && prev === 'asc' ? 'desc' : 'asc'
                              );
                            }}
                            className='whitespace-nowrap'
                          >
                            {col}
                          </button>
                        </th>
                      ))}
                      <th className='sticky right-0 border-b border-[#001F54] bg-[#001F54] px-3 py-2 font-semibold print:hidden'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, idx) => (
                        <tr key={idx} className='animate-pulse'>
                          {columns.slice(0, 8).map(col => (
                            <td
                              key={col}
                              className={`border-b px-3 py-1.5 ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
                            >
                              <div className='h-4 rounded bg-gray-200' />
                            </td>
                          ))}
                          <td className='sticky right-0 border-b bg-white px-3 py-1.5 print:hidden'>
                            <div className='h-4 rounded bg-gray-200' />
                          </td>
                        </tr>
                      ))
                    ) : licenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className='px-3 py-12 text-center text-gray-500'
                        >
                          No licenses found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      licenses.map(license => {
                        const row = mapLicenseToRow(license);
                        const expiry = getExpiryState(license);
                        const source = getLicenseSource(license);
                        return (
                          <tr
                            key={license.id}
                            className='odd:bg-white even:bg-gray-50 hover:bg-blue-50/70'
                          >
                            {columns.map(col => (
                              <td
                                key={col}
                                className={`border-b border-gray-100 px-3 py-1.5 align-middle text-gray-700 ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
                              >
                                {col === 'License Status' ? (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${expiry.color}`}
                                  >
                                    <span className={`h-2 w-2 rounded-full ${expiry.dot}`} />
                                    {row[col as keyof typeof row]}
                                  </span>
                                ) : col === 'Expiry Date' ? (
                                  <div className='flex items-center gap-1.5 whitespace-nowrap'>
                                    <span>{row[col as keyof typeof row]}</span>
                                    <span
                                      className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] ${expiry.color}`}
                                    >
                                      {expiry.label}
                                    </span>
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
                            <td className='sticky right-0 border-b border-gray-100 bg-inherit px-3 py-1.5 print:hidden'>
                              <div className='flex items-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() => openDetails(license)}
                                  className='rounded-md border p-1.5 text-gray-700 hover:bg-white'
                                  title='View details'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                                <div className='relative group'>
                                  <button
                                    type='button'
                                    disabled={license.status === 'CANCELLED'}
                                    onClick={() =>
                                      license.renewalApplicationId
                                        ? router.push(`/renewalApplication/${license.renewalApplicationId}`)
                                        : router.push(`/forms/renewal?licenseId=${license.id}`)
                                    }
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                      license.status === 'CANCELLED'
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : license.renewalApplicationId
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-[#001F54] text-white hover:bg-[#012a73]'
                                    }`}
                                  >
                                    {license.renewalApplicationId ? 'View Renewal' : 'Renewal'}
                                  </button>
                                  {(license.status === 'CANCELLED' || license.renewalApplicationId) && (
                                    <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50'>
                                      <div className='bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap'>
                                        {license.status === 'CANCELLED'
                                          ? 'This license has been cancelled. No further actions are allowed.'
                                          : 'This license is already in the renewal process.'}
                                        <div className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900' />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className='relative group'>
                                  <button
                                    type='button'
                                    disabled={license.status === 'CANCELLED'}
                                    onClick={() =>
                                      license.cancelApplicationId
                                        ? router.push(`/cancelForm/${license.cancelApplicationId}`)
                                        : router.push(`/cancelForm/new?licenseId=${license.id}`)
                                    }
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                      license.status === 'CANCELLED'
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : license.cancelApplicationId
                                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                  >
                                    {license.cancelApplicationId ? 'View Cancel' : 'Cancel'}
                                  </button>
                                  {(license.status === 'CANCELLED' || license.cancelApplicationId) && (
                                    <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50'>
                                      <div className='bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap'>
                                        {license.status === 'CANCELLED'
                                          ? 'This license has been cancelled. No further actions are allowed.'
                                          : 'This license is already in the cancellation process.'}
                                        <div className='absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900' />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className='flex-none flex items-center justify-between border-t border-gray-200 px-4 py-1 text-sm text-gray-600 print:hidden'>
                <span>
                  Showing page {page} of {Math.max(Math.ceil(total / limit), 1)} ({total} records)
                </span>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={page <= 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className='rounded-md border px-3 py-1.5 disabled:opacity-50'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => setPage(prev => prev + 1)}
                    className='rounded-md border px-3 py-1.5 disabled:opacity-50'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
        </div>
        <Footer />
      </main>

      {selectedLicense && (
        <div
          className='fixed inset-0 z-[100] flex items-start justify-end bg-black/40 print:hidden'
          onClick={() => setSelectedLicense(null)}
        >
          <aside
            className='h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl md:rounded-l-2xl'
            onClick={event => event.stopPropagation()}
          >
            <div className='sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {getFullName(selectedLicense)}
                </h2>
                <p className='text-sm text-gray-500'>{selectedLicense.licenseNumber}</p>
              </div>
              <button
                type='button'
                onClick={() => setSelectedLicense(null)}
                className='rounded-md border px-3 py-2 text-sm'
              >
                Close
              </button>
            </div>
            <div className='space-y-5 p-6'>
              {[
                [
                  'Personal Details',
                  [
                    ['License ID', selectedLicense.id],
                    ['Name', getFullName(selectedLicense)],
                    ['Father/Guardian', selectedLicense.parentOrSpouseName],
                    ['Gender', selectedLicense.sex],
                    ['Date of Birth', formatDate(selectedLicense.dateOfBirth)],
                    ['Aadhar', selectedLicense.aadharNumber],
                    ['PAN', selectedLicense.panNumber],
                  ],
                ],
                [
                  'Present Address',
                  [
                    ['Address', selectedLicense.presentAddressLine],
                    ['State', locationValue(selectedLicense.presentStateName, selectedLicense.presentStateId, 'State')],
                    ['District', locationValue(selectedLicense.presentDistrictName, selectedLicense.presentDistrictId, 'District')],
                    ['Police Station', locationValue(selectedLicense.presentPoliceStationName, selectedLicense.presentPoliceStationId, 'Police Station')],
                    ['Range Office', locationValue(selectedLicense.presentRangeOfficeName, selectedLicense.presentRangeOfficeId, 'Range Office')],
                    ['Zone', locationValue(selectedLicense.presentZoneName, selectedLicense.presentZoneId, 'Zone')],
                    ['Division', locationValue(selectedLicense.presentDivisionName, selectedLicense.presentDivisionId, 'Division')],
                  ],
                ],
                [
                  'Permanent Address',
                  [
                    ['Address', selectedLicense.permanentAddressLine],
                    ['State', locationValue(selectedLicense.permanentStateName, selectedLicense.permanentStateId, 'State')],
                    ['District', locationValue(selectedLicense.permanentDistrictName, selectedLicense.permanentDistrictId, 'District')],
                    ['Police Station', locationValue(selectedLicense.permanentPoliceStationName, selectedLicense.permanentPoliceStationId, 'Police Station')],
                    ['Range Office', locationValue(selectedLicense.permanentRangeOfficeName, selectedLicense.permanentRangeOfficeId, 'Range Office')],
                    ['Zone', locationValue(selectedLicense.permanentZoneName, selectedLicense.permanentZoneId, 'Zone')],
                    ['Division', locationValue(selectedLicense.permanentDivisionName, selectedLicense.permanentDivisionId, 'Division')],
                  ],
                ],
                [
                  'Weapon Details',
                  [
                    ['Weapon Type', selectedLicense.armsCategory],
                    [
                      'Weapon Details',
                      selectedLicense.endorsedWeapons?.map(w => w.name).join(', '),
                    ],
                    ['Ammunition', selectedLicense.ammunitionDescription],
                  ],
                ],
                [
                  'License Information',
                  [
                    ['License Number', selectedLicense.licenseNumber],
                    [
                      'Issue Date',
                      formatDate(selectedLicense.issueDate || selectedLicense.validFrom),
                    ],
                    ['Expiry Date', formatDate(selectedLicense.validTill)],
                    ['Purpose', selectedLicense.needForLicense],
                    ['Status', selectedLicense.status],
                    ['Created From', getLicenseSource(selectedLicense).label],
                  ],
                ],
              ].map(([title, fields]) => (
                <section key={String(title)} className='rounded-lg border border-gray-200'>
                  <h3 className='border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900'>
                    {String(title)}
                  </h3>
                  <dl className='grid grid-cols-1 gap-px bg-gray-100 sm:grid-cols-2'>
                    {(fields as any[]).map(([label, value]) => (
                      <div key={label} className='bg-white px-4 py-3'>
                        <dt className='text-xs font-medium uppercase text-gray-500'>{label}</dt>
                        <dd className='mt-1 text-sm text-gray-900'>{value || '-'}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}

              <section className='rounded-lg border border-gray-200'>
                <h3 className='border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900'>
                  Workflow History & Audit Timeline
                </h3>
                <div className='divide-y'>
                  {(auditRows.length ? auditRows : selectedLicense.workflowHistories || []).map(
                    (entry: any) => (
                      <div key={entry.id} className='px-4 py-3'>
                        <div className='flex items-center justify-between gap-3'>
                          <span className='font-medium text-gray-900'>
                            {entry.event || entry.action || entry.newStatus || 'Activity'}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className='mt-1 text-sm text-gray-600'>{entry.remarks || '-'}</p>
                        <p className='mt-1 text-xs text-gray-500'>
                          Officer:{' '}
                          {entry.officer || entry.changedByUser?.username || entry.changedBy || '-'}
                        </p>
                      </div>
                    )
                  )}
                  {!auditRows.length && !selectedLicense.workflowHistories?.length && (
                    <div className='px-4 py-6 text-sm text-gray-500'>
                      No audit activity found for this license.
                    </div>
                  )}
                </div>
              </section>

              <section className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                <h3 className='text-sm font-semibold text-gray-900'>Raw License Information</h3>
                <pre className='mt-3 max-h-80 overflow-auto rounded-md bg-gray-950 p-4 text-xs text-gray-100'>
                  {JSON.stringify(selectedLicense, null, 2)}
                </pre>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function LicenseManagementPage() {
  return (
    <LayoutProvider>
      <Suspense fallback={<PageLayoutSkeleton />}>
        <LicenseManagementContent />
      </Suspense>
    </LayoutProvider>
  );
}
