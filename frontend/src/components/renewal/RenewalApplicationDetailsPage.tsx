'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RenewalService } from '../../api/renewalService';

interface RenewalApplicationDetails {
  id: number | string;
  acknowledgementNo?: string;
  licenseNumber?: string;
  applicantName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  parentOrSpouseName?: string;
  sex?: string;
  dateOfBirth?: string;
  dobInWords?: string;
  panNumber?: string;
  aadharNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  isSubmit?: boolean;
  workflowStatus?: {
    name?: string;
    code?: string;
  };
}

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString();
};

const getStatusLabel = (application: RenewalApplicationDetails | null) => {
  if (!application) return 'Unknown';
  return application.workflowStatus?.name || (application.isSubmit ? 'Submitted' : 'Draft');
};

const getStatusClass = (label: string) => {
  const normalized = label.toLowerCase();
  if (normalized.includes('draft')) return 'bg-slate-100 text-slate-700';
  if (normalized.includes('submit')) return 'bg-blue-100 text-blue-800';
  if (normalized.includes('approve')) return 'bg-green-100 text-green-800';
  if (normalized.includes('reject')) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
};

export default function RenewalApplicationDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [application, setApplication] = useState<RenewalApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplication = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await RenewalService.getRenewalForm(id);
        const root = (response as any)?.data ?? (response as any)?.body ?? response;
        const payload = root?.data && typeof root.data === 'object' && !Array.isArray(root.data) ? root.data : root;

        if (!payload) {
          throw new Error('Renewal application not found');
        }

        setApplication(payload as RenewalApplicationDetails);
      } catch (fetchError: any) {
        setApplication(null);
        setError(fetchError?.message || 'Failed to load renewal application');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id]);

  const statusLabel = getStatusLabel(application);

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center px-4'>
        <div className='rounded-2xl bg-white px-8 py-10 shadow-lg border border-slate-200 text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700' />
          <p className='text-slate-600'>Loading renewal application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center px-4'>
        <div className='max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200 text-center'>
          <h1 className='text-2xl font-bold text-slate-900'>Renewal Application Not Found</h1>
          <p className='mt-3 text-slate-600'>{error || 'The selected renewal application could not be loaded.'}</p>
          <div className='mt-6 flex flex-wrap justify-center gap-3'>
            <button
              type='button'
              onClick={() => router.back()}
              className='rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
            >
              Go Back
            </button>
            <button
              type='button'
              onClick={() => router.push('/inbox?type=freshform')}
              className='rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800'
            >
              Back to Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  const applicantName =
    application.applicantName ||
    [application.firstName, application.middleName, application.lastName].filter(Boolean).join(' ') ||
    'N/A';

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-5xl 2xl:max-w-[1200px]'>
        <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
          <div className='bg-gradient-to-r from-[#001F54] to-[#0d2f6b] px-6 py-5 text-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm text-blue-100'>Renewal Application</p>
              <h1 className='text-2xl font-semibold'>Application #{application.id}</h1>
            </div>
            <span className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(statusLabel)}`}>
              {statusLabel}
            </span>
          </div>

          <div className='grid gap-6 p-6 md:grid-cols-2'>
            <InfoCard label='Applicant Name' value={applicantName} />
            <InfoCard label='Licence Number' value={application.licenseNumber || 'N/A'} />
            <InfoCard label='Acknowledgement No.' value={application.acknowledgementNo || 'N/A'} />
            <InfoCard label='Father / Spouse Name' value={application.parentOrSpouseName || 'N/A'} />
            <InfoCard label='Gender' value={application.sex || 'N/A'} />
            <InfoCard label='Date of Birth' value={formatDateTime(application.dateOfBirth)} />
            <InfoCard label='PAN Number' value={application.panNumber || 'N/A'} />
            <InfoCard label='Aadhaar Number' value={application.aadharNumber || 'N/A'} />
            <InfoCard label='Created At' value={formatDateTime(application.createdAt)} />
            <InfoCard label='Updated At' value={formatDateTime(application.updatedAt)} />
          </div>

          <div className='border-t border-slate-200 px-6 py-5 flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={() => router.push(`/forms/renewal?renewalId=${encodeURIComponent(String(id))}`)}
              className='rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800'
            >
              Open Renewal Form
            </button>
            <button
              type='button'
              onClick={() => router.back()}
              className='rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</p>
    <p className='mt-2 text-sm font-medium text-slate-900 break-words'>{value}</p>
  </div>
);