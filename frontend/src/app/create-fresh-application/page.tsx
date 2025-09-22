"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FreshApplicationForm from '../../components/FreshApplicationForm';
import { useAuthSync } from '../../hooks/useAuthSync';
import { fetchApplicationsByStatusKey } from '../../services/sidebarApiCalls';
import { FormSkeleton, PageLayoutSkeleton } from '../../components/Skeleton';

export default function CreateFreshApplicationPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const router = useRouter();

  // Simulate form initialization loading
  useEffect(() => {
    const initializeForm = setTimeout(() => {
      setIsFormLoading(false);
    }, 1000); // Simulate loading time for form initialization

    return () => clearTimeout(initializeForm);
  }, []);

  // Handle new application creation
  const handleNewApplication = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Show success message with acknowledgement number and additional details
      const acknowledgementNo = formData?.acknowledgementNo || '';
      const applicationId = formData?.applicationId || '';
      const applicantName = formData.applicantName || 'the applicant';
      
      if (acknowledgementNo) {
        let successMsg = `Application submitted successfully!\nAcknowledgement Number: ${acknowledgementNo}`;
        if (applicationId) {
          successMsg += `\nApplication ID: ${applicationId}`;
        }
        successMsg += `\nApplicant: ${applicantName}`;
        setSuccessMessage(successMsg);
      } else {
        setSuccessMessage(`Application has been successfully submitted for ${applicantName}`);
      }
      
      // Clear success message after 3 seconds and redirect with loading state
      setTimeout(() => {
        setIsRedirecting(true);
        setSuccessMessage(null);
        
        // Add slight delay for redirect loading state
        setTimeout(() => {
          router.push('/home?type=freshform'); // Redirect back to fresh form list (query-based)
        }, 500);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrorMessage('Failed to submit application. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push('/home?type=freshform'); // Redirect back to fresh form list (query-based)
    }, 300);
  };

  // Show skeleton loading while authenticating
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <PageLayoutSkeleton />;
  }

  // Show redirect loading
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show form loading skeleton
  if (isFormLoading) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url("/backgroundIMGALMS.jpeg")' }}>
        <div className="absolute inset-0 bg-white bg-opacity-30"></div>
        <div className="relative z-10 p-8">
          <FormSkeleton fields={15} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden overflow-x-hidden bg-cover bg-center bg-fixed font-[family-name:var(--font-geist-sans)] relative"
      style={{
        backgroundImage: 'url("/backgroundIMGALMS.jpeg")',
      }}
    >
      {/* Background overlay for opacity */}
      <div className="absolute inset-0 bg-white bg-opacity-30 pointer-events-none"></div>
      
      {/* Main Content */}
      <main className="w-screen h-full overflow-hidden px-1 sm:px-2 pt-2 pb-4">
        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 relative z-10">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="whitespace-pre-line">{successMessage}</div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 relative z-10">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Fresh Application Form */}
        <div className="h-full w-screen overflow-hidden relative z-10">
          {/* Submission Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4 shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-gray-700 font-medium">Submitting Application...</p>
                <p className="text-gray-500 text-sm text-center">
                  Please wait while we process your application.<br />
                  Do not refresh or close this page.
                </p>
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
