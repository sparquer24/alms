'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RenewalService } from '../../api/renewalService';
import { getStatusStyle } from '../../utils/statusColors';
import RenewalApplicationDetailsHeader from './renewalapplicationdetailsheader';

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
  applicationId?: string | number;
  freshApplicationId?: string | number;
  sourceApplicationId?: string | number;
  renewalLicenseId?: string | number;
  licenseId?: string | number;
  freshLicenseId?: string | number;
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
  if (application.workflowStatus?.name) return application.workflowStatus.name;
  if (application.workflowStatus?.code) return application.workflowStatus.code;
  if (application.isSubmit === true) return 'Submitted';
  return 'Draft';
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

        // Handle various API response formats:
        // 1. { data: { data: {...} } } - nested data wrapper
        // 2. { data: {...} } - single data wrapper
        // 3. {...} - direct response
        let payload: any = response;

        // Extract the data property first
        if ((response as any)?.data !== undefined) {
          payload = (response as any).data;
        }

        // If data has a nested data property (some APIs wrap response twice)
        if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
          payload = payload.data;
        }

        // Ensure payload has the expected fields by checking for common identifiers
        const hasValidPayload =
          payload &&
          (payload.id !== undefined ||
            payload.acknowledgementNo !== undefined ||
            payload.licenseNumber !== undefined);

        if (!hasValidPayload) {
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
  const statusStyle = getStatusStyle(statusLabel);
  const renewalId = application?.id;
  const acknowledgementNo = application?.acknowledgementNo;
  const applicationId =
    application?.applicationId ||
    application?.freshApplicationId ||
    application?.sourceApplicationId ||
    application?.renewalLicenseId;

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
          <p className='mt-3 text-slate-600'>
            {error || 'The selected renewal application could not be loaded.'}
          </p>
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
    [application.firstName, application.middleName, application.lastName]
      .filter(Boolean)
      .join(' ') ||
    'N/A';

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-5xl 2xl:max-w-[1200px] space-y-6'>
        <RenewalApplicationDetailsHeader
          licenseId={application.licenseNumber || application.licenseId || application.freshLicenseId}
          renewalId={renewalId}
          acknowledgementNo={acknowledgementNo}
          activeTab='Renewal Application Details'
          imageSrc='/file.svg'
        />

        <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
          <div className='grid gap-6 p-6 md:grid-cols-2'>
            <InfoCard label='Applicant Name' value={applicantName} />
            <InfoCard label='Licence Number' value={application.licenseNumber || 'N/A'} />
            <InfoCard label='Acknowledgement No.' value={application.acknowledgementNo || 'N/A'} />
            <InfoCard
              label='Father / Spouse Name'
              value={application.parentOrSpouseName || 'N/A'}
            />
            <InfoCard label='Gender' value={application.sex || 'N/A'} />
            <InfoCard label='Date of Birth' value={formatDateTime(application.dateOfBirth)} />
            <InfoCard label='PAN Number' value={application.panNumber || 'N/A'} />
            <InfoCard label='Aadhaar Number' value={application.aadharNumber || 'N/A'} />
            <InfoCard label='Application Status' value={statusLabel} />
            <InfoCard label='Application Date' value={formatDateTime(application.createdAt)} />
            <InfoCard label='Updated At' value={formatDateTime(application.updatedAt)} />
          </div>

          <div className='border-t border-slate-200 px-6 py-5 flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={() => {
                const linkedLicenseId = String(
                  application?.licenseId ||
                    application?.freshLicenseId ||
                    application?.licenseNumber ||
                    application?.applicationId ||
                    application?.freshApplicationId ||
                    application?.sourceApplicationId ||
                    ''
                );
                const url = linkedLicenseId
                  ? `/forms/renewal?licenseId=${encodeURIComponent(linkedLicenseId)}&renewalId=${encodeURIComponent(String(id))}`
                  : `/forms/renewal?renewalId=${encodeURIComponent(String(id))}`;
                router.push(url);
              }}
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
