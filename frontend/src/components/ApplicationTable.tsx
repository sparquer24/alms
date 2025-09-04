import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationData } from '../services/sidebarApiCalls';
import styles from './ApplicationTable.module.css';
import { useApplications } from '../context/ApplicationContext';
import { generateApplicationPDF } from '../config/pdfUtils';
import { useAuth } from '../config/auth';

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

const getStatusValue = (status: any): string => {
  if (typeof status === 'string') {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  if (status && typeof status === 'object' && status.name) {
    return status.name.charAt(0).toUpperCase() + status.name.slice(1);
  }
  return 'Unknown';
};

const getStatusPillClass = (status: string) => {
  const statusClasses: Record<string, string> = {
    pending: 'bg-[#FACC15] text-black',
    approved: 'bg-[#10B981] text-white',
    initiated: 'bg-[#A7F3D0] text-green-800',
    rejected: 'bg-[#EF4444] text-white',
    'red-flagged': 'bg-[#DC2626] text-white',
    returned: 'bg-orange-400 text-white',
    disposed: 'bg-gray-400 text-gray-800',
    unknown: 'bg-gray-200 text-gray-800',
  };
  return statusClasses[status.toLowerCase()] || 'bg-gray-200 text-gray-800';
};

const ApplicationTable: React.FC<ApplicationTableProps> = React.memo(({ users, applications, filteredApplications, isLoading = false, statusIdFilter }) => {
  // Get applications from context
  const { applications: contextApplications } = useApplications();
  
  // Use applications in this order: filtered -> prop -> context -> empty array
  const effectiveApplications = filteredApplications || applications || contextApplications || [];

  const router = useRouter();
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { userRole } = useAuth();

  const isApplicationUnread = useCallback((app: ApplicationData): boolean => {
    return app.forwardedTo === userRole && app.isViewed === false;
  }, [userRole]);

  const handleViewApplication = useCallback((id: string) => {
    router.push(`/application/${id}`);
  }, [router]);

  const handleGeneratePDF = useCallback(async (app: ApplicationData) => {
    try {
      setGeneratingPDF(app.id);
      await generateApplicationPDF(app);
      setGeneratingPDF(null);
      setSuccessMessage(`PDF for application ${app.id} generated successfully`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      setGeneratingPDF(null);
      setErrorMessage(`Failed to generate PDF for application ${app.id}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, []);

  const formatDateTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }, []);

  if (isLoading) {
    return (
      <div className={`${styles.tableContainer} min-w-full overflow-hidden rounded-lg shadow`}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
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

      <div className="w-full overflow-x-auto min-w-0">
        <table className="w-full table-auto">


          <thead className="bg-gray-50 sticky top-0 z-10">
            <TableHeader />
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {effectiveApplications.map((app, index) => (
              <TableRow
                key={app.id}
                app={app}
                index={index}
                handleViewApplication={handleViewApplication}
                handleGeneratePDF={handleGeneratePDF}
                generatingPDF={generatingPDF}
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

const TableHeader: React.FC = () => (
  <tr>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
      S.No
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
      Applicant Name
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
      Application Type
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
      Date & Time
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
      Status
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
      Actions
    </th>
  </tr>
);

const TableRow: React.FC<{
  app: ApplicationData;
  index: number;
  handleViewApplication: (id: string) => void;
  handleGeneratePDF: (app: ApplicationData) => void;
  generatingPDF: string | null;
  isApplicationUnread: (app: ApplicationData) => boolean;
  formatDateTime: (dateStr: string) => string;
  getStatusPillClass: (status: string) => string;
}> = ({
  app,
  index,
  handleViewApplication,
  handleGeneratePDF,
  generatingPDF,
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
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
      <span
        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(getStatusValue(app.status))}`}
        title={`Status: ${getStatusValue(app.status)}`}
        aria-label={`Status: ${getStatusValue(app.status)}`}
      >
        {getStatusValue(app.status)}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleGeneratePDF(app);
        }}
        disabled={generatingPDF === app.id}
        className="px-3 py-1 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] transition-colors mr-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        aria-label={`Generate PDF for application ${app.id}`}
      >
        {generatingPDF === app.id ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating
          </span>
        ) : (
          'PDF'
        )}
      </button>
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
