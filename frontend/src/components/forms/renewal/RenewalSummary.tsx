import React from 'react';

const Card: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[160px]'>
    <div className='text-xs text-gray-500'>{label}</div>
    <div className='mt-2 font-medium text-gray-900'>{value}</div>
  </div>
);

const RenewalSummary: React.FC<{ applicationId?: string; renewalId?: string; data?: any }> = ({ applicationId, renewalId, data }) => {
  return (
    <div className='flex gap-4 overflow-x-auto py-2'>
      <Card label='Application ID' value={applicationId || data?.applicationId || '—'} />
      <Card label='Renewal ID' value={renewalId || data?.renewalId || 'Pending'} />
      <Card label='Applicant' value={data?.applicantName || '—'} />
      <Card label='License No' value={data?.licenseNumber || '—'} />
      <Card label='Status' value={data ? 'Loaded' : 'Prefilled'} />
      <Card label='Date' value={data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '—'} />
    </div>
  );
};

export default RenewalSummary;
