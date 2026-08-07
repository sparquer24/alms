'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Upload,
  XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import LicenseService from '@/services/licenseService';
import { LicenseData, LicenseStatistics } from '@/types';
import { normalizeRole } from '@/utils/roleUtils';
import { getRoleBasedRedirectPath } from '@/config/roleRedirections';
import { useLayout } from '@/config/layoutContext';
import Header from '@/components/Header';

type LicenseTab = 'all' | 'expiring' | 'expired' | 'import' | 'audit';

const LICENSE_ROLES = new Set(['ZS', 'DCP', 'CP', 'JTCP', 'ARMS_SUPDT', 'ARMS_SEAT', 'ACO']);

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
  'License ID',
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
  'License ID': 'w-[90px] min-w-[90px]',
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
  'License ID': license.id,
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
  'Created From': license.freshApplicationId ? 'Fresh Application' : 'Imported',
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
  const { setShowSidebar } = useLayout();
  const [checked, setChecked] = useState(false);

  const initialTab = (() => {
    const value = searchParams?.get('tab') as LicenseTab | null;
    return value && VALID_TABS.includes(value) ? value : 'all';
  })();

  const [tab, setTab] = useState<LicenseTab>(initialTab);
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [stats, setStats] = useState<LicenseStatistics | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<LicenseData | null>(null);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || '');
  const [purposeFilter, setPurposeFilter] = useState(searchParams?.get('purpose') || '');
  const [expiringDays, setExpiringDays] = useState(Number(searchParams?.get('days')) || 90);
  const [renewedOnly, setRenewedOnly] = useState(searchParams?.get('renewed') === 'true');
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('validTill');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  const [auditSearch, setAuditSearch] = useState(searchParams?.get('auditSearch') || '');
  const [auditAction, setAuditAction] = useState(searchParams?.get('auditAction') || '');
  const [auditDateFrom, setAuditDateFrom] = useState(searchParams?.get('dateFrom') || '');
  const [auditDateTo, setAuditDateTo] = useState(searchParams?.get('dateTo') || '');
  const [auditPage, setAuditPage] = useState(Number(searchParams?.get('auditPage')) || 1);
  const [auditLogRows, setAuditLogRows] = useState<any[]>([]);
  const [auditLogTotal, setAuditLogTotal] = useState(0);
  const [auditLogLoading, setAuditLogLoading] = useState(false);
  const [auditLogError, setAuditLogError] = useState<string | null>(null);
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

  const loadLicenses = useCallback(async () => {
    if (!checked) return;
    if (tab === 'import' || tab === 'audit') {
      // These tabs don't render the license table, so skip the list fetch — the
      // dashboard stat cards (fetched below) still need to stay current though.
      LicenseService.getLicenseDashboard()
        .then(dashboard => {
          if (dashboard) setStats(dashboard);
        })
        .catch(() => {
          setStats(prev => prev);
        });
      return;
    }
    try {
      setLoading(true);
      setError(null);

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
              renewedOnly,
              orderBy: sortBy,
              order: sortOrder,
            });

      const normalizedList = coerceLicenseList(list);
      setLicenses(normalizedList.data);
      setTotal(normalizedList.total);

      LicenseService.getLicenseDashboard()
        .then(dashboard => {
          if (dashboard) setStats(dashboard);
        })
        .catch(() => {
          setStats(prev => prev);
        });
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load licenses.');
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  }, [checked, expiringDays, limit, page, purposeFilter, renewedOnly, search, sortBy, sortOrder, statusFilter, tab]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const loadAuditLogs = useCallback(async () => {
    if (!checked || tab !== 'audit') return;
    try {
      setAuditLogLoading(true);
      setAuditLogError(null);
      const list = await LicenseService.getLicenseAuditLogs({
        page: auditPage,
        limit: auditLimit,
        search: auditSearch,
        action: auditAction || undefined,
        dateFrom: auditDateFrom || undefined,
        dateTo: auditDateTo || undefined,
      });
      const normalized = coerceLicenseList(list);
      setAuditLogRows(normalized.data);
      setAuditLogTotal(normalized.total);
    } catch (loadError: any) {
      setAuditLogError(loadError?.message || 'Failed to load audit logs.');
      setAuditLogRows([]);
    } finally {
      setAuditLogLoading(false);
    }
  }, [checked, tab, auditPage, auditLimit, auditSearch, auditAction, auditDateFrom, auditDateTo]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const buildLicensesUrl = (state: {
    tab: LicenseTab;
    status?: string;
    purpose?: string;
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

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        licenseNumber: '',
        firstName: '',
        lastName: '',
        parentOrSpouseName: '',
        mobileNumber: '',
        email: '',
        presentAddressLine: '',
        district: '',
        armsCategory: '',
        ammunitionDescription: '',
        needForLicense: '',
        issueDate: '',
        validTill: '',
        status: 'ACTIVE',
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');
    XLSX.writeFile(workbook, 'license-import-template.xlsx');
  };

  const printTable = () => window.print();

  if (!initialized || isLoading || !checked) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#001F54] mx-auto mb-4' />
          <p className='text-sm text-gray-600'>Loading License Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-screen w-full overflow-hidden bg-[#F5F7FB] font-[family-name:var(--font-geist-sans)] print:h-auto print:overflow-visible'>
      <Header showCreateForm showBackButton />

      <main className='flex h-[calc(100vh-64px)] md:h-[calc(100vh-90px)] flex-col overflow-hidden mt-[64px] md:mt-[90px] p-4 sm:p-6 md:px-4 print:mt-0 print:h-auto print:overflow-visible print:p-0'>
        <section className='flex-none grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 print:hidden'>
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
                className={`group rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                  isActiveCard
                    ? 'border-[#001F54] border-t-4 ring-1 ring-[#001F54]'
                    : 'border-gray-200 border-t-4 border-t-[#001F54]'
                }`}
              >
                {/* Icon + Label */}
                <div className='flex items-center gap-2'>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                  <span className='text-sm font-medium text-gray-600'>{card.label}</span>
                </div>

                {/* Centered Value */}
                <div className='mt-2 flex justify-center'>
                  <span className='text-3xl font-bold text-[#001F54]'>{card.value}</span>
                </div>
              </button>
            );
          })}
        </section>
        <section className='mt-6 flex-1 min-h-0 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden print:flex-none'>
          <div className='flex-none flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 print:hidden'>
            {[
              ['all', 'All Licenses'],
              ['expiring', 'Expiring Licenses'],
              ['expired', 'Expired Licenses'],
              ['import', 'Import Licenses'],
              ['audit', 'Audit & Activity Logs'],
            ].map(([key, label]) => (
              <button
                key={key}
                type='button'
                onClick={() => {
                  const nextTab = key as LicenseTab;
                  setTab(nextTab);
                  // Switching tabs directly (not via a stat card) starts from a clean
                  // slate so a stale status/purpose/expiry/renewed filter from a previous
                  // card click can't silently keep narrowing results on the new tab.
                  // Search is preserved since it's a cross-cutting filter valid on every tab.
                  setStatusFilter('');
                  setPurposeFilter('');
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
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  tab === key ? 'bg-[#001F54] text-white' : 'text-gray-700 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'import' ? (
            <div className='flex-1 min-h-0 overflow-auto p-6'>
              <div className='rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center'>
                <Upload className='mx-auto h-10 w-10 text-gray-400' />
                <h2 className='mt-3 text-lg font-semibold text-gray-900'>Bulk License Import</h2>
                <p className='mx-auto mt-2 max-w-2xl text-sm text-gray-500'>
                  CSV/XLSX import requires backend validation, duplicate detection, preview, partial
                  success reporting, and rollback support. The template is available now; upload
                  processing should be enabled when `POST /licenses/import` is implemented.
                </p>
                <button
                  type='button'
                  onClick={downloadTemplate}
                  className='mt-5 inline-flex items-center gap-2 rounded-md bg-[#001F54] px-4 py-2 text-sm font-medium text-white hover:bg-[#012a73]'
                >
                  <Download className='h-4 w-4' />
                  Download Template
                </button>
              </div>
            </div>
          ) : tab === 'audit' ? (
            <>
              <div className='flex-none grid gap-3 border-b border-gray-200 px-4 py-3 lg:grid-cols-[1fr_160px_160px_160px_auto] print:hidden'>
                <div className='relative'>
                  <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                  <input
                    value={auditSearch}
                    onChange={event => {
                      setAuditSearch(event.target.value);
                      setAuditPage(1);
                    }}
                    placeholder='Search by license number, holder name, officer...'
                    className='w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#001F54] focus:outline-none focus:ring-1 focus:ring-[#001F54]'
                  />
                </div>
                <select
                  value={auditAction}
                  onChange={event => {
                    setAuditAction(event.target.value);
                    setAuditPage(1);
                  }}
                  className='rounded-md border border-gray-300 px-3 py-2 text-sm'
                >
                  {AUDIT_ACTION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type='date'
                  value={auditDateFrom}
                  onChange={event => {
                    setAuditDateFrom(event.target.value);
                    setAuditPage(1);
                  }}
                  max={auditDateTo || undefined}
                  className='rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700'
                  aria-label='From date'
                />
                <input
                  type='date'
                  value={auditDateTo}
                  onChange={event => {
                    setAuditDateTo(event.target.value);
                    setAuditPage(1);
                  }}
                  min={auditDateFrom || undefined}
                  className='rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700'
                  aria-label='To date'
                />
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={exportAuditCsv}
                    className='rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                    title='Export CSV'
                  >
                    <FileDown className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={printTable}
                    className='rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                    title='Print'
                  >
                    <Printer className='h-4 w-4' />
                  </button>
                </div>
              </div>

              {auditLogError && (
                <div className='flex-none m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                  {auditLogError}
                </div>
              )}

              <div className='flex-1 min-h-0 overflow-auto'>
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
              <div className='flex-none grid gap-3 border-b border-gray-200 px-4 py-3 lg:grid-cols-[1fr_160px_180px_auto] print:hidden'>
                <div className='relative'>
                  <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                  <input
                    value={search}
                    onChange={event => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder='Global search by name, license number, aadhar...'
                    className='w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#001F54] focus:outline-none focus:ring-1 focus:ring-[#001F54]'
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={event => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className='rounded-md border border-gray-300 px-3 py-2 text-sm'
                >
                  <option value=''>All Status</option>
                  <option value='ACTIVE'>Active</option>
                  <option value='EXPIRED'>Expired</option>
                  <option value='CANCELLED'>Cancelled</option>
                  <option value='SUSPENDED'>Suspended</option>
                  <option value='REVOKED'>Revoked</option>
                </select>
                <select
                  value={purposeFilter}
                  onChange={event => {
                    setPurposeFilter(event.target.value);
                    setPage(1);
                  }}
                  className='rounded-md border border-gray-300 px-3 py-2 text-sm'
                >
                  {PURPOSE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={exportCsv}
                    className='rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <FileDown className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={exportExcel}
                    className='rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <Download className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={printTable}
                    className='rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <Printer className='h-4 w-4' />
                  </button>
                </div>
              </div>

              {error && (
                <div className='flex-none m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                  {error}
                </div>
              )}

              <div className='flex-1 min-h-0 overflow-auto'>
                <table className='min-w-[1900px] w-full border-separate border-spacing-0 text-sm'>
                  <thead className='sticky top-0 z-10 bg-[#001F54] text-left text-xs uppercase tracking-wide text-white'>
                    <tr>
                      {columns.map(col => (
                        <th
                          key={col}
                          className={`border-b border-[#001F54] px-3 py-3 font-semibold ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
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
                      <th className='sticky right-0 border-b border-[#001F54] bg-[#001F54] px-3 py-3 font-semibold'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className='animate-pulse'>
                          {columns.slice(0, 8).map(col => (
                            <td
                              key={col}
                              className={`border-b px-3 py-3 ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
                            >
                              <div className='h-4 rounded bg-gray-200' />
                            </td>
                          ))}
                          <td className='sticky right-0 border-b bg-white px-3 py-3'>
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
                        return (
                          <tr
                            key={license.id}
                            className='odd:bg-white even:bg-gray-50 hover:bg-blue-50/70'
                          >
                            {columns.map(col => (
                              <td
                                key={col}
                                className={`border-b border-gray-100 px-3 py-3 align-top text-gray-700 ${columnWidths[col] || 'w-[160px] min-w-[160px]'}`}
                              >
                                {col === 'License Status' ? (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${expiry.color}`}
                                  >
                                    <span className={`h-2 w-2 rounded-full ${expiry.dot}`} />
                                    {row[col as keyof typeof row]}
                                  </span>
                                ) : col === 'Expiry Date' ? (
                                  <div>
                                    <div>{row[col as keyof typeof row]}</div>
                                    <span
                                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${expiry.color}`}
                                    >
                                      {expiry.label}
                                    </span>
                                  </div>
                                ) : (
                                  String(row[col as keyof typeof row] ?? '-')
                                )}
                              </td>
                            ))}
                            <td className='sticky right-0 border-b border-gray-100 bg-inherit px-3 py-3'>
                              <div className='flex items-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() => openDetails(license)}
                                  className='rounded-md border p-2 text-gray-700 hover:bg-white'
                                  title='View details'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                                <div className='relative group'>
                                  <button
                                    type='button'
                                    disabled={license.status === 'CANCELLED'}
                                    onClick={() =>
                                      router.push(`/forms/renewal?licenseId=${license.id}`)
                                    }
                                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                                      license.status === 'CANCELLED'
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#001F54] text-white hover:bg-[#012a73]'
                                    }`}
                                  >
                                    Renewal
                                  </button>
                                  {license.status === 'CANCELLED' && (
                                    <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50'>
                                      <div className='bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap'>
                                        This license has been cancelled. No further actions are
                                        allowed.
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
                                      router.push(`/cancelForm/new?licenseId=${license.id}`)
                                    }
                                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                                      license.status === 'CANCELLED'
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                  {license.status === 'CANCELLED' && (
                                    <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50'>
                                      <div className='bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap'>
                                        This license has been cancelled. No further actions are
                                        allowed.
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

              <div className='flex-none flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600 print:hidden'>
                <span>
                  Showing page {page} of {Math.max(Math.ceil(total / limit), 1)} ({total} records)
                </span>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={page <= 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className='rounded-md border px-3 py-2 disabled:opacity-50'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    disabled={page >= Math.ceil(total / limit)}
                    onClick={() => setPage(prev => prev + 1)}
                    className='rounded-md border px-3 py-2 disabled:opacity-50'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
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
                  'Address Details',
                  [
                    ['Current Address', selectedLicense.presentAddressLine],
                    ['Permanent Address', selectedLicense.permanentAddressLine],
                    [
                      'District',
                      (selectedLicense as any).presentDistrict?.name ||
                        (selectedLicense as any).presentDistrictName ||
                        (typeof (selectedLicense as any).presentDistrict === 'string'
                          ? (selectedLicense as any).presentDistrict
                          : undefined) ||
                        ((selectedLicense as any).presentDistrictId != null
                          ? `District #${(selectedLicense as any).presentDistrictId}`
                          : undefined),
                    ],
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
                    [
                      'Created From',
                      selectedLicense.freshApplicationId ? 'Fresh Application' : 'Imported',
                    ],
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
    <Suspense fallback={null}>
      <LicenseManagementContent />
    </Suspense>
  );
}
