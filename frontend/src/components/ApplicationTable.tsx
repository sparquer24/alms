import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationData } from '../config/mockData';
import styles from './ApplicationTable.module.css';
import { generateApplicationPDF } from '../config/pdfUtils';
import BatchProcessingModal from './BatchProcessingModal';
import { useAuth } from '../config/auth';

interface ApplicationTableProps {
  applications: ApplicationData[];
  isLoading?: boolean;
}

const ApplicationTable: React.FC<ApplicationTableProps> = ({ applications, isLoading = false }) => {
  const router = useRouter();
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const { userRole } = useAuth();
  
  // Function to determine if an application is unread/unopened
  const isApplicationUnread = (app: ApplicationData): boolean => {
    // Check if the application is forwarded to the current user's role
    // and hasn't been viewed yet
    return app.forwardedTo === userRole && app.isViewed === false;
  };
  
  const handleViewApplication = (id: string) => {
    // In a real app, you would make an API call here to mark the application as viewed
    // For now, we're just navigating to the application detail page
    
    // Example of how you would mark the application as viewed:
    // api.markApplicationAsViewed(id).then(() => {
    //   router.push(`/application/${id}`);
    // });
    
    router.push(`/application/${id}`);
  };

  // Function to generate PDF for an application
  const handleGeneratePDF = async (app: ApplicationData) => {
    try {
      setGeneratingPDF(app.id);
      await generateApplicationPDF(app);
      setGeneratingPDF(null);
      setSuccessMessage(`PDF for application ${app.id} generated successfully`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch {
      setGeneratingPDF(null);
      setErrorMessage(`Failed to generate PDF for application ${app.id}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };
  
  // Handle selection of an application
  const toggleApplicationSelection = (id: string, event?: React.MouseEvent) => {
    // If the event comes from a button click within the row, don't toggle selection
    if (event?.defaultPrevented) {
      return;
    }
    
    event?.preventDefault(); // Prevent default to avoid any browser navigation
    event?.stopPropagation(); // Stop event propagation
    
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApplications(newSelected);
  };

  // Handle select all toggle
  const toggleSelectAll = () => {
    if (selectedApplications.size === applications.length) {
      // If all selected, clear selection
      setSelectedApplications(new Set());
    } else {
      // Otherwise select all
      const allIds = applications.map(app => app.id);
      setSelectedApplications(new Set(allIds));
    }
  };

  // Handle batch processing
  const handleOpenBatchModal = () => {
    if (selectedApplications.size === 0) {
      setErrorMessage("Please select at least one application");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    setIsBatchModalOpen(true);
  };

  const handleProcessBatch = async (action: string, selectedApps: ApplicationData[], comment: string) => {
    // This is where API calls would be made to process the applications
    console.log(`Processing ${selectedApps.length} applications with action: ${action}`);
    console.log('Comment:', comment);
    
    // In a real app, you would make the API call here
    // For now, we'll simulate a delay and show a success message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset selection
    setSelectedApplications(new Set());
    
    // Show success message
    setSuccessMessage(`Successfully processed ${selectedApps.length} application(s) with action: ${action}`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Format date and time as DD.MM.YYYY HH:MM:SS
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  if (isLoading) {
    return (
      <div className={`${styles.tableContainer} min-w-full overflow-hidden rounded-lg shadow`}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className={`${styles.tableContainer} min-w-full overflow-hidden rounded-lg shadow`}>
        <div className={styles.emptyState}>
          No applications found matching your criteria.
        </div>
      </div>
    );
  }

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FACC15] text-black';
      case 'approved':
        return 'bg-[#10B981] text-white';
      case 'initiated':
        return 'bg-[#A7F3D0] text-green-800';
      case 'rejected':
        return 'bg-[#EF4444] text-white';
      case 'red-flagged':
        return 'bg-[#DC2626] text-white';
      case 'returned':
        return 'bg-orange-400 text-white';
      case 'disposed':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Filter selected applications
  const selectedApps = applications.filter(app => selectedApplications.has(app.id));

  return (
    <div className={`${styles.tableContainer} min-w-full overflow-hidden rounded-lg shadow`}>
      {/* Display messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Batch operations bar */}
      {selectedApplications.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
          <div className="text-blue-800">
            <span className="font-semibold">{selectedApplications.size}</span> application(s) selected
          </div>
          <div className="flex space-x-2">            <button 
              className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-[#EEF2FF] text-sm"
              onClick={() => setSelectedApplications(new Set())}
            >
              Clear Selection
            </button>
            <button 
              className="px-3 py-1 bg-[#6366F1] text-white rounded-md hover:bg-[#3B82F6] text-sm"
              onClick={handleOpenBatchModal}
            >
              Process Selected
            </button>
          </div>
        </div>
      )}

      <div className={`${styles.tableWrapper} overflow-x-auto`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-4 py-3 text-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                  checked={selectedApplications.size === applications.length && applications.length > 0}
                  onChange={toggleSelectAll}
                  aria-label="Select all applications"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                S.No
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Applicant Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                ALIS Acknowledgment No
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
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">{applications.map((app, index) => (
            <tr key={app.id} className={`${styles.tableRow} ${selectedApplications.has(app.id) ? 'bg-[#1e3a8a] text-white' : ''} ${isApplicationUnread(app) ? 'font-bold' : ''}`} onClick={(e) => toggleApplicationSelection(app.id, e)} style={{ cursor: 'pointer' }}>
              <td className="px-4 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer" checked={selectedApplications.has(app.id)} onChange={(e) => {e.stopPropagation();e.preventDefault();toggleApplicationSelection(app.id);}} aria-label={`Select application ${app.id}`}/>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${selectedApplications.has(app.id) ? 'text-white' : 'text-black'}`}>{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => {e.stopPropagation();handleViewApplication(app.id);}} className={`${selectedApplications.has(app.id) ? 'text-white hover:text-gray-200' : 'text-blue-600 hover:text-blue-800'} hover:underline transition-colors`} aria-label={`View details for application ${app.id}`}>{app.id}</button>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${selectedApplications.has(app.id) ? 'text-white' : 'text-black'}`}>{app.applicantName}</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${selectedApplications.has(app.id) ? 'text-white' : 'text-black'} font-mono`}>0000 0000 0000 0000</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${selectedApplications.has(app.id) ? 'text-white' : 'text-black'}`}>{app.applicationType}</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${selectedApplications.has(app.id) ? 'text-white' : 'text-black'}`}>{formatDateTime(app.applicationDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClass(app.status)}`} title={`Status: ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`}>{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => {e.stopPropagation();handleGeneratePDF(app);}} disabled={generatingPDF === app.id} className="px-3 py-1 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] transition-colors mr-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  {generatingPDF === app.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating
                    </span>
                  ) : "PDF"}
                </button>
                <button onClick={(e) => {e.stopPropagation();handleViewApplication(app.id);}} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors">View</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Batch processing modal */}
      <BatchProcessingModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        applications={selectedApps}
        onProcessBatch={handleProcessBatch}
      />
    </div>
  );
};

export default ApplicationTable;
