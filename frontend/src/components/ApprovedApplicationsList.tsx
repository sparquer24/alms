'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/config/authenticatedApiClient';
import { ApplicationApi } from '@/config/APIClient';

const LoaderFixed = Loader2 as any;

type ApplicationRow = {
  id: string;
  acknowledgementNo: string;
  applicantName: string;
  applicantEmail: string;
  applicantMobile: string;
  actionTaken: string;
  actionTakenAt: string;
  createdAt: string;
  panNumber: string;
  aadharNumber: string;
  applicationType: string;
};

const toUpper = (value: unknown): string => String(value || '').trim().toUpperCase();

const isRenewalEligible = (actionTakenAt: string): boolean => {
  if (!actionTakenAt) return false;
  
  const actionDate = new Date(actionTakenAt);
  const now = new Date();
  
  // Calculate difference in years
  const diffTime = now.getTime() - actionDate.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  
  return diffYears >= 2;
};

export default function ApprovedApplicationsList() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'fresh' | 'renewal'>('fresh');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response: any;
      if (filterType === 'fresh') {
        response = await ApplicationApi.getAll({ search: 'APPROVED', isOwned: true, isSent: true } as any);
      } else {
        response = await apiClient.get('/renewal-forms', { status: 'APPROVED' });
      }

      const rawData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      const rows: ApplicationRow[] = rawData.map((app: any) => {
        const actionTaken = toUpper(
          app?.actionTaken || app?.workflowStatus?.code || app?.workflowStatus?.name || (app?.isApproved ? 'APPROVED' : ''),
        ) || 'APPROVED';

        return {
          id: String(app?.applicationId || app?.id || ''),
          acknowledgementNo: String(app?.acknowledgementNo || app?.applicationNumber || app?.acknowledgementNumber || ''),
          applicantName:
            String(app?.applicantName || [app?.firstName, app?.middleName, app?.lastName].filter(Boolean).join(' ') || 'Unknown'),
          applicantEmail: String(app?.email || app?.applicantEmail || ''),
          applicantMobile: String(app?.mobileNumber || app?.applicantMobile || ''),
          actionTaken,
          actionTakenAt: String(app?.actionTakenAt || app?.approvedAt || app?.updatedAt || app?.createdAt || ''),
          createdAt: String(app?.createdAt || ''),
          panNumber: String(app?.panNumber || ''),
          aadharNumber: String(app?.aadharNumber || ''),
          applicationType: String(app?.applicationType || (filterType === 'renewal' ? 'Renewal' : 'Fresh')),
        };
      });

      setApplications(rows);
    } catch (fetchError) {
      console.error('Error fetching applications:', fetchError);
      setError('Error loading applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    // Only show approved applications
    if (app.actionTaken !== 'APPROVED') return false;
    
    // Filter by application type
    if (filterType === 'fresh') {
      return app.applicationType && /fresh/i.test(app.applicationType);
    }
    return app.applicationType && /renewal/i.test(app.applicationType);
  });



  return (
    <div className='w-full'>
      <div className='bg-white rounded-lg shadow p-6 mb-4'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Approved Applications</h1>
          </div>
        </div>

        {/* Filter Radio Buttons */}
        <div className='mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
          <div className='mb-3 text-sm font-medium text-slate-700'>Filter by application type</div>
          <div className='flex flex-wrap items-center gap-4'>
            <label className='flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 cursor-pointer'>
              <input
                type='radio'
                name='application-type'
                value='fresh'
                checked={filterType === 'fresh'}
                onChange={() => setFilterType('fresh')}
                className='h-4 w-4 accent-blue-700'
              />
              Fresh Applications
            </label>
            <label className='flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 cursor-pointer'>
              <input
                type='radio'
                name='application-type'
                value='renewal'
                checked={filterType === 'renewal'}
                onChange={() => setFilterType('renewal')}
                className='h-4 w-4 accent-blue-700'
              />
              Renewal Applications
            </label>
          </div>
        </div>


      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
          <p className='text-red-700'>{error}</p>
          <button
            onClick={fetchApplications}
            className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition'
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className='bg-white rounded-lg shadow p-12 flex justify-center items-center'>
          <LoaderFixed className='w-6 h-6 animate-spin text-blue-600 mr-2' />
          <span className='text-gray-600'>Loading applications...</span>
        </div>
      )}

      {!loading && !error && filteredApplications.length === 0 && (
        <div className='bg-white rounded-lg shadow p-12 text-center'>
          <p className='text-gray-700 text-lg'>No applications found.</p>
        </div>
      )}

      {!loading && !error && filteredApplications.length > 0 && (
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='overflow-x-auto max-h-[60vh] overflow-y-auto'>
            <table className='w-full border-collapse'>
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>S.NO</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>ACKNOWLEDGEMENT NO</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>APPLICANT NAME</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>ACTION TAKEN</th>
                  <th className='px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>ACTION TIME</th>
                  <th className='px-6 py-3 text-center text-xs font-semibold text-black uppercase tracking-wider border-b border-gray-300'>ACTION</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {filteredApplications.map((app, index) => (
                  <tr key={app.id} className='hover:bg-blue-100 transition-colors duration-200 cursor-pointer'>
                    <td className='px-6 py-4 text-sm text-black border-b border-gray-200'>{index + 1}</td>
                    <td className='px-6 py-4 text-sm text-black border-b border-gray-200'>{app.acknowledgementNo || '-'}</td>
                    <td className='px-6 py-4 text-sm font-medium border-b border-gray-200'>
                      <button
                        onClick={() => window.open(`/application/${app.id}`, '_blank')}
                        className='text-blue-600 hover:text-blue-800 hover:underline transition-colors'
                      >
                        {app.applicantName}
                      </button>
                    </td>
                    <td className='px-6 py-4 text-sm border-b border-gray-200'>
                      <span className='inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold'>
                        {app.actionTaken}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-black border-b border-gray-200'>
                      {app.actionTakenAt ? new Date(app.actionTakenAt).toLocaleString() : '-'}
                    </td>
                    <td className='px-6 py-4 text-sm text-center border-b border-gray-200'>
                      {filterType === 'renewal' ? (
                        <span className='text-gray-500'>-</span>
                      ) : (
                        <button
                          onClick={() => window.open(`/forms/renewal?applicationId=${encodeURIComponent(app.id)}`, '_blank')}
                          disabled={!isRenewalEligible(app.actionTakenAt)}
                          title={!isRenewalEligible(app.actionTakenAt) ? 'Renewal available after 2 years from action date' : 'Click to start renewal'}
                          className={`px-3 py-1 rounded-md transition-colors text-sm font-medium ${
                            isRenewalEligible(app.actionTakenAt)
                              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Renewal
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='bg-white px-6 py-4 border-t border-gray-200'>
            <p className='text-sm text-gray-600'>
              Total applications: <strong>{filteredApplications.length}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
