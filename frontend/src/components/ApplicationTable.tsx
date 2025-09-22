import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationData } from '../types';
import styles from './ApplicationTable.module.css';
import { useApplications } from '../context/ApplicationContext';
// Removed PDF generation feature
import { useAuth } from '../config/auth';
import { TableSkeleton } from './Skeleton';
// Note: Excel export uses dynamic import of 'xlsx' to avoid SSR issues

interface UserData {
  id: string;
  username: string;
  officeName: string;
  phoneNo: string;
  role: string;
  createdAt: string;
}

interface ApplicationTableProps {
  users?: UserData[];
  isLoading?: boolean;
  statusIdFilter?: string;
  applications?: ApplicationData[]; // Applications prop for backward compatibility
  filteredApplications?: ApplicationData[]; // Optional filtered applications list
}

const getStatusPillClass = (status: string) => {
  const normalized = (status || '').toString().toLowerCase().trim().replace(/[-\s]+/g, '_');
  const statusClasses: Record<string, string> = {
    pending: 'bg-[#FACC15] text-black',
    approved: 'bg-[#10B981] text-white',
    initiated: 'bg-[#A7F3D0] text-green-800',
    rejected: 'bg-[#EF4444] text-white',
    red_flagged: 'bg-[#DC2626] text-white',
    returned: 'bg-orange-400 text-white',
    sent: 'bg-blue-500 text-white',
    closed: 'bg-gray-500 text-white',
    disposed: 'bg-gray-400 text-white',
    final_disposal: 'bg-emerald-600 text-white',
    unknown: 'bg-gray-200 text-gray-800'
  };
  return statusClasses[normalized] || statusClasses.unknown;
};

const ApplicationTable: React.FC<ApplicationTableProps> = React.memo(({ users, applications, filteredApplications, isLoading = false, statusIdFilter }) => {
  // Get applications from context
  const { applications: contextApplications } = useApplications();

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
      let statusRaw: any = (app as any).status;
      const statusStr = typeof statusRaw === 'string' ? statusRaw : (statusRaw && statusRaw.name ? statusRaw.name : '');
      const status = statusStr.toLowerCase();
      return applicant.includes(q) || type.includes(q) || status.includes(q);
    });
  }, [baseApplications, searchQuery]);

  const router = useRouter();
  // Removed generatingPDF state after removing PDF button
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);
  const { userRole } = useAuth();

  const isApplicationUnread = useCallback((app: ApplicationData): boolean => {
    return app.forwardedTo === userRole && app.isViewed === false;
  }, [userRole]);

  const handleViewApplication = useCallback((id: string) => {
    router.push(`/application/${id}`);
  }, [router]);

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
      // Prepare data
      const rows = effectiveApplications.map(app => {
        const rawStatus: any = (app as any).status;
        const statusStr = typeof rawStatus === 'string' ? rawStatus : (rawStatus && rawStatus.name ? rawStatus.name : 'unknown');
        const displayStatus = statusStr
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        return {
          ID: app.id,
          ApplicantName: app.applicantName,
          ApplicationType: app.applicationType,
          ApplicationDate: formatDateTime(app.applicationDate),
          Status: displayStatus,
          ForwardedTo: (app as any).forwardedTo || '',
          IsViewed: (app as any).isViewed ? 'Yes' : 'No'
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
      const fileName = `applications_export_${new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      setSuccessMessage('Applications exported to Excel successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Excel export failed', err);
      setErrorMessage('Failed to export applications to Excel');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setExportingExcel(false);
    }
  }, [effectiveApplications, exportingExcel, formatDateTime]);

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
      {successMessage && (
        <Message type="success" message={successMessage} />
      )}

      {errorMessage && (
        <Message type="error" message={errorMessage} />
      )}

      <div className={`${styles.tableWrapper} w-full min-w-0`}>
        <table className="w-full table-auto">


          <thead className="bg-gray-50 sticky top-0">
            <TableHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExportExcel={handleExportExcel}
              exportingExcel={exportingExcel}
            />
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {effectiveApplications.map((app, index) => (
              <TableRow
                key={app.id}
                app={app}
                index={index}
                handleViewApplication={handleViewApplication}
                // PDF button removed
                isApplicationUnread={isApplicationUnread}
                formatDateTime={formatDateTime}
                getStatusPillClass={getStatusPillClass}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const Message: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => {
  const typeClasses = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800';
  return (
    <div className={`mb-4 p-3 border rounded-lg ${typeClasses}`}>
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          {type === 'success' ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          )}
        </svg>
        {message}
      </div>
    </div>
  );
};

interface TableHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExportExcel: () => void;
  exportingExcel: boolean;
}

const TableHeader: React.FC<TableHeaderProps> = ({ searchQuery, onSearchChange, onExportExcel, exportingExcel }) => (
  <>
    <tr className="align-top">
      <th colSpan={6} className="px-4 pt-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search (name, type, status)"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              aria-label="Search applications"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-600 transition-colors shadow-sm text-sm font-medium"
              aria-label={exportingExcel ? 'Exporting applications to Excel' : 'Download applications Excel file'}
              title={exportingExcel ? 'Exporting...' : 'Download Excel'}
            >
              {exportingExcel ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M4 4h16v4H4z" />
                    <path d="M4 20h16v-4H4z" />
                    <path d="M12 8v6" />
                    <path d="M9 11l3 3 3-3" />
                  </svg>
                  <span>Download Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </th>
    </tr>
    <tr>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">S.No</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Applicant Name</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Application Type</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Date & Time</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Status</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Action</th>
    </tr>
  </>
);

const TableRow: React.FC<{
  app: ApplicationData;
  index: number;
  handleViewApplication: (id: string) => void;
  // PDF generation removed
  isApplicationUnread: (app: ApplicationData) => boolean;
  formatDateTime: (dateStr: string) => string;
  getStatusPillClass: (status: string) => string;
}> = ({
  app,
  index,
  handleViewApplication,
  // Removed PDF props
  isApplicationUnread,
  formatDateTime,
  getStatusPillClass,
}) => (
    <tr
      key={app.id}
      className={`${styles.tableRow} ${isApplicationUnread(app) ? 'font-bold' : ''}`}
      aria-label={`Row for application ${app.id}`}
    >
      <td className={`px-6 py-4 whitespace-nowrap text-sm text-black`}>{index + 1}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium ">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewApplication(app.id);
          }}
          className={`text-blue-600 hover:text-blue-800 hover:underline transition-colors`}
          aria-label={`View details for application ${app.id}`}
        >
          {app.applicantName}
        </button>
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm text-black`}>{app.applicationType}</td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm text-black`}>{formatDateTime(app.applicationDate)}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        {(() => {
          const raw = (app as any).status; // supports flexible status sources
          const statusStr = typeof raw === 'string' ? raw : (raw && raw.name ? raw.name : 'unknown');
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewApplication(app.id);
          }}
          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
          aria-label={`View application ${app.id}`}
        >
          View
        </button>
      </td>
    </tr>
  );

export default ApplicationTable;
