"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import ApplicationTable from '../../components/ApplicationTable';
import FreshApplicationForm from '../../components/FreshApplicationForm';
import { useLayout } from '../../config/layoutContext';
import { useAuthSync } from '../../hooks/useAuthSync';
import { mockApplications, filterApplications, getApplicationsByStatus, ApplicationData } from '../../config/mockData';
import { generateApplicationPDF, generateBatchReportPDF, getBatchReportHTML } from '../../config/pdfUtils';
import { getRoleConfig } from '../../config/roles';
import { isZS, APPLICATION_TYPES } from '../../config/helpers';
import 'react-toastify/dist/ReactToastify.css';

export default function FreshFormPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);  const [showNewForm, setShowNewForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingBulkAction, setProcessingBulkAction] = useState(false);  const [reportType, setReportType] = useState<'individual' | 'batch'>('individual');
  const { isAuthenticated, userRole, isLoading: authLoading } = useAuthSync();
  const { setShowHeader, setShowSidebar } = useLayout();
  const router = useRouter();
  
  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    // Check if the user has permission to view fresh forms
    const roleConfig = getRoleConfig(userRole);
    if (!roleConfig.permissions.includes('canViewFreshForm')) {
      // Redirect to dashboard or show access denied
      router.push('/');
      return;
    }
  }, [isAuthenticated, router, userRole]);
  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);
  
  useEffect(() => {
    // Hide header and sidebar on the Create Fresh Application page when form is shown
    if (showNewForm) {
      setShowHeader(false);
      setShowSidebar(false);
    } else {
      setShowHeader(true);
      setShowSidebar(true);
    }
    
    return () => {
      // Reset visibility when unmounting
      setShowHeader(true);
      setShowSidebar(true);
    };
  }, [showNewForm, setShowHeader, setShowSidebar]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDateFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };
  // Filter applications based on freshform and search/date filters
  const filteredApplications = filterApplications(
    getApplicationsByStatus(mockApplications, 'freshform'),
    searchQuery,
    startDate,
    endDate
  );

  const handleNewApplication = () => {
    setShowNewForm(true);
  };

  const handleCancelForm = () => {
    setShowNewForm(false);
  };

  const handleSubmitApplication = (newApplication: ApplicationData) => {
    // In a real app, this would be an API call to save the application
    console.log('New application submitted:', newApplication);
    
    // Add new application to the mockApplications array
    mockApplications.unshift(newApplication);
    
    // Show success message
    setSuccessMessage(`Application ${newApplication.id} has been successfully submitted`);
    
    // Hide the form
    setShowNewForm(false);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Function to handle PDF exports
  const handleExport = async (exportType: 'individual' | 'batch') => {
    if (filteredApplications.length === 0) {
      setErrorMessage("No applications to export");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setProcessingBulkAction(true);
    
    try {
      if (exportType === 'individual') {
        // Generate individual PDFs
        let successCount = 0;
        let errorCount = 0;
        
        // Generate PDFs sequentially to avoid browser performance issues
        for (const app of filteredApplications) {
          try {
            await generateApplicationPDF(app);
            successCount++;
          } catch (error) {
            console.error(`Error generating PDF for application ${app.id}:`, error);
            errorCount++;
          }
        }
        
        // Show appropriate message
        if (errorCount === 0) {
          setSuccessMessage(`Successfully generated ${successCount} individual PDF files`);
        } else {
          setSuccessMessage(`Generated ${successCount} PDF files with ${errorCount} errors`);
        }
      } else {
        // Generate a single batch report PDF
        await generateBatchReportPDF(
          filteredApplications,
          `Fresh Applications Report (${filteredApplications.length} applications)`
        );
        setSuccessMessage('Successfully generated batch report PDF');
      }
    } catch (error) {
      console.error("Error in PDF generation:", error);
      setErrorMessage("Failed to generate PDF(s)");
    } finally {
      setProcessingBulkAction(false);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
    }
  };

  // Function to print batch report in the browser
  const handlePrintBatchReport = () => {
    if (filteredApplications.length === 0) {
      setErrorMessage("No applications to print");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        setErrorMessage("Pop-up blocked. Please allow pop-ups to print the report.");
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      
      // Get the HTML content for the report
      const reportHTML = getBatchReportHTML(
        filteredApplications,
        `Fresh Applications Report (${filteredApplications.length} applications)`
      );
      
      // Write the HTML content to the new window
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fresh Applications Report</title>
        </head>
        <body>
          ${reportHTML}
          <script>
            window.onload = function() {
              window.print();
              // Uncomment the line below if you want the window to close after printing
              // setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      setSuccessMessage('Print dialog opened in a new window');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error in browser printing:", error);
      setErrorMessage("Failed to print report");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Handler for create application dropdown
  const handleCreateApplication = (typeKey: string) => {
    if (typeKey === 'fresh') {
      handleNewApplication();
    }
  };

  // Handler for showing messages from Header
  const handleShowMessage = (msg: string, type?: 'info' | 'error' | 'success') => {
    if (type === 'error') {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div
      className="flex min-h-screen w-screen min-w-0 font-[family-name:var(--font-geist-sans)] bg-cover bg-center relative"
      style={{ backgroundImage: 'url(/backgroundIMGALMS.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center', width: '100vw', height: '100vh' }}
    >
      <Sidebar />
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
        userRole={userRole}
        onCreateApplication={handleCreateApplication}
        onShowMessage={handleShowMessage}
      />

      <main className={`flex-1 min-w-0 p-8 ${!showNewForm ? 'ml-[18%] mt-[70px]' : ''} relative z-10 overflow-y-auto`}> 
        <div className="rounded-xl shadow-lg w-full min-w-0 p-0 md:p-6">
          <div className="flex justify-between items-center mb-6">
            {/* Search bar and filters will be here (already present) */}
          </div>
          <div className="flex space-x-2">
            {!showNewForm && filteredApplications.length > 0 && (
              <div className="flex items-center space-x-2">
                {/* Export options */}
                <div className="relative inline-block">
                  <select 
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md border border-gray-300 appearance-none pr-8"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'individual' | 'batch')}
                    disabled={processingBulkAction}
                  >
                    <option value="individual">Individual PDFs</option>
                    <option value="batch">Single Batch Report</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* PDF Export Button */}
                <button
                  className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  onClick={() => handleExport(reportType)}
                  disabled={processingBulkAction || filteredApplications.length === 0}
                >
                  {processingBulkAction ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
                
                {/* Print Button */}
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  onClick={handlePrintBatchReport}
                  disabled={processingBulkAction || filteredApplications.length === 0}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Report
                </button>
              </div>
            )}
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </div>
            </div>
          )}
          
          {showNewForm ? (
            // Display the form for creating a new application
            <FreshApplicationForm
              onSubmit={(formData) => {
                // Convert FormData to ApplicationData if needed, or just log for now
                // You may need to map fields if you want to add to mockApplications
                console.log('New application submitted:', formData);
                setSuccessMessage('Application has been successfully submitted');
                setShowNewForm(false);
                setTimeout(() => setSuccessMessage(null), 5000);
              }}
              onCancel={handleCancelForm}
            />
          ) : (
            // Display the regular list view
            <>
              {/* Display search and filter information if applied */}
              {(searchQuery || startDate || endDate) && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="font-semibold text-blue-700">Active Filters:</h3>
                  <div className="mt-2 text-sm text-gray-700 space-y-1">
                    {searchQuery && <p>Search: {searchQuery}</p>}
                    {(startDate || endDate) && (
                      <p>Date Range: {startDate || "Any"} to {endDate || "Any"}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Show application count */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {filteredApplications.length} fresh application form(s)
                </p>
              </div>

              {/* Display the application table */}
              <ApplicationTable
                applications={filteredApplications}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
