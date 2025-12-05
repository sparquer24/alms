import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationData } from '../types';
import styles from './ApplicationTable.module.css';
import { useApplications } from '../context/ApplicationContext';
// Removed PDF generation feature
import { useAuth } from '../config/auth';
import { TableSkeleton } from './Skeleton';
import { ApplicationApi } from '../config/APIClient';
import { Edit, Trash2 } from 'lucide-react';

// Type assertion for lucide-react icons to fix React 18 compatibility
// Lucide icons are React components that accept SVG props. We type it conservatively.
const EditFixed = Edit as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const TrashFixed = Trash2 as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

// Note: Excel export uses dynamic import of 'xlsx' to avoid SSR issues

interface UserData {
  id: string;
  username: string;
  officeName: string;
  phoneNo: string;
  role: string;
  createdAt: string;
}

// Local helper types for partially-typed data often present on ApplicationData
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
  const st = (app as any).status as StatusObj | undefined;
  if (st?.name) return String(st.name);
  return 'unknown';
}

function getForwardedTo(app: ApplicationData): string | undefined {
  return (app as any).forwardedTo as string | undefined;
}

function getIsViewed(app: ApplicationData): boolean {
  return Boolean((app as any).isViewed);
}

interface ApplicationTableProps {
  users?: UserData[];
  isLoading?: boolean;
  statusIdFilter?: string;
  applications?: ApplicationData[]; // Applications prop for backward compatibility
  filteredApplications?: ApplicationData[]; // Optional filtered applications list
  pageType?: string; // Type of page being viewed (e.g., 'drafts', 'forwarded', etc.)
  showActionColumn?: boolean;
}

const getStatusPillClass = (status: string) => {
  const normalized = (status || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[-\s]+/g, '_');
  const statusClasses: Record<string, string> = {
    pending: 'bg-[#FACC15] text-black',
    approved: 'bg-[#10B981] text-white',
    initiate: 'bg-[#A7F3D0] text-green-800',
    initiated: 'bg-[#A7F3D0] text-green-800',
    rejected: 'bg-[#EF4444] text-white',
    red_flagged: 'bg-[#DC2626] text-white',
    returned: 'bg-orange-400 text-white',
    sent: 'bg-blue-500 text-white',
    closed: 'bg-gray-500 text-white',
    disposed: 'bg-gray-400 text-white',
    final_disposal: 'bg-emerald-600 text-white',
    unknown: 'bg-gray-200 text-gray-800',
  };
  return statusClasses[normalized] || statusClasses.unknown;
};

const ApplicationTable: React.FC<ApplicationTableProps> = React.memo(
  ({
    users,
    applications,
    filteredApplications,
    isLoading = false,
    statusIdFilter,
    pageType,
    showActionColumn = true,
  }) => {
    // Get applications from context
    const { applications: contextApplications } = useApplications();

    // Check if we're on the drafts page or sent page
    const isDraftsPage = pageType === 'drafts' || pageType === 'drafts';
    const isSentPage = pageType === 'sent';

    // Local search state
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Determine base applications list in this order: filtered -> prop -> context -> empty array
    const baseApplications = filteredApplications || applications || contextApplications || [];

    // Apply search filter if query present (searches applicantName, applicationType, status)
    const effectiveApplications = React.useMemo(() => {
      if (!searchQuery.trim()) return baseApplications;
      const q = searchQuery.toLowerCase();
      return baseApplications.filter(app => {
        const applicant = (app.applicantName || '').toLowerCase();
        const type = (app.applicationType || '').toLowerCase();
        const status = extractWorkflowStatusName(app).toLowerCase();
        return applicant.includes(q) || type.includes(q) || status.includes(q);
      });
    }, [baseApplications, searchQuery]);

    const router = useRouter();

    // Compute visible table column names so header and export use same labels
    const tableColumns = React.useMemo(() => {
      const base = isSentPage
        ? ['S.No', 'Acknowledgement No', 'Applicant Name', 'Action Taken At', 'Action Taken']
        : ['S.No', 'Applicant Name', 'Application Type', 'Date & Time', 'Status'];
      if (showActionColumn) base.push('Action');
      return base;
    }, [isSentPage, showActionColumn]);

    // Prevent outer page scrollbar while this table is rendered so only the
    // inner table wrapper scrolls. We restore the previous overflow value on unmount.
    React.useEffect(() => {
      if (typeof document === 'undefined') return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }, []);
    // Removed generatingPDF state after removing PDF button
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [exportingExcel, setExportingExcel] = useState<boolean>(false);
    const { userRole } = useAuth();

    const isApplicationUnread = useCallback(
      (app: ApplicationData): boolean => {
        return getForwardedTo(app) === userRole && getIsViewed(app) === false;
      },
      [userRole]
    );

    const handleViewApplication = useCallback(
      (id: string) => {
        router.push(`/application/${id}`);
      },
      [router]
    );

    const handleEditDraft = useCallback(
      async (id: string) => {
        try {
          const response = await ApplicationApi.getById(Number(id));

          if (response?.success && response?.data) {
            // Store the application data in sessionStorage to use in the form
            sessionStorage.setItem('draftApplicationData', JSON.stringify(response.data));
            sessionStorage.setItem('editingApplicationId', id);
            // Navigate to the form with application ID as query parameter
            router.push(`/forms/createFreshApplication/personal-information?id=${id}`);
          } else {
            setErrorMessage('Failed to load draft application');
            setTimeout(() => setErrorMessage(null), 3000);
          }
        } catch (error) {
          setErrorMessage('Error loading draft application');
          setTimeout(() => setErrorMessage(null), 3000);
        }
      },
      [router]
    );

    const formatDateTime = useCallback((dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleString();
    }, []);

    // Removed PDF generation handler

    const handleExportExcel = useCallback(async () => {
      if (exportingExcel) return;
      try {
        setExportingExcel(true);
        const XLSX = await import('xlsx');

        // Exclude UI-only columns (like 'Action') from the exported columns
        const exportColumns = tableColumns.filter(c => c !== 'Action');

        const rows = effectiveApplications.map((app, idx) => {
          const statusName = extractWorkflowStatusName(app);
          const createdAtVal = (app as any).actionTakenAt || (app as any).createdAt || app.applicationDate;

          const row: Record<string, string | number> = {};
          exportColumns.forEach(col => {
            switch (col) {
              case 'S.No':
                row[col] = idx + 1;
                break;
              case 'Acknowledgement No':
                row[col] = (app as any).acknowledgementNo || '';
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
              // 'Action' column intentionally omitted from export via exportColumns
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
      } catch (err) {
        setErrorMessage('Failed to export applications to Excel');
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setExportingExcel(false);
      }
    }, [effectiveApplications, exportingExcel, formatDateTime, tableColumns]);

    if (isLoading) {
      return <TableSkeleton rows={8} columns={6} />;
    }

    if (!effectiveApplications || effectiveApplications.length === 0) {
      return (
        <div className={`${styles.tableContainer} min-w-full overflow-hidden rounded-lg shadow`}>
          <div className={styles.emptyState}>No applications found matching your criteria.</div>
        </div>
      );
    }

    return (
      <div className={`${styles.tableContainer} min-w-full overflow-hidden rounded-lg shadow`}>
        {/* Display messages */}
        {successMessage && <Message type='success' message={successMessage} />}

        {errorMessage && <Message type='error' message={errorMessage} />}

        {/* Controls (search + export) stay above the scrollable table */}
        <div className='px-4 pt-4 pb-2 bg-white'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div className='relative w-full sm:w-72'>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search (name, type, status)'
                className='w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                aria-label='Search applications'
              />
              <svg
                className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'
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

            <div className='flex items-center gap-3 w-full sm:w-auto'>
              <button
                type='button'
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className='inline-flex items-center gap-2 h-9 px-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-600 transition-colors shadow-sm text-sm font-medium'
                aria-label={
                  exportingExcel
                    ? 'Exporting applications to Excel'
                    : 'Download applications Excel file'
                }
                title={exportingExcel ? 'Exporting...' : 'Download Excel'}
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
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
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
                      className='w-5 h-5'
                    >
                      <path d='M4 4h16v4H4z' />
                      <path d='M4 20h16v-4H4z' />
                      <path d='M12 8v6' />
                      <path d='M9 11l3 3 3-3' />
                    </svg>
                    <span>Download Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Column headers in their own table to avoid overlap issues; body is a separate scrollable table */}
        <div className='w-full'>
          <table className='w-full table-fixed border-collapse'>
            {/* Dynamic colgroup based on visible columns */}
            <colgroup>
              {(() => {
                const baseWidths = ['5%', '30%', '20%', '20%', '15%'];
                const cols = [...baseWidths];
                if (showActionColumn) cols.push('10%');
                return cols.map((w, i) => <col key={i} style={{ width: w }} />);
              })()}
            </colgroup>
            <thead className='bg-gray-50'>
              <tr>
                {tableColumns.map(col => (
                  <th
                    key={col}
                    scope='col'
className={`${styles.tableHeaderCell} text-left text-xs font-medium text-black uppercase tracking-wider`}                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        <div className={`${styles.tableWrapper} w-full min-w-0`}>
          <table className='w-full table-fixed border-collapse'>
            <colgroup>
              {(() => {
                const baseWidths = ['5%', '30%', '20%', '20%', '15%'];
                const cols = [...baseWidths];
                if (showActionColumn) cols.push('10%');
                return cols.map((w, i) => <col key={i} style={{ width: w }} />);
              })()}
            </colgroup>
            <tbody className='bg-white divide-y divide-gray-200'>
              {effectiveApplications.map((app, index) => (
                <TableRow
                  key={`${app.id}-${index}`}
                  app={app}
                  index={index}
                  handleViewApplication={handleViewApplication}
                  handleEditDraft={handleEditDraft}
                  isDraftsPage={isDraftsPage}
                  isSentPage={isSentPage}
                  userRole={userRole}
                  // PDF button removed
                  isApplicationUnread={isApplicationUnread}
                  formatDateTime={formatDateTime}
                  getStatusPillClass={getStatusPillClass}
                  showActionColumn={showActionColumn}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

const Message: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => {
  const typeClasses =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-red-50 border-red-200 text-red-800';
  return (
    <div className={`mb-4 p-3 border rounded-lg ${typeClasses}`}>
      <div className='flex items-center'>
        <svg className='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
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

// TableHeader removed; controls and column headers are rendered separately above.

const TableRow: React.FC<{
  app: ApplicationData;
  index: number;
  handleViewApplication: (id: string) => void;
  handleEditDraft: (id: string) => Promise<void>;
  isDraftsPage: boolean;
  isSentPage?: boolean;
  userRole: string | null;
  // PDF generation removed
  isApplicationUnread: (app: ApplicationData) => boolean;
  formatDateTime: (dateStr: string) => string;
  getStatusPillClass: (status: string) => string;
  showActionColumn?: boolean;
}> = ({
  app,
  index,
  handleViewApplication,
  handleEditDraft,
  isDraftsPage,
  isSentPage = false,
  userRole,
  // Removed PDF props
  isApplicationUnread,
  formatDateTime,
  getStatusPillClass,
  showActionColumn = true,
}) => {
  // Check if user is ZS role
  const isZSRole = userRole === 'ZS' || userRole === 'zs';

  // Show Edit button only if:
  // 1. User is ZS role, AND
  // 2. On drafts page OR status_id is 13
  const statusId = (app.status_id ?? ((app as any).status as StatusObj | undefined)?.id) as
    | number
    | string
    | undefined;
  const isDraftByStatus = Number(statusId) === 13 || String(statusId) === '13';
  const isDrafts = (isDraftsPage || isDraftByStatus) && isZSRole;

  // Render different columns for sent page
  if (isSentPage) {
    return (
      <tr
        key={`${(app as any).workflowHistoryId || app.id}-${index}`}
        className={`${styles.tableRow}`}
        aria-label={`Row for sent application ${app.id}`}
      >
       <td className={`${styles.tableCell} text-sm text-black`}>{index + 1}</td>
        <td className={`${styles.tableCell} text-sm text-black`}> 
          {(app as any).acknowledgementNo || 'N/A'}
        </td>
         <td className={`${styles.tableCell} text-sm font-medium`}>
          <button
            onClick={e => {
              e.stopPropagation();
              handleViewApplication(app.id);
            }}
            className={`text-blue-600 hover:text-blue-800 hover:underline transition-colors`}
            aria-label={`View details for application ${app.id}`}
          >
            {app.applicantName}
          </button>
        </td>
<td className={`${styles.tableCell} text-sm text-black`}>
           {formatDateTime((app as any).actionTakenAt || (app as any).createdAt || app.applicationDate)}
        </td>
                <td className={`${styles.tableCell} text-sm text-black`}>
          {(app as any).actionTaken || 'N/A'}
        </td>
        {showActionColumn && (
 <td className={`${styles.tableCell} text-sm text-gray-500`}>
            <button
              onClick={e => {
                e.stopPropagation();
                handleViewApplication(app.id);
              }}
              className='px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors'
              aria-label={`View application ${app.id}`}
            >
              View
            </button>
          </td>
        )}
      </tr>
    );
  }

  // Normal rendering for non-sent pages
  return (
    <tr
      key={`${app.id}-${index}`}
      className={`${styles.tableRow} ${isApplicationUnread(app) ? 'font-bold' : ''}`}
      aria-label={`Row for application ${app.id}`}
    >
     <td className={`${styles.tableCell} text-sm text-black`}>{index + 1}</td>
      <td className={`${styles.tableCell} text-sm font-medium `}>
        {isDrafts ? (
          <span className='text-gray-900'>{app.applicantName}</span>
        ) : (
          <button
            onClick={e => {
              e.stopPropagation();
              handleViewApplication(app.id);
            }}
            className={`text-blue-600 hover:text-blue-800 hover:underline transition-colors`}
            aria-label={`View details for application ${app.id}`}
          >
            {app.applicantName}
          </button>
        )}
      </td>
     <td className={`${styles.tableCell} text-sm text-black`}>{app.applicationType}</td>
      <td className={`${styles.tableCell} text-sm text-black`}>
        {formatDateTime(app.applicationDate)}
      </td>
     <td className={`${styles.tableCell}`}>
        {(() => {
          const statusStr = extractWorkflowStatusName(app);
          const display = statusStr
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          return (
            <span
              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.statusPill} ${getStatusPillClass(statusStr)}`}
              title={`Status: ${display}`}
              aria-label={`Status: ${display}`}
            >
              {display}
            </span>
          );
        })()}
      </td>
      {showActionColumn && (
         <td className={`${styles.tableCell} text-sm text-gray-500`}>
          {isDrafts ? (
            <div className='flex items-center gap-1'>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleEditDraft(app.id);
                }}
                className='inline-flex items-center gap-0 px-2 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors'
                aria-label={`Edit draft application ${app.id}`}
              >
                <EditFixed className='w-4 h-4' />
              </button>
              <DeleteDraftButton appId={app.id} />
            </div>
          ) : (
            <button
              onClick={e => {
                e.stopPropagation();
                handleViewApplication(app.id);
              }}
              className='px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors'
              aria-label={`View application ${app.id}`}
            >
              View
            </button>
          )}
        </td>
      )}
    </tr>
  );
};

export default ApplicationTable;

// Small helper component for delete action to keep TableRow clean
const DeleteDraftButton: React.FC<{ appId: string | number }> = ({ appId }) => {
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = window.confirm(
      'Are you sure you want to delete this draft application? This action cannot be undone.'
    );
    if (!ok) return;
    try {
      setDeleting(true);
      await ApplicationApi.deleteApplication(String(appId));
      // Refresh the page to reflect deletion
      window.location.reload();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete application', err);
      window.alert('Failed to delete draft application. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className='inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors disabled:opacity-60'
      aria-label={`Delete draft application ${appId}`}
      title='Delete'
    >
      {deleting ? (
        'Deleting...'
      ) : (
        <>
          <TrashFixed className='w-4 h-4' />
        </>
      )}
    </button>
  );
};
