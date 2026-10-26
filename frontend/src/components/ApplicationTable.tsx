import React, { useState, useCallback, useImperativeHandle } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationData } from '../types';
import styles from './ApplicationTable.module.css';
import { useApplications } from '../context/ApplicationContext';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalAction } from '../context/GlobalActionContext';
import { TableSkeleton } from './Skeleton';
import { ApplicationApi, RenewalApi } from '../config/APIClient';
import { RenewalService } from '../api/renewalService';
import {
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from 'lucide-react';
import { getStatusStyle } from '../utils/statusColors';

// Type assertion for lucide-react icons to fix React 18 compatibility
const EditFixed = Edit as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const TrashFixed = Trash2 as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const EyeFixed = Eye as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const ArrowUpDownFixed = ArrowUpDown as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const ArrowUpFixed = ArrowUp as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const ArrowDownFixed = ArrowDown as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const InboxFixed = Inbox as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

interface UserData {
  id: string;
  username: string;
  officeName: string;
  phoneNo: string;
  role: string;
  createdAt: string;
}

interface WorkflowStatus {
  name?: string;
  code?: string | number;
}

interface StatusObj {
  id?: number | string;
  name?: string;
}

function extractWorkflowStatusName(app: ApplicationData): string {
  const wf = (app as any).workflowStatus as WorkflowStatus | undefined;
  if (wf?.name) return String(wf.name);
  if (wf?.code) return String(wf.code);
  const st = (app as any).status;
  if (st) {
    if (typeof st === 'string') return st;
    if (typeof st === 'object' && 'name' in st && st.name) return String(st.name);
    if (typeof st === 'object' && 'code' in st && st.code) return String(st.code);
  }
  return 'unknown';
}

function getForwardedTo(app: ApplicationData): string | undefined {
  return (app as any).forwardedTo as string | undefined;
}

function getIsViewed(app: ApplicationData): boolean {
  return Boolean((app as any).isViewed);
}

export interface ApplicationTableRef {
  exportExcel: () => Promise<void>;
  isExporting: boolean;
}

export interface ApplicationTableProps {
  users?: UserData[];
  isLoading?: boolean;
  statusIdFilter?: string;
  applications?: ApplicationData[];
  filteredApplications?: ApplicationData[];
  pageType?: string;
  showActionColumn?: boolean;
  selectedFormType?: 'fresh' | 'renewal';
  onSelectedFormTypeChange?: (value: 'fresh' | 'renewal') => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  applicationTypeFilter?: string;
  onApplicationTypeFilterChange?: (filter: string) => void;
  hideControls?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  column: string;
  direction: SortDirection;
}

const ApplicationTable = React.forwardRef<ApplicationTableRef, ApplicationTableProps>(
  (
    {
      users: _users,
      applications,
      filteredApplications,
      isLoading = false,
      statusIdFilter: _statusIdFilter,
      pageType,
      showActionColumn = true,
      selectedFormType,
      searchQuery: externalSearchQuery,
      onSearchQueryChange,
      applicationTypeFilter: externalApplicationTypeFilter,
      onApplicationTypeFilterChange,
      hideControls = false,
      currentPage: externalCurrentPage,
      totalPages: externalTotalPages,
      totalItems: externalTotalItems,
      onPageChange: externalOnPageChange,
    },
    ref
  ) => {
    const { applications: contextApplications } = useApplications();

    const isDraftsPage = pageType === 'drafts';
    const isSentPage = pageType === 'sent';
    const isRenewalPage = pageType === 'renewal';

    const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
    const setSearchQuery = onSearchQueryChange || setLocalSearchQuery;

    const [localApplicationTypeFilter, setLocalApplicationTypeFilter] = React.useState<string>('All');
    const applicationTypeFilter = externalApplicationTypeFilter !== undefined ? externalApplicationTypeFilter : localApplicationTypeFilter;
    const setApplicationTypeFilter = onApplicationTypeFilterChange || setLocalApplicationTypeFilter;

    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const baseApplications = React.useMemo(
      () => filteredApplications || applications || contextApplications || [],
      [filteredApplications, applications, contextApplications]
    );

    const effectiveApplications = React.useMemo(() => {
      let filtered = baseApplications;

      if (applicationTypeFilter !== 'All') {
        filtered = filtered.filter(app => {
          const appType = (app.applicationType || '').toLowerCase();
          return appType.includes(applicationTypeFilter.toLowerCase());
        });
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(app => {
          const applicant = (
            app.applicantName ||
            [app.firstName, app.middleName, app.lastName].filter(Boolean).join(' ') ||
            ''
          ).toLowerCase();
          const type = (app.applicationType || '').toLowerCase();
          const ackNo = (
            (app as any).acknowledgementNo ||
            (app as any).ackNo ||
            (app as any).acknowledgementNumber ||
            String(app.id || '')
          ).toLowerCase();
          const status = extractWorkflowStatusName(app).toLowerCase();
          const actionTaken = ((app as any).actionTaken || '').toLowerCase();
          return (
            applicant.includes(q) ||
            type.includes(q) ||
            ackNo.includes(q) ||
            status.includes(q) ||
            actionTaken.includes(q)
          );
        });
      }

      return filtered;
    }, [baseApplications, searchQuery, applicationTypeFilter]);

    const handleSort = (column: string) => {
      if (column === 'Action') return;
      setSortConfig(prev => {
        if (prev?.column === column) {
          if (prev.direction === 'asc') {
            return { column, direction: 'desc' };
          }
          return null;
        }
        return { column, direction: 'asc' };
      });
    };

    const sortedApplications = React.useMemo(() => {
      if (!sortConfig) return effectiveApplications;

      return [...effectiveApplications].sort((a, b) => {
        let aVal = '';
        let bVal = '';

        switch (sortConfig.column) {
          case 'S. No.':
            return 0;
          case 'Acknowledgement No.':
            aVal = String((a as any).acknowledgementNo || (a as any).ackNo || (a as any).acknowledgementNumber || a.id || '').toLowerCase();
            bVal = String((b as any).acknowledgementNo || (b as any).ackNo || (b as any).acknowledgementNumber || b.id || '').toLowerCase();
            break;
          case 'Applicant Name':
            aVal = String(a.applicantName || [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ') || '').toLowerCase();
            bVal = String(b.applicantName || [b.firstName, b.middleName, b.lastName].filter(Boolean).join(' ') || '').toLowerCase();
            break;
          case 'Application Type':
            aVal = String(a.applicationType || '').toLowerCase();
            bVal = String(b.applicationType || '').toLowerCase();
            break;
          case 'Date & Time':
          case 'Created At':
          case 'Action Taken At': {
            const aDate = new Date((a as any).actionTakenAt || (a as any).createdAt || a.applicationDate || 0).getTime();
            const bDate = new Date((b as any).actionTakenAt || (b as any).createdAt || b.applicationDate || 0).getTime();
            return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
          }
          case 'Status':
          case 'Action Taken':
            aVal = (isSentPage ? ((a as any).actionTaken || '') : extractWorkflowStatusName(a)).toLowerCase();
            bVal = (isSentPage ? ((b as any).actionTaken || '') : extractWorkflowStatusName(b)).toLowerCase();
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }, [effectiveApplications, sortConfig, isSentPage]);

    const [localCurrentPage, setLocalCurrentPage] = useState(1);
    const pageSize = 15;

    const isExternalPagination = externalCurrentPage !== undefined;
    const currentPage = isExternalPagination ? externalCurrentPage : localCurrentPage;

    const totalItems = isExternalPagination && externalTotalItems !== undefined
      ? externalTotalItems
      : sortedApplications.length;

    const totalPages = isExternalPagination && externalTotalPages !== undefined
      ? externalTotalPages
      : Math.max(1, Math.ceil(totalItems / pageSize));

    const handlePageChange = (page: number) => {
      if (externalOnPageChange) {
        externalOnPageChange(page);
      } else {
        setLocalCurrentPage(page);
      }
    };

    const paginatedApplications = React.useMemo(() => {
      if (isExternalPagination) {
        return sortedApplications;
      }
      const startIndex = (currentPage - 1) * pageSize;
      return sortedApplications.slice(startIndex, startIndex + pageSize);
    }, [sortedApplications, currentPage, pageSize, isExternalPagination]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { executeAction, setActiveNavigationPath } = useGlobalAction();

    const tableColumns = React.useMemo(() => {
      const base = isSentPage
        ? [
            'S. No.',
            'Acknowledgement No.',
            'Applicant Name',
            'Application Type',
            'Action Taken At',
            'Action Taken',
          ]
        : [
            'S. No.',
            'Acknowledgement No.',
            'Applicant Name',
            'Application Type',
            'Date & Time',
            'Status',
          ];
      if (showActionColumn) base.push('Action');
      return base;
    }, [isSentPage, showActionColumn]);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [exportingExcel, setExportingExcel] = useState<boolean>(false);
    const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
    const { userRole } = useAuth();

    React.useEffect(() => {
      return () => {
        setLoadingRowId(null);
      };
    }, []);

    const isApplicationUnread = useCallback(
      (app: ApplicationData): boolean => {
        return getForwardedTo(app) === userRole && getIsViewed(app) === false;
      },
      [userRole]
    );

    const handleViewApplication = useCallback(
      (id: string) => {
        setLoadingRowId(id);
        const actionId = `navigate-application-${id}`;
        setActiveNavigationPath(null);
        void executeAction(actionId, async () => {
          const app = (baseApplications || []).find(a => a.id === id);
          const routeBase = /cancel/i.test(String(app?.applicationType || ''))
            ? `/cancelForm/${id}`
            : /renewal/i.test(String(app?.applicationType || ''))
              ? `/renewalApplication/${id}`
              : `/application/${id}`;

          const currentType = searchParams?.get('type');
          const route = currentType ? `${routeBase}?returnType=${encodeURIComponent(currentType)}` : routeBase;

          setActiveNavigationPath(route);
          await router.push(route);
          setLoadingRowId(null);
        }).catch(() => setLoadingRowId(null));
      },
      [router, executeAction, setActiveNavigationPath, baseApplications, searchParams]
    );

    const handleEditDraft = useCallback(
      async (id: string) => {
        setLoadingRowId(id);
        const actionId = `edit-draft-${id}`;
        const result = await executeAction(actionId, async () => {
          try {
            const draftApp = (baseApplications || []).find(app => app.id === id);

            const isRenewalDraft =
              /renewal/i.test(String(draftApp?.applicationType || '')) ||
              selectedFormType === 'renewal' ||
              Boolean((draftApp as any)?.renewalId || (draftApp as any)?.renewalApplicationId);

            if (isRenewalDraft) {
              const renewalId = String(
                (draftApp as any)?.renewalId ||
                  (draftApp as any)?.renewalApplicationId ||
                  draftApp?.id ||
                  id
              );
              let licenseId = String(
                (draftApp as any)?.licenseNumber ||
                  (draftApp as any)?.licenseId ||
                  (draftApp as any)?.freshLicenseId ||
                  (draftApp as any)?.applicationId ||
                  (draftApp as any)?.freshApplicationId ||
                  (draftApp as any)?.sourceApplicationId ||
                  (draftApp as any)?.renewalLicenseId ||
                  ''
              );

              if (!licenseId && renewalId) {
                try {
                  const renewalResponse = await RenewalService.getRenewalForm(renewalId);
                  const renewalData = renewalResponse?.data || renewalResponse;
                  licenseId = String(
                    renewalData?.licenseNumber ||
                      renewalData?.licenseId ||
                      renewalData?.freshLicenseId ||
                      renewalData?.applicationId ||
                      renewalData?.freshApplicationId ||
                      renewalData?.sourceApplicationId ||
                      renewalData?.renewalLicenseId ||
                      ''
                  );
                } catch (err) {
                  console.error('Failed to fetch renewal form for licenseId:', err);
                }
              }

              await router.push(
                `/forms/renewal?licenseId=${encodeURIComponent(licenseId)}&renewalId=${encodeURIComponent(renewalId)}`
              );
              return;
            }

            const response = await ApplicationApi.getById(Number(id));

            if (response?.success && response?.data) {
              sessionStorage.setItem('draftApplicationData', JSON.stringify(response.data));
              sessionStorage.setItem('editingApplicationId', id);
              await router.push(`/forms/createFreshApplication/personal-information?id=${id}`);
            } else {
              setErrorMessage('Failed to load draft application');
              setTimeout(() => setErrorMessage(null), 3000);
            }
          } catch {
            setErrorMessage('Error loading draft application');
            setTimeout(() => setErrorMessage(null), 3000);
          }
        }).catch(() => setLoadingRowId(null));

        if (result === null) {
          setLoadingRowId(null);
          return;
        }
      },
      [router, executeAction, baseApplications, selectedFormType]
    );

    const formatDateTime = useCallback((dateStr: string) => {
      if (!dateStr) return '—';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }, []);

    const handleExportExcel = useCallback(async () => {
      if (exportingExcel) return;
      try {
        setExportingExcel(true);
        const XLSX = await import('xlsx');

        const exportColumns = tableColumns.filter(c => c !== 'Action');

        const rows = sortedApplications.map((app, idx) => {
          const statusName = extractWorkflowStatusName(app);
          const createdAtVal =
            (app as any).actionTakenAt || (app as any).createdAt || app.applicationDate;

          const row: Record<string, string | number> = {};
          exportColumns.forEach(col => {
            switch (col) {
              case 'S. No.':
                row[col] = idx + 1;
                break;
              case 'Acknowledgement No.':
                row[col] = (app as any).acknowledgementNo || (app as any).ackNo || (app as any).acknowledgementNumber || app.id || '';
                break;
              case 'Applicant Name':
                row[col] = app.applicantName || '';
                break;
              case 'Application Type':
                row[col] = app.applicationType || '';
                break;
              case 'Date & Time':
              case 'Created At':
              case 'Action Taken At':
                row[col] = formatDateTime(createdAtVal || '');
                break;
              case 'Status':
                row[col] = statusName;
                break;
              case 'Action Taken':
                row[col] = (app as any).actionTaken || '';
                break;
              default:
                row[col] = '';
            }
          });
          return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
        const fileName = `applications_export_${new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        setSuccessMessage('Applications exported to Excel successfully');
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (error) {
        console.error('Failed to export applications to Excel', error);
        setErrorMessage('Failed to export applications to Excel');
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setExportingExcel(false);
      }
    }, [sortedApplications, exportingExcel, formatDateTime, tableColumns]);

    useImperativeHandle(
      ref,
      () => ({
        exportExcel: handleExportExcel,
        isExporting: exportingExcel,
      }),
      [handleExportExcel, exportingExcel]
    );

    if (isLoading) {
      return <TableSkeleton rows={8} columns={6} />;
    }

    return (
      <div className={`${styles.tableContainer} min-w-full flex-1 min-h-0 flex flex-col overflow-hidden`}>
        {/* Display messages */}
        {successMessage && <Message type='success' message={successMessage} />}
        {errorMessage && <Message type='error' message={errorMessage} />}

        {/* Controls (search + filter + export) */}
        {!hideControls && (
          <div className='flex-none px-4 py-3 bg-white border-b border-slate-200/80'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='relative w-full sm:w-80'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Search by Ack No, applicant, status...'
                  className='w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:border-[#0B1F3A] transition'
                  aria-label='Search applications'
                />
                <svg
                  className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
                  />
                </svg>
              </div>

              <div className='flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto'>
                <select
                  value={applicationTypeFilter}
                  onChange={e => setApplicationTypeFilter(e.target.value)}
                  className='w-full sm:w-44 h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/20'
                  aria-label='Filter by application type'
                >
                  <option value='All'>All Types</option>
                  <option value='Fresh'>Fresh</option>
                  <option value='Renewal'>Renewal</option>
                  <option value='Cancel'>Cancel</option>
                </select>

                <button
                  type='button'
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className='inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md bg-[#0B1F3A] text-white hover:bg-[#15325B] disabled:bg-slate-300 disabled:text-slate-500 transition-colors shadow-sm text-xs font-semibold'
                  aria-label={
                    exportingExcel
                      ? 'Exporting applications to Excel'
                      : 'Download applications Excel file'
                  }
                  title={exportingExcel ? 'Exporting...' : 'Export Excel'}
                >
                  {exportingExcel ? (
                    <>
                      <svg
                        className='animate-spin h-4 w-4'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='w-4 h-4'
                      >
                        <path d='M4 4h16v4H4z' />
                        <path d='M4 20h16v-4H4z' />
                        <path d='M12 8v6' />
                        <path d='M9 11l3 3 3-3' />
                      </svg>
                      <span>Export Excel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`${styles.tableWrapper} w-full min-w-0 flex-initial min-h-0 overflow-y-auto`}>
          <table className='w-full table-fixed border-separate border-spacing-0'>
            <colgroup>
              {(() => {
                const cols = isSentPage
                  ? showActionColumn
                    ? ['6%', '20%', '18%', '14%', '18%', '14%', '10%']
                    : ['6%', '22%', '20%', '16%', '20%', '16%']
                  : showActionColumn
                    ? ['6%', '20%', '18%', '14%', '18%', '14%', '10%']
                    : ['6%', '22%', '20%', '16%', '20%', '16%'];
                return cols.map((w, i) => <col key={i} style={{ width: w }} />);
              })()}
            </colgroup>
            <thead className='bg-slate-50'>
              <tr>
                {tableColumns.map(col => {
                  const isAction = col === 'Action';
                  const isSorted = sortConfig?.column === col;
                  return (
                    <th
                      key={col}
                      scope='col'
                      style={{ textAlign: isAction ? 'center' : 'left' }}
                      className={`${styles.tableHeaderCell} ${
                        isAction ? 'print:hidden' : 'cursor-pointer hover:bg-slate-100/80 transition-colors select-none'
                      }`}
                      onClick={() => !isAction && handleSort(col)}
                      aria-sort={
                        isSorted
                          ? sortConfig?.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                      title={!isAction ? `Sort by ${col}` : undefined}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${isAction ? 'justify-center w-full' : ''}`}>
                        <span>{col}</span>
                        {!isAction && (
                          <span className='text-slate-400'>
                            {isSorted ? (
                              sortConfig?.direction === 'asc' ? (
                                <ArrowUpFixed className='w-3.5 h-3.5 text-[#0B1F3A]' />
                              ) : (
                                <ArrowDownFixed className='w-3.5 h-3.5 text-[#0B1F3A]' />
                              )
                            ) : (
                              <ArrowUpDownFixed className='w-3 h-3 text-slate-300 opacity-60 hover:opacity-100' />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-slate-100'>
              {effectiveApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableColumns.length}
                    className='text-center py-14 px-4 bg-white'
                  >
                    <div className='flex flex-col items-center justify-center max-w-sm mx-auto text-center'>
                      <div className='w-12 h-12 mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400'>
                        <InboxFixed className='w-6 h-6' />
                      </div>
                      <h4 className='text-sm font-semibold text-slate-800 mb-1'>
                        {baseApplications.length === 0
                          ? 'No applications found'
                          : 'No matching applications'}
                      </h4>
                      <p className='text-xs text-slate-500 mb-4 leading-relaxed'>
                        {baseApplications.length === 0
                          ? 'There are currently no records available in this view.'
                          : 'Try adjusting your search query or filter criteria to find what you are looking for.'}
                      </p>
                      {(searchQuery.trim() || applicationTypeFilter !== 'All') && (
                        <button
                          type='button'
                          onClick={() => {
                            setSearchQuery('');
                            setApplicationTypeFilter('All');
                          }}
                          className='inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md text-[#0B1F3A] bg-[#0B1F3A]/5 hover:bg-[#0B1F3A]/10 border border-[#0B1F3A]/20 transition-colors'
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app, index) => (
                  <TableRow
                    key={`${app.id}-${index}`}
                    app={app}
                    index={(currentPage - 1) * pageSize + index}
                    handleViewApplication={handleViewApplication}
                    handleEditDraft={handleEditDraft}
                    isDraftsPage={isDraftsPage}
                    isSentPage={isSentPage}
                    isRenewalPage={isRenewalPage}
                    userRole={userRole || null}
                    isApplicationUnread={isApplicationUnread}
                    formatDateTime={formatDateTime}
                    showActionColumn={showActionColumn}
                    loadingRowId={loadingRowId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        {totalPages > 1 && (
          <div className='px-4 py-2 border-t border-slate-200 bg-white flex-shrink-0 flex items-center justify-between gap-3'>
            <div className='text-xs text-slate-500 font-medium whitespace-nowrap'>
              Showing <span className='text-slate-800 font-semibold'>{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> to <span className='text-slate-800 font-semibold'>{Math.min(currentPage * pageSize, totalItems)}</span> of <span className='text-slate-800 font-semibold'>{totalItems}</span> entries
            </div>
            <div className='flex space-x-1 items-center'>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className='px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                aria-label='Previous page'
              >
                Previous
              </button>

              {(() => {
                const pages = [];
                const maxPages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
                let endPage = startPage + maxPages - 1;

                if (endPage > totalPages) {
                  endPage = totalPages;
                  startPage = Math.max(1, endPage - maxPages + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`min-w-[28px] px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                        i === currentPage
                          ? 'bg-[#0B1F3A] text-white border border-[#0B1F3A] shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      aria-label={`Page ${i}`}
                      aria-current={i === currentPage ? 'page' : undefined}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                aria-label='Next page'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ApplicationTable.displayName = 'ApplicationTable';

const Message: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => {
  const typeClasses =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-red-50 border-red-200 text-red-800';
  return (
    <div className={`mx-4 mt-3 p-3 border rounded-lg text-xs font-medium ${typeClasses}`}>
      <div className='flex items-center'>
        <svg className='w-4 h-4 mr-2 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
          {type === 'success' ? (
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          ) : (
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
              clipRule='evenodd'
            />
          )}
        </svg>
        {message}
      </div>
    </div>
  );
};

const TableRow: React.FC<{
  app: ApplicationData;
  index: number;
  handleViewApplication: (id: string) => void;
  handleEditDraft: (id: string) => Promise<void>;
  isDraftsPage: boolean;
  isSentPage?: boolean;
  isRenewalPage?: boolean;
  userRole: string | null;
  isApplicationUnread: (app: ApplicationData) => boolean;
  formatDateTime: (dateStr: string) => string;
  showActionColumn?: boolean;
  loadingRowId?: string | null;
}> = ({
  app,
  index,
  handleViewApplication,
  handleEditDraft,
  isDraftsPage,
  isSentPage = false,
  userRole,
  isApplicationUnread,
  formatDateTime,
  showActionColumn = true,
  loadingRowId,
}) => {
  const isRowLoading = String(loadingRowId) === String(app.id);
  const isZSRole = userRole === 'ZS' || userRole === 'zs';

  const statusId = (app.status_id ?? ((app as any).status as StatusObj | undefined)?.id) as
    | number
    | string
    | undefined;
  const isDraftByStatus = Number(statusId) === 13 || String(statusId) === '13';
  const isDrafts = (isDraftsPage || isDraftByStatus) && isZSRole;

  const ackNumber = (app as any).acknowledgementNo || (app as any).ackNo || (app as any).acknowledgementNumber || 'N/A';

  if (isSentPage) {
    return (
      <tr
        key={`${(app as any).workflowHistoryId || app.id}-${index}`}
        className={`${styles.tableRow}`}
        aria-label={`Row for sent application ${app.id}`}
      >
        <td className={`${styles.tableCell} text-sm text-slate-700 font-medium`}>{index + 1}</td>
        <td
          className={`${styles.tableCell} text-sm text-slate-800 font-mono ${styles.truncateCell}`}
          title={ackNumber}
        >
          {ackNumber}
        </td>

        <td
          className={`${styles.tableCell} text-sm font-semibold ${styles.truncateCell}`}
          title={app.applicantName || 'N/A'}
        >
          <div className='flex items-center gap-2 w-full min-w-0'>
            {isRowLoading && (
              <svg
                className='animate-spin h-3.5 w-3.5 text-[#0B1F3A] flex-shrink-0'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                handleViewApplication(app.id);
              }}
              disabled={isRowLoading}
              className={`text-[#0B1F3A] hover:text-[#15325B] hover:underline transition-colors truncate text-left font-medium ${isRowLoading ? 'opacity-60 cursor-wait' : ''}`}
              style={{ maxWidth: '100%', display: 'block' }}
              aria-label={`View details for application ${app.id}`}
            >
              {app.applicantName}
            </button>
          </div>
        </td>
        <td
          className={`${styles.tableCell} text-sm text-slate-700 ${styles.truncateCell}`}
          title={app.applicationType || 'N/A'}
        >
          {app.applicationType || 'N/A'}
        </td>
        <td className={`${styles.tableCell} text-sm text-slate-600 ${styles.nowrapCell}`}>
          {formatDateTime(
            (app as any).actionTakenAt || (app as any).createdAt || app.applicationDate
          )}
        </td>
        <td className={`${styles.tableCell}`}>
          {(() => {
            const actionStr = (app as any).actionTaken || 'N/A';
            let displayStr = actionStr;
            const normalized = actionStr.toLowerCase().trim();
            if (normalized === 'forward') {
              displayStr = 'Forwarded';
            } else if (normalized === 'return') {
              displayStr = 'Returned';
            } else if (normalized === 'approve') {
              displayStr = 'Approved';
            } else if (normalized === 'reject') {
              displayStr = 'Rejected';
            } else {
              displayStr = displayStr
                .replace(/[-_]+/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase());
            }

            const style = getStatusStyle(actionStr);
            return (
              <span
                className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.statusPill}`}
                style={{
                  backgroundColor: style.bg,
                  color: style.text,
                  border: `1px solid ${style.border}`,
                }}
              >
                {displayStr}
              </span>
            );
          })()}
        </td>
        {showActionColumn && (
          <td className={`${styles.tableCell} text-center text-sm text-slate-500 print:hidden`}>
            <button
              onClick={e => {
                e.stopPropagation();
                handleViewApplication(app.id);
              }}
              disabled={isRowLoading}
              className={`p-1.5 text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center ${isRowLoading ? 'opacity-60 cursor-wait' : ''}`}
              aria-label={`View application ${app.id}`}
              title='View Details'
            >
              {isRowLoading ? (
                <svg
                  className='animate-spin h-4 w-4 text-[#0B1F3A]'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
              ) : (
                <EyeFixed className='w-4 h-4' />
              )}
            </button>
          </td>
        )}
      </tr>
    );
  }

  return (
    <tr
      key={`${app.id}-${index}`}
      className={`${styles.tableRow} ${isApplicationUnread(app) ? 'font-bold' : ''}`}
      aria-label={`Row for application ${app.id}`}
    >
      <td className={`${styles.tableCell} text-sm text-slate-700 font-medium`}>{index + 1}</td>
      <td
        className={`${styles.tableCell} text-sm text-slate-800 font-mono ${styles.truncateCell}`}
        title={ackNumber}
      >
        {ackNumber}
      </td>
      <td
        className={`${styles.tableCell} text-sm font-semibold ${styles.truncateCell}`}
        title={app.applicantName || 'N/A'}
      >
        {isDrafts ? (
          <span className='text-slate-800 truncate block' style={{ maxWidth: '100%' }}>
            {app.applicantName}
          </span>
        ) : (
          <div className='flex items-center gap-2 w-full min-w-0'>
            {isRowLoading && (
              <svg
                className='animate-spin h-3.5 w-3.5 text-[#0B1F3A] flex-shrink-0'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                handleViewApplication(app.id);
              }}
              disabled={isRowLoading}
              className={`text-[#0B1F3A] hover:text-[#15325B] hover:underline transition-colors truncate text-left font-medium ${isRowLoading ? 'opacity-60 cursor-wait' : ''}`}
              style={{ maxWidth: '100%', display: 'block' }}
              aria-label={`View details for application ${app.id}`}
            >
              {app.applicantName}
            </button>
          </div>
        )}
      </td>
      <td className={`${styles.tableCell} text-sm text-slate-700`}>{app.applicationType}</td>
      <td className={`${styles.tableCell} text-sm text-slate-600 ${styles.nowrapCell}`}>
        {formatDateTime(app.applicationDate)}
      </td>
      <td className={`${styles.tableCell}`}>
        {(() => {
          const statusStr = extractWorkflowStatusName(app);
          const display = statusStr
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          const style = getStatusStyle(statusStr);
          return (
            <span
              className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.statusPill}`}
              style={{
                backgroundColor: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
              }}
              title={`Status: ${display}`}
              aria-label={`Status: ${display}`}
            >
              {display}
            </span>
          );
        })()}
      </td>
      {showActionColumn && (
        <td className={`${styles.tableCell} text-center text-sm text-slate-500 print:hidden`}>
          {isDrafts ? (
            <div className='flex items-center gap-1.5 justify-center'>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleEditDraft(app.id);
                }}
                className='inline-flex items-center justify-center p-1.5 bg-[#0B1F3A]/10 text-[#0B1F3A] rounded-md hover:bg-[#0B1F3A]/20 transition-colors'
                aria-label={`Edit draft application ${app.id}`}
                title='Edit Draft'
              >
                <EditFixed className='w-3.5 h-3.5' />
              </button>
              {/renewal/i.test(String(app.applicationType || '')) ? (
                <DeleteRenewalDraftButton renewalId={app.id} />
              ) : (
                <DeleteDraftButton appId={app.id} />
              )}
            </div>
          ) : (
            <button
              onClick={e => {
                e.stopPropagation();
                handleViewApplication(app.id);
              }}
              disabled={isRowLoading}
              className={`p-1.5 text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center ${isRowLoading ? 'opacity-60 cursor-wait' : ''}`}
              aria-label={`View application ${app.id}`}
              title='View Details'
            >
              {isRowLoading ? (
                <svg
                  className='animate-spin h-4 w-4 text-[#0B1F3A]'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
              ) : (
                <EyeFixed className='w-4 h-4' />
              )}
            </button>
          )}
        </td>
      )}
    </tr>
  );
};

export default ApplicationTable;

const DeleteDraftButton: React.FC<{ appId: string | number }> = ({ appId }) => {
  const [deleting, setDeleting] = React.useState(false);
  const [toast, setToast] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeleting(true);
      await ApplicationApi.deleteApplication(String(appId));
      setToast({
        type: 'success',
        message: 'Draft application deleted successfully.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Failed to delete application', err);
      setToast({
        type: 'error',
        message: 'Failed to delete draft application. Please try again.',
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className='inline-flex items-center justify-center p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50'
        aria-label={`Delete draft application ${appId}`}
        title='Delete Draft'
      >
        <TrashFixed className='w-3.5 h-3.5' />
      </button>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-xl text-white text-xs font-semibold z-50 animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
};

const DeleteRenewalDraftButton: React.FC<{ renewalId: string | number }> = ({ renewalId }) => {
  const [deleting, setDeleting] = React.useState(false);
  const [toast, setToast] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeleting(true);
      await RenewalApi.deleteRenewal(String(renewalId));
      setToast({
        type: 'success',
        message: 'Renewal draft deleted successfully.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to delete renewal draft', error);
      setToast({
        type: 'error',
        message: 'Failed to delete renewal draft. Please try again.',
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className='inline-flex items-center justify-center p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50'
        aria-label={`Delete renewal draft ${renewalId}`}
        title='Delete Renewal Draft'
      >
        <TrashFixed className='w-3.5 h-3.5' />
      </button>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-xl text-white text-xs font-semibold z-50 animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
};
