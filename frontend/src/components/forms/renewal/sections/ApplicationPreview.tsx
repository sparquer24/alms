'use client';

import React from 'react';

interface ApplicationPreviewProps {
  formData: any;
}

export default function ApplicationPreview({ formData }: ApplicationPreviewProps) {
  return (
    <div className='p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-6'>
      <h2 className='text-xl font-bold text-gray-900 border-b pb-3'>Application Summary & Preview</h2>

      {/* Personal Information */}
      <div className='bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3'>
        <h3 className='font-semibold text-blue-900 text-base'>Personal Information</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
          <div>
            <span className='text-gray-500 block text-xs'>Applicant Name</span>
            <span className='font-medium text-gray-900'>{formData.applicantName || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>Father Name</span>
            <span className='font-medium text-gray-900'>{formData.fatherName || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>Gender</span>
            <span className='font-medium text-gray-900'>{formData.applicantGender || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>Mobile Number</span>
            <span className='font-medium text-gray-900'>{formData.applicantMobile || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>Email</span>
            <span className='font-medium text-gray-900'>{formData.applicantEmail || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>Aadhar Number</span>
            <span className='font-medium text-gray-900'>{formData.aadharNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className='bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3'>
        <h3 className='font-semibold text-blue-900 text-base'>Address Details</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-gray-500 block text-xs'>Present Address</span>
            <span className='font-medium text-gray-900'>{formData.presentAddress || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>Permanent Address</span>
            <span className='font-medium text-gray-900'>{formData.permanentAddress || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Occupation / Business */}
      <div className='bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3'>
        <h3 className='font-semibold text-blue-900 text-base'>Occupation / Business</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-gray-500 block text-xs'>Occupation</span>
            <span className='font-medium text-gray-900'>{formData.occupation || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>Office / Business Address</span>
            <span className='font-medium text-gray-900'>{formData.officeBusinessAddress || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* License & Weapon Details */}
      <div className='bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3'>
        <h3 className='font-semibold text-blue-900 text-base'>License Details</h3>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm'>
          <div>
            <span className='text-gray-500 block text-xs'>License Number</span>
            <span className='font-medium text-gray-900'>{formData.licenseNumber || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>License Type</span>
            <span className='font-medium text-gray-900'>{formData.licenseType || 'N/A'}</span>
          </div>
          <div>
            <span className='text-gray-500 block text-xs'>License Validity</span>
            <span className='font-medium text-gray-900'>{formData.licenseValidity || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
