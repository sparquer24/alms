'use client';

import React, { useEffect, useState } from 'react';
import CancelService from '@/api/cancelService';

interface CancelRequestDetailProps {
  request: any;
}

export default function CancelRequestDetail({ request }: CancelRequestDetailProps) {
  if (!request) return null;

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
      <div className='p-6 md:p-8'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>
              Cancellation Request #{request.id}
            </h2>
            <p className='text-gray-500 mt-2 font-medium'>
              For Application ID: {request.freshLicenseId} 
              <span className='ml-2 inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200'>
                {request.applicationType}
              </span>
            </p>
          </div>
          <div>
            <span
              className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                request.status === 'APPROVED' || request.workflowStatus?.code === 'APPROVED'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : request.status === 'REJECTED' || request.workflowStatus?.code === 'REJECTED'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}
            >
              {request.status || request.workflowStatus?.name || 'PENDING'}
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
          {/* Details Section */}
          <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
            <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2'>
              Request Details
            </h3>
            
            <div className='space-y-4'>
              <div>
                <p className='text-xs text-gray-500 font-medium mb-1'>Reason for Cancellation</p>
                <p className='text-gray-900 font-medium'>{request.cancellationReason}</p>
              </div>

              {request.remarks && (
                <div>
                  <p className='text-xs text-gray-500 font-medium mb-1'>Additional Remarks</p>
                  <p className='text-gray-800 text-sm bg-white p-3 border border-gray-200 rounded-md'>
                    {request.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
            <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2'>
              Timeline & Metadata
            </h3>
            
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <p className='text-xs text-gray-500 font-medium'>Requested By</p>
                <p className='text-gray-900 font-medium text-sm'>
                  {request.requester?.username || 'Unknown User'}
                  {request.requester?.role?.name && <span className="ml-1 text-xs text-gray-500">({request.requester.role.name})</span>}
                </p>
              </div>

              <div className='flex justify-between items-center'>
                <p className='text-xs text-gray-500 font-medium'>Requested Date</p>
                <p className='text-gray-900 font-medium text-sm'>
                  {request.requestedDate ? new Date(request.requestedDate).toLocaleString() : new Date(request.createdAt).toLocaleString()}
                </p>
              </div>

              {(request.actionedDate || request.updatedAt) && request.status !== 'PENDING' && (
                <div className='flex justify-between items-center pt-2 border-t border-gray-200'>
                  <p className='text-xs text-gray-500 font-medium'>Actioned Date</p>
                  <p className='text-gray-900 font-medium text-sm'>
                    {new Date(request.actionedDate || request.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
