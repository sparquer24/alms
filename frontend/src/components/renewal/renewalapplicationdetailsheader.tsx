'use client';

import React from 'react';

interface Props {
  smallLabel?: string;
  title?: string;
  acknowledgementNo?: string;
  renewalId?: string | number;
  applicationId?: string | number;
  licenseId?: string | number;
  licenseNumber?: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  currentSection?: string;
  accentColorClass?: string;
  imageSrc?: string;
}

export default function RenewalApplicationDetailsHeader({
  smallLabel = 'RENEWAL REQUEST',
  title,
  acknowledgementNo,
  renewalId,
  applicationId,
  licenseId,
  licenseNumber,
  tabs = ['Renewal Info', 'Original License Details'],
  activeTab,
  onTabChange,
  currentSection,
  accentColorClass = 'bg-gradient-to-b from-indigo-500 to-indigo-400',
  imageSrc,
}: Props) {
  const isOriginTab = activeTab === 'Original License Details';

  const subtitleParts: string[] = [];
  if (isOriginTab) {
    // Original License Details tab — show license info
    if (licenseId) subtitleParts.push(`License ID: ${licenseId}`);
    if (licenseNumber) subtitleParts.push(`License Number: ${licenseNumber}`);
  } else {
    // Non-origin tab (Renewal Info / Cancellation Info) — show request ID and acknowledgement
    if (applicationId) subtitleParts.push(`Request ID: ${applicationId}`);
    if (acknowledgementNo) subtitleParts.push(`Ack No: ${acknowledgementNo}`);
  }

  return (
    <div className='relative'>
      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md'>
        <div className='flex'>
          {/* Left Accent */}
          <div className={`w-1 ${accentColorClass}`} />

          <div className='flex-1 px-6 py-4'>
            <div className='grid grid-cols-[1fr_auto_240px] items-center gap-8'>
              {/* ================= Left ================= */}
              <div className='flex items-center gap-5 min-w-0'>
                {/* Icon */}
                <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm'>
                  {imageSrc ? (
                    <img src={imageSrc} alt='' className='h-6 w-6 object-contain' />
                  ) : (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-6 w-6 text-slate-500'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.7}
                        d='M9 12h6M9 16h6M12 8h.01M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z'
                      />
                    </svg>
                  )}
                </div>

                {/* Title */}
                <div className='min-w-0'>
                  <h2 className='truncate text-[20px] font-bold text-slate-900'>
                    {title || (renewalId ? `Renewal Request ID:${renewalId}` : 'Renewal Request')}
                  </h2>
                  {subtitleParts.length > 0 && (
                    <p className='mt-1 truncate text-[15px] text-slate-500'>
                      {subtitleParts.join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              {/* ================= Center Tabs ================= */}
              {tabs && tabs.length > 0 && (
                <div className='flex items-center justify-center gap-4'>
                  {tabs.map(t => {
                    const active = t === activeTab;

                    return (
                      <button
                        key={t}
                        type='button'
                        onClick={() => onTabChange?.(t)}
                        className={`h-12 rounded-xl px-8 text-[15px] font-semibold transition-all duration-200 ${
                          active
                            ? 'bg-[#071933] text-white shadow-md'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ================= Right ================= */}
              <div className='border-l border-slate-200 pl-8 text-right'>
                <p className='text-[11px] font-bold uppercase tracking-widest text-blue-600'>
                  Current Section
                </p>

                <h3 className='mt-2 text-[18px] font-semibold text-slate-900'>
                  {currentSection || activeTab}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
