'use client';

import React from 'react';
import { FileText, Shield, User, Calendar } from 'lucide-react';

interface RenewalSummaryProps {
  licenseId?: string;
  renewalId?: string;
  data?: any;
}

const getStatusLabel = (data?: any) => {
  if (!data) return '—';
  if (data.workflowStatus?.name) return data.workflowStatus.name;
  if (data.workflowStatus?.code) return data.workflowStatus.code;
  if (data.isSubmit === true) return 'Submitted';
  return 'Draft';
};

const getDateDisplay = (data?: any) => {
  const rawDate = data?.createdAt || data?.updatedAt;
  if (!rawDate) return '—';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const lower = status.toLowerCase();
  const isSubmitted = lower.includes('submit') || lower.includes('approved') || lower.includes('complete');
  const isDraft = lower.includes('draft');

  if (isSubmitted) {
    return (
      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'>
        {status}
      </span>
    );
  }

  if (isDraft) {
    return (
      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40'>
        {status}
      </span>
    );
  }

  return (
    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/40'>
      {status}
    </span>
  );
};

const RenewalSummary: React.FC<RenewalSummaryProps> = ({ licenseId, renewalId, data }) => {
  const applicantName = data?.applicantName || '—';
  // Acknowledgement Number in full (avoid 'Fresh Ack No' label)
  const fullAckNo = data?.acknowledgementNo || renewalId || '—';

  // Resolve License No and eliminate duplicate "License ID"
  const licenseNumber = data?.licenseNumber || licenseId || data?.licenseId || '—';

  const status = getStatusLabel(data);
  const dateStr = getDateDisplay(data);

  return (
    <div className='w-full rounded-xl border border-[#1E3A8A]/70 bg-gradient-to-r from-[#0B1F3A] via-[#0D2444] to-[#122E54] px-4 py-2.5 shadow-sm text-white'>
      <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5'>
        {/* License Number (Unified, duplicates removed) */}
        <div className='flex items-center gap-2 min-w-0'>
          <Shield className='w-4 h-4 text-[#D4AF37] flex-shrink-0' />
          <div className='flex items-center gap-1.5 flex-wrap'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]'>
              License No:
            </span>
            <span className='text-xs sm:text-sm font-bold font-mono text-white tracking-wide select-all'>
              {licenseNumber}
            </span>
          </div>
        </div>

        <div className='hidden lg:block h-4 w-px bg-white/15' />

        {/* Acknowledgement Number in full */}
        <div className='flex items-center gap-2 min-w-0'>
          <FileText className='w-4 h-4 text-[#D4AF37] flex-shrink-0' />
          <div className='flex items-center gap-1.5 flex-wrap'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]'>
              Acknowledgement No:
            </span>
            <span className='text-xs sm:text-sm font-bold font-mono text-white tracking-wide select-all break-all'>
              {fullAckNo}
            </span>
          </div>
        </div>

        <div className='hidden lg:block h-4 w-px bg-white/15' />

        {/* Applicant */}
        <div className='flex items-center gap-2 min-w-0'>
          <User className='w-4 h-4 text-blue-300 flex-shrink-0' />
          <div className='flex items-center gap-1.5 flex-wrap'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]'>
              Applicant:
            </span>
            <span className='text-xs sm:text-sm font-semibold text-white capitalize'>
              {applicantName}
            </span>
          </div>
        </div>

        <div className='hidden lg:block h-4 w-px bg-white/15' />

        {/* Status */}
        <div className='flex items-center gap-2 min-w-0'>
          <span className='text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]'>
            Status:
          </span>
          <StatusBadge status={status} />
        </div>

        {dateStr !== '—' && (
          <>
            <div className='hidden lg:block h-4 w-px bg-white/15' />
            {/* Date */}
            <div className='flex items-center gap-2 min-w-0'>
              <Calendar className='w-4 h-4 text-blue-300 flex-shrink-0' />
              <div className='flex items-center gap-1.5 flex-wrap'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]'>
                  Date:
                </span>
                <span className='text-xs sm:text-sm font-semibold text-slate-200'>
                  {dateStr}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RenewalSummary;
