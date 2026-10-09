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

/** Header for renewal and cancellation request details: identity line plus section tabs. */
export default function RenewalApplicationDetailsHeader({
  smallLabel = 'RENEWAL REQUEST',
  title,
  acknowledgementNo,
  renewalId,
  applicationId,
  licenseNumber,
  tabs = ['Renewal Info', 'Original License Details'],
  activeTab,
  onTabChange,
  currentSection,
  accentColorClass = 'bg-gradient-to-b from-indigo-500 to-indigo-400',
  imageSrc,
}: Props) {
  // The acknowledgement number is the reference officers use; the database id is
  // only a fallback when there is none yet.
  const requestId = renewalId ?? applicationId;
  const subtitleParts = [
    licenseNumber && `License No: ${licenseNumber}`,
    acknowledgementNo ? `Ack No: ${acknowledgementNo}` : requestId != null && `Request ID: ${requestId}`,
  ].filter(Boolean) as string[];

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
      <div className='flex'>
        <div className={`w-1 flex-shrink-0 ${accentColorClass}`} />
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center justify-between gap-4 px-6 pt-5'>
            <div className='flex min-w-0 items-center gap-4'>
              {imageSrc && (
                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50'>
                  <img src={imageSrc} alt='' className='h-5 w-5 object-contain' />
                </div>
              )}
              <div className='min-w-0'>
                <p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{smallLabel}</p>
                <h2 className='mt-0.5 truncate text-xl font-bold text-slate-900'>
                  {title || 'Renewal Request'}
                </h2>
                {subtitleParts.length > 0 && (
                  <p className='mt-0.5 truncate text-sm text-slate-600'>{subtitleParts.join(' · ')}</p>
                )}
              </div>
            </div>
            {currentSection && (
              <p className='text-sm font-medium text-slate-600'>{currentSection}</p>
            )}
          </div>

          {tabs && tabs.length > 0 && (
            <nav className='mt-4 flex gap-1 overflow-x-auto border-t border-slate-100 px-4' aria-label='Request sections'>
              {tabs.map(t => {
                const active = t === activeTab;
                return (
                  <button
                    key={t}
                    type='button'
                    onClick={() => onTabChange?.(t)}
                    aria-current={active ? 'page' : undefined}
                    className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[#071933] text-[#071933]'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
