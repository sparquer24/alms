import React from 'react';
import QRCodeDisplay from '../../../components/QRCodeDisplay';
import { formatGender, formatApplicationType, formatPhone, formatStatusLabel } from '../../../utils/formatters';

interface ApplicantInfoSectionProps {
  application: any;
  applicationId: string | null;
  userRole: string;
  handleBrowserPrint: () => void;
  printRef: React.RefObject<HTMLDivElement>;
}

export default function ApplicantInfoSection({
  application,
  applicationId,
  userRole,
  handleBrowserPrint,
  printRef
}: ApplicantInfoSectionProps) {
  const applicantName = [
    application?.firstName,
    application?.middleName,
    application?.lastName,
  ]
    .filter(Boolean)
    .join(' ') ||
    application?.applicantName ||
    'N/A';

  return (
    <div className='p-6 lg:p-8' ref={printRef}>
      <div className='mb-8'>
        <h2 className='text-xl font-bold text-gray-900 mb-6 flex items-center justify-between'>
          <span className='flex items-center'>
            <div className='w-1 h-6 bg-blue-600 rounded-full mr-3'></div>
            Applicant Information
          </span>
          <div className='flex items-center space-x-2'>
            <button
              type='button'
              onClick={handleBrowserPrint}
              className='inline-flex items-center px-3 py-1.5 bg-white text-[#001F54] border border-gray-200 rounded-md shadow-sm text-sm hover:bg-gray-50'
              title='Print application details'
            >
              Print
            </button>
          </div>
        </h2>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main details - left (spans 2/3) */}
          <div className='lg:col-span-2'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6'>
              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Full Name</p>
                <p className='font-semibold text-gray-900'>{applicantName}</p>
              </div>

              {application?.parentOrSpouseName && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Parent/Spouse Name</p>
                  <p className='font-semibold text-gray-900'>{application.parentOrSpouseName}</p>
                </div>
              )}

              {application?.sex && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Gender</p>
                  <p className='font-semibold text-gray-900'>{formatGender(application.sex)}</p>
                </div>
              )}

              {application?.placeOfBirth && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Place of Birth</p>
                  <p className='font-semibold text-gray-900'>{application.placeOfBirth}</p>
                </div>
              )}

              {(application?.dateOfBirth || application?.dob) && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Date of Birth</p>
                  <p className='font-semibold text-gray-900'>
                    {application?.dateOfBirth
                      ? new Date(application.dateOfBirth).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : application?.dob
                        ? new Date(application.dob).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                  </p>
                  {application?.dobInWords && (
                    <p className='text-xs text-gray-500 mt-1 italic'>{application.dobInWords}</p>
                  )}
                </div>
              )}

              {application?.panNumber && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>PAN Number</p>
                  <p className='font-semibold text-gray-900 font-mono'>{application.panNumber}</p>
                </div>
              )}

              {application?.aadharNumber && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Aadhar Number</p>
                  <p className='font-semibold text-gray-900 font-mono'>{application.aadharNumber}</p>
                </div>
              )}

              {application?.acknowledgementNo && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Acknowledgement Number</p>
                  <p className='font-semibold text-gray-900 font-mono'>{application.acknowledgementNo}</p>
                </div>
              )}

              {application?.currentUser && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Current User</p>
                  <p className='font-semibold text-gray-900'>{application.currentUser.username}</p>
                </div>
              )}

              {application?.workflowStatus && (
                <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                  <p className='text-sm text-gray-500 font-medium mb-1'>Workflow Status</p>
                  <p className='font-semibold text-gray-900'>{formatStatusLabel(application.workflowStatus)}</p>
                </div>
              )}

              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Application Type</p>
                <p className='font-semibold text-gray-900'>{formatApplicationType(application?.applicationType)}</p>
              </div>

              <div className='bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-shadow md:col-span-2'>
                <p className='text-sm text-gray-500 font-medium mb-1'>Date & Time of Submission</p>
                <p className='font-semibold text-gray-900'>
                  {application?.applicationDate
                    ? new Date(application.applicationDate).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Right-side card - photo in top-right and form-like summary */}
          <aside className='lg:col-span-1 border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm h-fit'>
            <div className='ml-2 '>
              <img
                src={application?.photoUrl || ''}
                alt='Applicant Photo'
                className='w-60 h-60 object-cover rounded-md border'
              />
            </div>

            {application && (
              <div className='mt-4'>
                <QRCodeDisplay applicationId={application.id} userRole={userRole} />
              </div>
            )}

            <div className='mt-6 bg-white rounded-lg p-4 border border-gray-100'>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>Profile</h3>
              <dl className='grid grid-cols-1 gap-y-2 text-sm text-gray-700'>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Application ID</dt>
                  <dd className='font-medium'>{application?.id || applicationId || '—'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Name</dt>
                  <dd className='font-medium'>{applicantName}</dd>
                </div>
                {application?.parentOrSpouseName && (
                  <div className='flex justify-between'>
                    <dt className='text-gray-500'>Parent / Spouse</dt>
                    <dd className='font-medium'>{application.parentOrSpouseName}</dd>
                  </div>
                )}
                {application?.mobileNumber && (
                  <div className='flex justify-between'>
                    <dt className='text-gray-500'>Mobile</dt>
                    <dd className='font-medium'>{formatPhone(application.mobileNumber)}</dd>
                  </div>
                )}
                {application?.email && (
                  <div className='flex justify-between'>
                    <dt className='text-gray-500'>Email</dt>
                    <dd className='font-medium truncate'>{application.email}</dd>
                  </div>
                )}
                {(application?.dateOfBirth || application?.dob) && (
                  <div className='flex justify-between'>
                    <dt className='text-gray-500'>DOB</dt>
                    <dd className='font-medium'>
                      {application?.dateOfBirth
                        ? new Date(application.dateOfBirth).toLocaleDateString('en-IN')
                        : application?.dob
                          ? new Date(application.dob).toLocaleDateString('en-IN')
                          : '—'}
                    </dd>
                  </div>
                )}
                {application?.sex && (
                  <div className='flex justify-between'>
                    <dt className='text-gray-500'>Gender</dt>
                    <dd className='font-medium'>{formatGender(application.sex)}</dd>
                  </div>
                )}
                {application?.aadharNumber && (
                  <div className='flex justify-between'>
                    <dt className='text-gray-500'>Aadhar</dt>
                    <dd className='font-medium font-mono'>{application.aadharNumber}</dd>
                  </div>
                )}
                {application?.panNumber && (
                  <div className='flex justify-between'>
                    <dt className='text-gray-500'>PAN</dt>
                    <dd className='font-medium font-mono'>{application.panNumber}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
