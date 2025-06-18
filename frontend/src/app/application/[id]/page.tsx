"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useAuth } from '../../../config/auth';
import { useLayout } from '../../../config/layoutContext';
import { mockApplications, ApplicationData } from '../../../config/mockData';
import ProcessApplicationModal from '../../../components/ProcessApplicationModal';
import ForwardApplicationModal from '../../../components/ForwardApplicationModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
// ApplicationTimeline import removed (using EnhancedApplicationTimeline instead)
import EnhancedApplicationTimeline from '../../../components/EnhancedApplicationTimeline';
import { generateApplicationPDF, getApplicationPrintHTML } from '../../../config/pdfUtils';

interface ApplicationDetailPageProps {
  params: {
    id: string;
  };
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { isAuthenticated, userRole } = useAuth();
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
  const printRef = useRef<HTMLDivElement>(null);  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
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
    // In a real application, this would be an API call
    const fetchApplication = () => {
      setLoading(true);
      setTimeout(() => {
        // Access the id directly from params
        const id = params.id;
        const app = mockApplications.find(app => app.id === id);
        setApplication(app || null);
        setLoading(false);
      }, 500); // Simulate network delay
    };

    fetchApplication();
  }, [params]);
  
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'returned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'red-flagged':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disposed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
    const handleProcessApplication = (
    action: 'approve' | 'reject' | 'return' | 'flag' | 'dispose' | 'recommend' | 'not-recommend' | 're-enquiry',
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
  };  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header 
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />      <main className="flex-1 p-8 overflow-y-auto">
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          </div>
        )}
          {/* Header Section (per spec item 1) */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4 md:p-6 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-600 hover:text-gray-800 focus:outline-none"
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <h1 className="text-xl font-bold text-gray-900">
                {application ? `Application Details - ${application.id}` : 'Loading Application...'}
              </h1>
            </div>
            
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${application ? getStatusBadgeClass(application.status) : 'bg-gray-100'}`}>
              {application ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Loading'}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6366F1]"></div>
            </div>
          ) : application ? (
            <>
              {/* Applicant Information Block (per spec item 2) */}
              <div className="p-6" ref={printRef}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">Applicant Name</p>
                    <p className="font-medium text-black">{application.applicantName}</p>
                  </div>
                    <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">Father&apos;s Name</p>
                    <p className="font-medium text-black">{application.fatherName || "Keshav Prasad"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">Mobile Number</p>
                    <p className="font-medium text-black">{application.applicantMobile}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">Email ID</p>
                    <p className="font-medium text-black">{application.applicantEmail || "applicant@gmail.com"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">Gender</p>
                    <p className="font-medium text-black">{application.gender || "Male"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">DOB</p>
                    <p className="font-medium text-black">{application.dob || "01/01/1980"}</p>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-gray-500 font-medium">Address</p>
                    <p className="font-medium text-black">{application.address || "123, Example Street, Sample District, State - 110001"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">ALIS Acknowledgment No</p>
                    <p className="font-medium text-black">{application.id}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">Application Type</p>
                    <p className="font-medium text-black">{application.applicationType}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-medium">Date & Time of Submission</p>
                    <p className="font-medium text-black">
                      {new Date(application.applicationDate).toLocaleDateString()} 
                      {application.applicationTime || "10:30 AM"}
                    </p>
                  </div>
                  
                  {application.assignedTo && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Assigned To</p>
                      <p className="font-medium text-black">{application.assignedTo}</p>
                    </div>
                  )}
                  
                  {application.forwardedFrom && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Forwarded From</p>
                      <p className="font-medium text-black">{application.forwardedFrom}</p>
                    </div>
                  )}
                  
                  {application.forwardedTo && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Forwarded To</p>
                      <p className="font-medium text-black">{application.forwardedTo}</p>
                    </div>
                  )}
                </div>

                {/* Status-specific information */}
                {(application.returnReason || application.flagReason || application.disposalReason) && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                    
                    {application.returnReason && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-md mb-3">
                        <h4 className="font-bold text-orange-800 mb-1">Return Reason</h4>
                        <p className="text-black">{application.returnReason}</p>
                      </div>
                    )}

                    {application.flagReason && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-3">
                        <h4 className="font-bold text-red-800 mb-1">Red Flag Reason</h4>
                        <p className="text-black">{application.flagReason}</p>
                      </div>
                    )}

                    {application.disposalReason && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <h4 className="font-bold text-gray-800 mb-1">Disposal Reason</h4>
                        <p className="text-black">{application.disposalReason}</p>
                      </div>
                    )}
                  </div>
                )}
                  {/* Documents Section (per spec item 3) */}
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents Uploaded</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* If documents are available in application data, use them */}
                    {application.documents && application.documents.length > 0 ? (
                      application.documents.map((doc, index) => (
                        <div key={index} className="document-item flex items-center justify-between border border-gray-200 rounded-md p-3 hover:shadow-sm transition-all">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" 
                              className={`h-8 w-8 mr-3 ${
                                doc.type === 'image' ? 'text-green-500' : 
                                doc.type === 'pdf' ? 'text-red-500' : 'text-blue-500'
                              }`} 
                              fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                              {doc.type === 'image' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              )}
                            </svg>
                            <span className="font-medium">{doc.name}</span>
                          </div>
                          <div>
                            <button 
                              onClick={() => window.open(doc.url, '_blank')}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-2"
                            >
                              View
                            </button>
                            <a 
                              href={doc.url} 
                              download 
                              className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Default documents if none are provided
                      <>
                        <div className="document-item flex items-center justify-between border border-gray-200 rounded-md p-3 hover:shadow-sm transition-all">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Aadhaar Card</span>
                          </div>
                          <div>
                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-2">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 font-medium text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                        
                        <div className="document-item flex items-center justify-between border border-gray-200 rounded-md p-3 hover:shadow-sm transition-all">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Proof of Address</span>
                          </div>
                          <div>
                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-2">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 font-medium text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                        
                        <div className="document-item flex items-center justify-between border border-gray-200 rounded-md p-3 hover:shadow-sm transition-all">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Passport Photo</span>
                          </div>
                          <div>
                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-2">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 font-medium text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                        
                        <div className="document-item flex items-center justify-between border border-gray-200 rounded-md p-3 hover:shadow-sm transition-all">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Other Supporting Documents</span>
                          </div>
                          <div>
                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-2">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 font-medium text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>              {/* Action Buttons Section (per spec item 4) */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex flex-wrap gap-3 justify-end shadow-md">
                {application.actions && (
                  <>
                    {application.actions.canApprove && (
                      <button
                        onClick={() => {
                          setSelectedAction('approve');
                          setConfirmationDetails({
                            title: 'Approve Application',
                            message: `Are you sure you want to approve application ${application.id} for ${application.applicantName}?`,
                            actionButtonText: 'Approve',
                            actionButtonColor: 'bg-green-500 hover:bg-green-600',
                            onConfirm: () => setIsProcessModalOpen(true)
                          });
                          setShowConfirmation(true);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition font-medium"
                      >
                        Approve
                      </button>
                    )}
                    
                    {application.actions.canReject && (
                      <button
                        onClick={() => {                        setSelectedAction('reject');
                        setConfirmationDetails({
                          title: 'Reject Application',
                          message: `Are you sure you want to reject application ${application.id} for ${application.applicantName}?`,
                          actionButtonText: 'Reject',
                          actionButtonColor: 'bg-red-500 hover:bg-red-600',
                          onConfirm: () => setIsProcessModalOpen(true)
                        });
                        setShowConfirmation(true);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition font-medium"
                    >
                      Reject
                    </button>
                    )}
                    
                    {/* These recommendation buttons don't have specific permission flags,
                        so we'll show them if the user can forward applications */}
                    {application.actions.canForward && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedAction('recommend');
                            setConfirmationDetails({
                              title: 'Recommend Application',
                              message: `Are you sure you want to recommend application ${application.id} for ${application.applicantName}?`,
                              actionButtonText: 'Recommend',
                              actionButtonColor: 'bg-indigo-500 hover:bg-indigo-600',
                              onConfirm: () => setIsProcessModalOpen(true)
                            });
                            setShowConfirmation(true);
                          }}
                          className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition font-medium"
                        >
                          Recommend
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedAction('not-recommend');
                            setConfirmationDetails({
                              title: 'Not Recommend Application',
                              message: `Are you sure you want to not recommend application ${application.id} for ${application.applicantName}?`,
                              actionButtonText: 'Not Recommend',
                              actionButtonColor: 'bg-gray-500 hover:bg-gray-600',
                              onConfirm: () => setIsProcessModalOpen(true)
                            });
                            setShowConfirmation(true);
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium"
                        >
                          Not Recommend
                        </button>
                      </>
                    )}
                      {/* Re-Enquiry button can be shown if the user can return applications */}
                    {application.actions.canReturn && (
                      <button
                        onClick={() => {
                          setSelectedAction('re-enquiry');
                          setConfirmationDetails({
                            title: 'Request Re-Enquiry',
                            message: `Are you sure you want to request re-enquiry for application ${application.id} for ${application.applicantName}?`,
                            actionButtonText: 'Re-Enquiry',
                            actionButtonColor: 'bg-amber-500 hover:bg-amber-600',
                            onConfirm: () => setIsProcessModalOpen(true)
                          });
                          setShowConfirmation(true);
                        }}
                        className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition font-medium"
                      >
                        Re-Enquiry
                      </button>
                    )}
                  </>
                )}                  {application.actions?.canForward && (
                    <button
                      onClick={() => {
                        setConfirmationDetails({
                          title: 'Forward Application',
                          message: `Do you want to forward application ${application.id} for ${application.applicantName} to another officer?`,
                          actionButtonText: 'Forward',
                          actionButtonColor: 'bg-blue-500 hover:bg-blue-600',
                          onConfirm: () => setIsForwardModalOpen(true)
                        });
                        setShowConfirmation(true);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium"
                    >
                      Forward
                    </button>
                  )}
                  
                  {application.actions?.canReport && (
                    <button
                      onClick={() => setShowPrintOptions(true)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print/Export
                    </button>
                  )}
                  {/* Timeline button is always shown regardless of permissions */}
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
                </button>
              </div>
                {/* Application Timeline/History (per spec item 5) */}
              {showTimeline && application && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Application History</h2>
                  <EnhancedApplicationTimeline application={application} />
                </div>
              )}{/* Process Application Modal */}
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
              
              {/* Print Options Modal */}              {/* Print Options Modal */}
              {application && showPrintOptions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Print Options</h3>
                      <button
                        onClick={() => setShowPrintOptions(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer" onClick={handleBrowserPrint}>
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium">Print using browser</h4>
                            <p className="text-sm text-gray-500">Opens a printable view in a new window</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer" onClick={handleExportPDF}>
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium">Export as PDF</h4>
                            <p className="text-sm text-gray-500">Download application as a PDF document</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Loading indicator while PDF is being generated */}
                    {isPrinting && (
                      <div className="mt-4 flex items-center justify-center text-[#6366F1]">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating PDF...
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
