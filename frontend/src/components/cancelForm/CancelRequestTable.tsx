'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Plus, ExternalLink } from 'lucide-react';
import CancelService from '@/api/cancelService';
import CancelRequestModal from './CancelRequestModal';

const LoaderFixed = Loader2 as any;

type CancelRequestRow = {
  id: string;
  applicationId: string;
  freshLicenseId: string;
  applicantName: string;
  actionTaken: string;
  actionTakenAt: string;
  cancellationReason: string;
  status: string;
};

const toUpper = (value: unknown): string => String(value || '').trim().toUpperCase();

export default function CancelRequestTable() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<CancelRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalApplicationId, setModalApplicationId] = useState<string | undefined>(undefined);

  // Check for query params to auto-open the modal
  useEffect(() => {
    const openNew = searchParams?.get('openNew');
    const applicationId = searchParams?.get('applicationId');

    if (openNew === 'true') {
      setModalApplicationId(applicationId || undefined);
      setShowModal(true);
    }
  }, [searchParams]);

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

        // freshLicenseId might be available directly or as applicationId
        const freshId = app?.freshLicenseId || app?.applicationId || app?.freshLicense?.id || '';

        return {
          id: String(app?.id || ''),
          applicationId: String(app?.applicationId || freshId || ''),
          freshLicenseId: String(freshId || ''),
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

  const handleOpenModal = (applicationId?: string) => {
    setModalApplicationId(applicationId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalApplicationId(undefined);
  };

  const handleSuccess = () => {
    fetchCancelRequests();
  };

  return (
    <div className='w-full'>
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Cancellation Requests</h1>
          <p className='text-sm text-gray-500 mt-1'>Manage applications requested for cancellation.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className='bg-alms-navy hover:bg-alms-navy-dark text-white font-medium py-2.5 px-5 rounded-lg flex items-center transition-colors shadow-sm text-sm'
        >
          <Plus className="w-4 h-4 mr-2" />
          New Cancel Request
        </button>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-xl p-4 mb-4'>
          <p className='text-red-700 text-sm'>{error}</p>
          <button
            onClick={fetchCancelRequests}
            className='mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium'
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex justify-center items-center'>
          <LoaderFixed className='w-6 h-6 animate-spin text-alms-navy mr-2' />
          <span className='text-gray-600'>Loading requests...</span>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className='text-gray-700 text-lg font-medium'>No cancellation requests found.</p>
          <button
            onClick={() => handleOpenModal()}
            className='mt-3 px-5 py-2 bg-alms-navy hover:bg-alms-navy-dark text-white rounded-lg transition-colors text-sm font-medium'
          >
            Create First Request
          </button>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto max-h-[60vh] overflow-y-auto'>
            <table className='w-full border-collapse'>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  <th className='px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200'>Cancel ID</th>
                  <th className='px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200'>App ID</th>
                  <th className='px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200'>Applicant</th>
                  <th className='px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200'>Reason</th>
                  <th className='px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200'>Status</th>
                  <th className='px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200'>Fresh App</th>
                  <th className='px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 bg-white'>
                {requests.map((req) => (
                  <tr key={req.id} className='hover:bg-gray-50 transition-colors duration-150'>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900 border-b border-gray-100'>#{req.id}</td>
                    <td className='px-6 py-4 text-sm text-gray-600 border-b border-gray-100'>App #{req.applicationId}</td>
                    <td className='px-6 py-4 text-sm text-gray-700 border-b border-gray-100'>{req.applicantName}</td>
                    <td className='px-6 py-4 text-sm text-gray-700 border-b border-gray-100 truncate max-w-[200px]' title={req.cancellationReason}>
                      {req.cancellationReason || '—'}
                    </td>
                    <td className='px-6 py-4 text-sm border-b border-gray-100'>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        req.actionTaken === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        req.actionTaken === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.actionTaken}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-center border-b border-gray-100'>
                      {req.freshLicenseId ? (
                        <a
                          href={`/application/${req.freshLicenseId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-alms-navy hover:bg-alms-navy-dark text-white rounded-lg transition-colors text-xs font-medium"
                          title="View original fresh application details"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View App
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-sm text-center border-b border-gray-100'>
                      <a
                        href={`/cancelForm/${req.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View & Process
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='bg-gray-50 px-6 py-4 border-t border-gray-200'>
             <p className='text-sm text-gray-600'>
               Total requests: <strong className="text-gray-900">{requests.length}</strong>
             </p>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      <CancelRequestModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        prefillApplicationId={modalApplicationId}
      />
    </div>
  );
}
