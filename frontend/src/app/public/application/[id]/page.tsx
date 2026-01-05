'use client';

import React, { useState, useEffect } from 'react';
import { PublicApi } from '../../../../config/APIClient';

interface PublicApplicationPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface PublicApplicationData {
  applicationId: number;
  acknowledgementNo: string | null;
  almsLicenseId: string | null;
  applicantName: string;
  sex: string;
  dateOfBirth: string | null;
  photoUrl: string | null;
  applicationStatus: string;
  statusCode: string | null;
  isApproved: boolean;
  isRejected: boolean;
  isPending: boolean;
  isRecommended: boolean;
  isNotRecommended: boolean;
  licenseDetails: Array<{
    needForLicense: string | null;
    armsCategory: string | null;
    areaOfValidity: string | null;
    requestedWeapons: Array<{
      name: string;
      description: string | null;
    }> | null;
  }> | null;
  permanentAddress: {
    state: string | null;
    district: string | null;
    policeStation: string | null;
  } | null;
  presentAddress: {
    state: string | null;
    district: string | null;
    policeStation: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public Application Details Page
 * Displays read-only application information for QR code scans
 * No authentication required
 */
export default function PublicApplicationPage({ params }: PublicApplicationPageProps) {
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [application, setApplication] = useState<PublicApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle params Promise for React 18 compatibility
  useEffect(() => {
    params.then(resolvedParams => {
      setApplicationId(resolvedParams.id);
    });
  }, [params]);

  // Fetch application details
  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await PublicApi.getApplicationDetails(applicationId);
        if (response.success && (response as any).data) {
          setApplication((response as any).data);
        } else {
          setError('Application not found');
        }
      } catch (err: any) {
        console.error('Error fetching public application:', err);
        setError(err?.message || 'Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  const getStatusColor = (status: string | null) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'forwarded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatLicensePurpose = (purpose: string | null) => {
    if (!purpose) return 'N/A';
    return purpose
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </div>
          <h1 className='text-xl font-bold text-gray-900 mb-2'>Application Not Found</h1>
          <p className='text-gray-600'>
            {error || 'The application you are looking for does not exist or has been removed.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-[#001F54] text-white py-6 shadow-lg'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  />
                </svg>
              </div>
              <div>
                <h1 className='text-xl font-bold'>Arms License Application</h1>
                <p className='text-sm text-white text-opacity-80'>Public Verification</p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(application.applicationStatus)}`}
            >
              {application.applicationStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto px-4 py-8'>
        {/* Application ID Card */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-500 font-medium'>Application ID</p>
              <p className='text-lg font-bold text-gray-900'>#{application.applicationId}</p>
            </div>
            {application.acknowledgementNo && (
              <div>
                <p className='text-sm text-gray-500 font-medium'>Acknowledgement No.</p>
                <p className='text-lg font-bold text-gray-900 font-mono'>
                  {application.acknowledgementNo}
                </p>
              </div>
            )}
            {application.almsLicenseId && (
              <div className='md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium'>License ID</p>
                <p className='text-lg font-bold text-green-600 font-mono'>
                  {application.almsLicenseId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Applicant Information */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h2 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
            <div className='w-1 h-5 bg-blue-600 rounded-full'></div>
            Applicant Information
          </h2>
          <div className='flex flex-col md:flex-row gap-6'>
            {/* Photo */}
            <div className='flex-shrink-0 flex justify-center md:justify-start'>
              {application.photoUrl ? (
                <img
                  src={application.photoUrl}
                  alt='Applicant Photo'
                  className='w-32 h-40 object-cover rounded-lg border-2 border-gray-200 shadow-sm'
                />
              ) : (
                <div className='w-32 h-40 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center'>
                  <svg
                    className='w-12 h-12 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
              )}
            </div>
            {/* Details */}
            <div className='flex-1 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Full Name</p>
                <p className='font-semibold text-gray-900'>{application.applicantName}</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Gender</p>
                <p className='font-semibold text-gray-900'>
                  {application.sex
                    ? application.sex.charAt(0) + application.sex.slice(1).toLowerCase()
                    : 'N/A'}
                </p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Date of Birth</p>
                <p className='font-semibold text-gray-900'>{formatDate(application.dateOfBirth)}</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Application Date</p>
                <p className='font-semibold text-gray-900'>{formatDate(application.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Status */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h2 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
            <div className='w-1 h-5 bg-purple-600 rounded-full'></div>
            Application Status
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div
              className={`rounded-lg p-4 text-center ${application.isApproved ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${application.isApproved ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                {application.isApproved && (
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                )}
              </div>
              <p className='text-sm font-medium text-gray-700'>Approved</p>
            </div>
            <div
              className={`rounded-lg p-4 text-center ${application.isRejected ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50'}`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${application.isRejected ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                {application.isRejected && (
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                )}
              </div>
              <p className='text-sm font-medium text-gray-700'>Rejected</p>
            </div>
            <div
              className={`rounded-lg p-4 text-center ${application.isRecommended ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${application.isRecommended ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                {application.isRecommended && (
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5'
                    />
                  </svg>
                )}
              </div>
              <p className='text-sm font-medium text-gray-700'>Recommended</p>
            </div>
            <div
              className={`rounded-lg p-4 text-center ${application.isPending ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50'}`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${application.isPending ? 'bg-yellow-500' : 'bg-gray-300'}`}
              >
                {application.isPending && (
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                )}
              </div>
              <p className='text-sm font-medium text-gray-700'>Pending</p>
            </div>
          </div>
        </div>

        {/* License Details */}
        {application.licenseDetails && application.licenseDetails.length > 0 && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
            <h2 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
              <div className='w-1 h-5 bg-green-600 rounded-full'></div>
              License Details
            </h2>
            {application.licenseDetails.map((license, index) => (
              <div key={index} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Purpose of License</p>
                  <p className='font-semibold text-gray-900'>
                    {formatLicensePurpose(license.needForLicense)}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Arms Category</p>
                  <p className='font-semibold text-gray-900'>
                    {license.armsCategory
                      ? license.armsCategory.charAt(0) + license.armsCategory.slice(1).toLowerCase()
                      : 'N/A'}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Area of Validity</p>
                  <p className='font-semibold text-gray-900'>{license.areaOfValidity || 'N/A'}</p>
                </div>
                {license.requestedWeapons && license.requestedWeapons.length > 0 && (
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-500 font-medium mb-1'>Requested Weapons</p>
                    <div className='flex flex-wrap gap-2 mt-1'>
                      {license.requestedWeapons.map((weapon, wIndex) => (
                        <span
                          key={wIndex}
                          className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium'
                        >
                          {weapon.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Address Information */}
        {(application.presentAddress || application.permanentAddress) && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
            <h2 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
              <div className='w-1 h-5 bg-orange-600 rounded-full'></div>
              Address Information
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {application.presentAddress && (
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3'>Present Address</h3>
                  <div className='bg-gray-50 rounded-lg p-4 space-y-2'>
                    {application.presentAddress.policeStation && (
                      <div>
                        <span className='text-xs text-gray-500'>Police Station:</span>
                        <p className='font-medium text-gray-900'>
                          {application.presentAddress.policeStation}
                        </p>
                      </div>
                    )}
                    {application.presentAddress.district && (
                      <div>
                        <span className='text-xs text-gray-500'>District:</span>
                        <p className='font-medium text-gray-900'>
                          {application.presentAddress.district}
                        </p>
                      </div>
                    )}
                    {application.presentAddress.state && (
                      <div>
                        <span className='text-xs text-gray-500'>State:</span>
                        <p className='font-medium text-gray-900'>
                          {application.presentAddress.state}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {application.permanentAddress && (
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3'>Permanent Address</h3>
                  <div className='bg-gray-50 rounded-lg p-4 space-y-2'>
                    {application.permanentAddress.policeStation && (
                      <div>
                        <span className='text-xs text-gray-500'>Police Station:</span>
                        <p className='font-medium text-gray-900'>
                          {application.permanentAddress.policeStation}
                        </p>
                      </div>
                    )}
                    {application.permanentAddress.district && (
                      <div>
                        <span className='text-xs text-gray-500'>District:</span>
                        <p className='font-medium text-gray-900'>
                          {application.permanentAddress.district}
                        </p>
                      </div>
                    )}
                    {application.permanentAddress.state && (
                      <div>
                        <span className='text-xs text-gray-500'>State:</span>
                        <p className='font-medium text-gray-900'>
                          {application.permanentAddress.state}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Notice */}
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 text-center'>
          <p className='text-sm text-blue-800'>
            <strong>Note:</strong> This is a read-only view of the application. For any
            modifications or queries, please contact the concerned authority.
          </p>
          <p className='text-xs text-blue-600 mt-2'>
            Last updated: {formatDate(application.updatedAt)}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-gray-100 border-t border-gray-200 py-4 mt-8'>
        <div className='max-w-4xl mx-auto px-4 text-center'>
          <p className='text-sm text-gray-600'>
            Arms License Management System (ALMS) - Public Verification Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
