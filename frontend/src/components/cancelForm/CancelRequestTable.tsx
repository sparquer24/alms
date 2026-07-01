'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import CancelService from '@/api/cancelService';

const LoaderFixed = Loader2 as any;

type CancelRequestRow = {
  id: string;
  applicationId: string;
  applicantName: string;
  actionTaken: string;
  actionTakenAt: string;
  cancellationReason: string;
  status: string;
};

const toUpper = (value: unknown): string => String(value || '').trim().toUpperCase();

export default function CancelRequestTable() {
  const [requests, setRequests] = useState<CancelRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCancelRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await CancelService.getCancelWorkflowApplications();

      const rawData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      const rows: CancelRequestRow[] = rawData.map((app: any) => {
        const actionTaken = toUpper(
          app?.actionTaken || app?.workflowStatus?.code || app?.workflowStatus?.name || app?.status || 'PENDING',
        );

        return {
          id: String(app?.id || ''),
          applicationId: String(app?.applicationId || ''),
          applicantName: String(app?.applicantName || 'Applicant'),
          actionTaken,
          actionTakenAt: String(app?.actionTakenAt || app?.updatedAt || app?.createdAt || ''),
          cancellationReason: String(app?.cancellationReason || app?.remarks || ''),
          status: String(app?.status || 'PENDING'),
        };
      });

      setRequests(rows);
    } catch (fetchError) {
      console.error('Error fetching cancel requests:', fetchError);
      setError('Error loading cancel requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCancelRequests();
  }, [fetchCancelRequests]);

  return (
    <div className='w-full'>
      <div className='bg-white rounded-lg shadow p-6 mb-4 flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Cancellation Requests</h1>
          <p className='text-sm text-gray-500 mt-1'>Manage applications requested for cancellation.</p>
        </div>
        <button
          onClick={() => window.open('/cancelForm/new', '_blank')}
          className='bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors shadow-sm'
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Cancel Request
        </button>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
          <p className='text-red-700'>{error}</p>
          <button
            onClick={fetchCancelRequests}
            className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition'
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className='bg-white rounded-lg shadow p-12 flex justify-center items-center'>
          <LoaderFixed className='w-6 h-6 animate-spin text-red-600 mr-2' />
          <span className='text-gray-600'>Loading requests...</span>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className='bg-white rounded-lg shadow p-12 text-center'>
          <p className='text-gray-700 text-lg'>No cancellation requests found.</p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='overflow-x-auto max-h-[60vh] overflow-y-auto'>
            <table className='w-full border-collapse'>
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>CANCEL ID</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>TARGET APP ID</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>REASON</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>STATUS</th>
                  <th className='px-6 py-3 text-center text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>ACTION</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {requests.map((req) => (
                  <tr key={req.id} className='hover:bg-red-50 transition-colors duration-200 cursor-pointer'>
                    <td className='px-6 py-4 text-sm font-medium text-black border-b border-gray-200'>#{req.id}</td>
                    <td className='px-6 py-4 text-sm text-gray-600 border-b border-gray-200'>App #{req.applicationId}</td>
                    <td className='px-6 py-4 text-sm text-gray-700 border-b border-gray-200 truncate max-w-[200px]' title={req.cancellationReason}>
                      {req.cancellationReason}
                    </td>
                    <td className='px-6 py-4 text-sm border-b border-gray-200'>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        req.actionTaken === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        req.actionTaken === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.actionTaken}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-center border-b border-gray-200'>
                      <button
                        onClick={() => window.open(`/cancelForm/${req.id}`, '_blank')}
                        className='px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors text-sm font-medium'
                      >
                        View & Process
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='bg-gray-50 px-6 py-4 border-t border-gray-200'>
             <p className='text-sm text-gray-600'>
               Total requests: <strong>{requests.length}</strong>
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
