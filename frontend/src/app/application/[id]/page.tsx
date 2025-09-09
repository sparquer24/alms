"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useAuthSync } from '../../../hooks/useAuthSync';
import { useLayout } from '../../../config/layoutContext';
import { getApplicationByApplicationId, ApplicationData } from '../../../services/sidebarApiCalls';
import ProcessApplicationModal from '../../../components/ProcessApplicationModal';
import ForwardApplicationModal from '../../../components/ForwardApplicationModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
// ApplicationTimeline import removed (using EnhancedApplicationTimeline instead)
import EnhancedApplicationTimeline from '../../../components/EnhancedApplicationTimeline';
import { generateApplicationPDF, getApplicationPrintHTML } from '../../../config/pdfUtils';
import ProceedingsForm from '../../../components/ProceedingsForm';

interface ApplicationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { isAuthenticated, userRole, isLoading: authLoading } = useAuthSync();
  const router = useRouter();
  const { setShowHeader, setShowSidebar } = useLayout();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'return' | 'flag' | 'dispose' | 'recommend' | 'not-recommend' | 're-enquiry'>('approve');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState({
    title: '',
    message: '',
    actionButtonText: '',
    actionButtonColor: '',
    onConfirm: () => {}
  });
  const [showProceedingsModal, setShowProceedingsModal] = useState(false);
  const [showProceedingsForm, setShowProceedingsForm] = useState(false);
  const [showTimelineDetails, setShowTimelineDetails] = useState(false);
  const [timelineDetails, setTimelineDetails] = useState({
    user1: false,
    user2: false,
    user3: false
  });
  const [showActions, setShowActions] = useState(true);
  const [showApplicationHistory, setShowApplicationHistory] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});
  const printRef = useRef<HTMLDivElement>(null);
  
  // Unwrap params using React.use()
  const resolvedParams = React.use(params);
  const applicationId = resolvedParams.id;
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  
  useEffect(() => {
    // Hide header and sidebar on the Application Detail page
    setShowHeader(false);
    setShowSidebar(false);
    
    return () => {
      // Reset visibility when unmounting
      setShowHeader(true);
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);
  
  useEffect(() => {
    // Fetch application using the new API function
    const fetchApplication = async () => {
      setLoading(true);
      try {
        // Access the id directly from params
        const id = applicationId;
        const app = await getApplicationByApplicationId(id);
        setApplication(app || null);
      } catch (error) {
        console.error('Error fetching application:', error);
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);
  
  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSearch = (query: string) => {
    // Navigate back to main page with search query
    router.push(`/?search=${encodeURIComponent(query)}`);
  };

  const handleDateFilter = (startDate: string, endDate: string) => {
    // Navigate back to main page with date filters
    router.push(`/?startDate=${startDate}&endDate=${endDate}`);
  };
  const handleReset = () => {
    // Navigate back to main page with no filters
    router.push('/');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 shadow-sm';
      case 'returned':
        return 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm';
      case 'red-flagged':
        return 'bg-red-50 text-red-700 border-red-200 shadow-sm';
      case 'disposed':
        return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
    }
  };
    const handleProcessApplication = (
    action: string,
    reason: string
  ) => {
    if (!application) return;

    // In a real app, this would be an API call
    // For now, we'll just update the local state to simulate the change
    const updatedApplication = { ...application };
    
    switch (action) {
      case 'approve':
        updatedApplication.status = 'approved';
        setSuccessMessage('Application has been approved successfully');
        break;
      case 'reject':
        updatedApplication.status = 'rejected';
        setSuccessMessage('Application has been rejected');
        break;
      case 'return':
        updatedApplication.status = 'returned';
        updatedApplication.returnReason = reason;
        setSuccessMessage('Application has been returned to the applicant');
        break;
      case 'flag':
        updatedApplication.status = 'red-flagged';
        updatedApplication.flagReason = reason;
        setSuccessMessage('Application has been red-flagged');
        break;
      case 'dispose':
        updatedApplication.status = 'disposed';
        updatedApplication.disposalReason = reason;
        setSuccessMessage('Application has been disposed');
        break;
      case 'recommend':
        // In a real app, this would change the status differently based on the role
        updatedApplication.status = 'pending';
        setSuccessMessage('Application has been recommended for approval');
        break;
      case 'not-recommend':
        // In a real app, this would change the status differently based on the role
        updatedApplication.status = 'pending';
        setSuccessMessage('Application has been marked as not recommended');
        break;
      case 're-enquiry':
        updatedApplication.status = 'pending';
        setSuccessMessage('Application has been marked for re-enquiry');
        break;
    }
    
    updatedApplication.lastUpdated = new Date().toISOString().split('T')[0];
    setApplication(updatedApplication);
    setIsProcessModalOpen(false);
    
    // In a real app, you would redirect to the appropriate list view
    // based on the new status
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };
    const handleForwardApplication = (recipient: string, comments: string) => {
    if (!application) return;

    // In a real app, this would be an API call
    const updatedApplication = { ...application };
    updatedApplication.forwardedFrom = userRole;
    updatedApplication.forwardedTo = recipient;
    updatedApplication.forwardComments = comments; // Store comments
    updatedApplication.lastUpdated = new Date().toISOString().split('T')[0];
    
    setApplication(updatedApplication);
    setIsForwardModalOpen(false);
    setSuccessMessage(`Application has been forwarded to ${recipient}`);
    
    // In a real app, you would redirect to the sent view
    setTimeout(() => {
      router.push('/sent');
    }, 2000);  };
  
  // Enhanced print function using our PDF utility
  const handleExportPDF = async () => {
    if (!application) return;
    
    try {
      setIsPrinting(true);
      // Generate and download the PDF
      await generateApplicationPDF(application);
      setSuccessMessage("PDF generated and downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setErrorMessage("Failed to generate PDF. Please try again.");
    } finally {
      setIsPrinting(false);
      setShowPrintOptions(false);
    }
  };
  
  // Simple print method using browser's print dialog
  const handleBrowserPrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow || !application) return;
    
    // Use our HTML generator function for consistent formatting
    const printContent = getApplicationPrintHTML(application);
    
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application ${application.id} - Print</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          ${printContent}
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print();">Print</button>
            <button onclick="window.close();">Close</button>
          </div>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setShowPrintOptions(false);
  };

  const handleProceedingsSuccess = () => {
    setShowProceedingsForm(false);
    setSuccessMessage('Proceedings action completed successfully');
    // Optionally refresh the application data or redirect
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };
  
  // Guard: Only render content after auth is resolved
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading application...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    // Optionally, you can return null or a redirect message
    return null;
  }

  return (
    <div className="min-h-screen w-screen h-screen bg-cover bg-center overflow-auto" style={{ backgroundImage: 'url("/backgroundIMGALMS.jpeg")' }}>
      <Sidebar />
      <Header 
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
              {/* New Header with #001F54 background */}
              <div className="bg-[#001F54] p-6 lg:p-8 flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => router.back()}
                    className="mr-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#001F54]"
                    aria-label="Go back"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        Arms License
                      </h1>
                      <p className="text-white text-opacity-80 mt-1">
                        {application ? `Application ID: ${application.id}` : 'Loading Application...'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-4 py-2 text-sm font-semibold rounded-full border-2 ${
                    application ? getStatusBadgeClass(application.status) : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {application ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Loading'}
                  </span>
                  
                  {/* Profile Logo */}
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="text-gray-600 font-medium">Loading application details...</p>
                  </div>
                </div>
              ) : application ? (
                <>
                  {/* Applicant Information Block */}
                  <div className="p-6 lg:p-8" ref={printRef}>
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
                        Applicant Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Applicant Name</p>
                          <p className="font-semibold text-gray-900">{application.applicantName}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Father's Name</p>
                          <p className="font-semibold text-gray-900">{application.fatherName || "Keshav Prasad"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Mobile Number</p>
                          <p className="font-semibold text-gray-900">{application.applicantMobile}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Email ID</p>
                          <p className="font-semibold text-gray-900">{application.applicantEmail || "applicant@gmail.com"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Gender</p>
                          <p className="font-semibold text-gray-900">{application.gender || "Male"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Date of Birth</p>
                          <p className="font-semibold text-gray-900">{application.dob || "01/01/1980"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 md:col-span-2 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Address</p>
                          <p className="font-semibold text-gray-900">{application.address || "123, Example Street, Sample District, State - 110001"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Application Type</p>
                          <p className="font-semibold text-gray-900">{application.applicationType}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <p className="text-sm text-gray-500 font-medium mb-1">Date & Time of Submission</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(application.applicationDate).toLocaleDateString()} 
                            {application.applicationTime || "10:30 AM"}
                          </p>
                        </div>
                        
                        {application.assignedTo && (
                          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <p className="text-sm text-gray-500 font-medium mb-1">Assigned To</p>
                            <p className="font-semibold text-gray-900">{application.assignedTo}</p>
                          </div>
                        )}
                        
                        {application.forwardedFrom && (
                          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <p className="text-sm text-gray-500 font-medium mb-1">Forwarded From</p>
                            <p className="font-semibold text-gray-900">{application.forwardedFrom}</p>
                          </div>
                        )}
                        
                        {application.forwardedTo && (
                          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <p className="text-sm text-gray-500 font-medium mb-1">Forwarded To</p>
                            <p className="font-semibold text-gray-900">{application.forwardedTo}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status-specific information */}
                    {(application.returnReason || application.flagReason || application.disposalReason) && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <div className="w-1 h-5 bg-orange-500 rounded-full mr-3"></div>
                          Additional Information
                        </h3>
                        
                        {application.returnReason && (
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-4">
                            <h4 className="font-bold text-orange-800 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Return Reason
                            </h4>
                            <p className="text-gray-900">{application.returnReason}</p>
                          </div>
                        )}

                        {application.flagReason && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                            <h4 className="font-bold text-red-800 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                              </svg>
                              Red Flag Reason
                            </h4>
                            <p className="text-gray-900">{application.flagReason}</p>
                          </div>
                        )}

                        {application.disposalReason && (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                              Disposal Reason
                            </h4>
                            <p className="text-gray-900">{application.disposalReason}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents Section */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <div className="w-1 h-6 bg-green-600 rounded-full mr-3"></div>
                        Documents Uploaded
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* If documents are available in application data, use them */}
                        {application.documents && application.documents.length > 0 ? (
                          application.documents.map((doc, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-lg mr-3 ${
                                    doc.type === 'image' ? 'bg-green-100 text-green-600' : 
                                    doc.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      {doc.type === 'image' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      )}
                                    </svg>
                                  </div>
                                  <span className="font-medium text-gray-900">{doc.name}</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => window.open(doc.url, '_blank')}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                                  >
                                    View
                                  </button>
                                  <a 
                                    href={doc.url} 
                                    download 
                                    className="text-gray-600 hover:text-gray-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    Download
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Default documents if none are provided
                          <>
                            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="p-2 rounded-lg mr-3 bg-blue-100 text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <span className="font-medium text-gray-900">Aadhaar Card</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                    View
                                  </button>
                                  <button className="text-gray-600 hover:text-gray-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="p-2 rounded-lg mr-3 bg-blue-100 text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <span className="font-medium text-gray-900">Proof of Address</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                    View
                                  </button>
                                  <button className="text-gray-600 hover:text-gray-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="p-2 rounded-lg mr-3 bg-green-100 text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <span className="font-medium text-gray-900">Passport Photo</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                    View
                                  </button>
                                  <button className="text-gray-600 hover:text-gray-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="p-2 rounded-lg mr-3 bg-red-100 text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <span className="font-medium text-gray-900">Other Supporting Documents</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                    View
                                  </button>
                                  <button className="text-gray-600 hover:text-gray-800 font-medium text-sm px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons and Timeline Section */}
                  <div className="p-6 lg:p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Action Buttons - Left Side */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <div className="w-1 h-5 bg-blue-600 rounded-full mr-3"></div>
                            Actions
                          </h3>
                          <button
                            onClick={() => setShowActions(!showActions)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {showActions ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        
                        {showActions && (
                          <>
                            <div className="flex flex-col gap-4">
                              {/* Print/Export Button */}
                              <button
                                onClick={() => setShowPrintOptions(true)}
                                className="flex items-center px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                                </svg>
                                Print/Export
                              </button>

                              {/* Proceedings Button */}
                              <button
                                onClick={() => setShowProceedingsForm(!showProceedingsForm)}
                                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {showProceedingsForm ? 'Hide Proceedings' : 'Proceedings'}
                              </button>
                            </div>

                            {/* Inline Proceedings Form */}
                            {showProceedingsForm && (
                              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                                  <div className="w-1 h-4 bg-blue-600 rounded-full mr-2"></div>
                                  Proceedings Form
                                </h4>
                                <ProceedingsForm 
                                  applicationId={applicationId} 
                                  onSuccess={handleProceedingsSuccess}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Application Timeline/History - Right Side */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <div className="w-1 h-5 bg-green-600 rounded-full mr-3"></div>
                            Application History
                          </h3>
                          <button
                            onClick={() => setShowApplicationHistory(!showApplicationHistory)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            {showApplicationHistory ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        
                        {showApplicationHistory && application && (
                          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            {application.history && application.history.length > 0 ? (
                              <div className="space-y-4">
                                {application.history.map((h, idx) => {
                                  const color = h.action.toLowerCase().includes('forward')
                                    ? 'border-orange-500'
                                    : h.action.toLowerCase().includes('approve')
                                    ? 'border-green-500'
                                    : h.action.toLowerCase().includes('reject') || h.action.toLowerCase().includes('return')
                                    ? 'border-red-500'
                                    : 'border-blue-500';
                                  return (
                                    <div key={idx} className={`border-l-2 ${color} pl-4`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{h.by || 'Unknown User'}</p>
                                          <p className="text-sm text-gray-600">{h.action}</p>
                                          <p className="text-xs text-gray-500">{h.date} {h.time}</p>
                                        </div>
                                        {h.comments && (
                                          <button
                                            type="button"
                                            onClick={() => setExpandedHistory(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                            className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            aria-expanded={!!expandedHistory[idx]}
                                            aria-controls={`history-remarks-${idx}`}
                                            aria-label={expandedHistory[idx] ? 'Hide' : 'Show'}
                                          >
                                            {expandedHistory[idx] ? 'Hide' : 'Show'}
                                          </button>
                                        )}
                                      </div>
                                      {h.comments && expandedHistory[idx] && (
                                        <div id={`history-remarks-${idx}`} className="mt-3 p-3 bg-gray-50 rounded-lg">
                                          <p className="text-sm text-gray-700">{h.comments}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No history available for this application.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Process Application Modal */}
                  {application && (
                    <ProcessApplicationModal
                      application={application}
                      isOpen={isProcessModalOpen}
                      onClose={() => setIsProcessModalOpen(false)}
                      onProcess={handleProcessApplication}
                      initialAction={selectedAction}
                    />
                  )}

                  {/* Forward Application Modal */}
                  {application && (
                    <ForwardApplicationModal
                      application={application}
                      isOpen={isForwardModalOpen}
                      onClose={() => setIsForwardModalOpen(false)}
                      onForward={handleForwardApplication}
                    />
                  )}
                  
                  {/* Print Options Modal */}
                  {application && showPrintOptions && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 lg:p-8 border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center">
                            <div className="w-2 h-6 bg-blue-600 rounded-full mr-3"></div>
                            <h3 className="text-xl font-bold text-gray-900">Print Options</h3>
                          </div>
                          <button
                            onClick={() => setShowPrintOptions(false)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all duration-200" onClick={handleBrowserPrint}>
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Print using browser</h4>
                                <p className="text-sm text-gray-600 mt-1">Opens a printable view in a new window</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all duration-200" onClick={handleExportPDF}>
                            <div className="flex items-center">
                              <div className="bg-green-100 p-3 rounded-xl mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Export as PDF</h4>
                                <p className="text-sm text-gray-600 mt-1">Download application as a PDF document</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Loading indicator while PDF is being generated */}
                        {isPrinting && (
                          <div className="mt-6 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl p-4">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-medium">Generating PDF...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Confirmation Modal */}
                  <ConfirmationModal 
                    isOpen={showConfirmation}
                    onClose={() => setShowConfirmation(false)}
                    onConfirm={confirmationDetails.onConfirm}
                    title={confirmationDetails.title}
                    message={confirmationDetails.message}
                    actionButtonText={confirmationDetails.actionButtonText}
                    actionButtonColor={confirmationDetails.actionButtonColor}
                  />

                  {/* Proceedings Modal */}
                  {showProceedingsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
                        <div className="flex justify-between items-center p-6 lg:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-center">
                            <div className="w-2 h-8 bg-blue-600 rounded-full mr-4"></div>
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">Proceedings</h2>
                              <p className="text-gray-600 mt-1">Process application #{applicationId}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowProceedingsModal(false)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-6 lg:p-8">
                          <ProceedingsForm 
                            applicationId={applicationId} 
                            onSuccess={handleProceedingsSuccess}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Application not found</p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-4 px-4 py-2 text-[#6366F1] border border-[#6366F1] rounded-md hover:bg-[#EEF2FF]"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
    );
}
