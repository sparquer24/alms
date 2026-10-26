'use client';

import React from 'react';
import { Ban, FilePlus2, RefreshCw, ShieldCheck, type LucideIcon } from 'lucide-react';

const TAB_ICONS: Record<string, LucideIcon> = {
  'License Details': ShieldCheck,
  'Fresh Application': FilePlus2,
  Renewals: RefreshCw,
  Cancellations: Ban,
};

interface Props {
  licenseNumber?: string;
  /** License holder's name, shown under the license number. */
  holderName?: string;
  /** Status and validity chips shown next to the title. */
  badges?: React.ReactNode;
  tabs?: string[];
  /** Optional count shown next to a tab label, keyed by the label. */
  tabCounts?: Record<string, number | undefined>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  /** Buttons for actions on this license (renew, cancel, ...). */
  actions?: React.ReactNode;
}

export default function LicenseDetailsHeader({
  licenseNumber,
  holderName,
  badges,
  tabs = ['License Details', 'Fresh Application', 'Renewals', 'Cancellations'],
  tabCounts,
  activeTab,
  onTabChange,
  actions,
}: Props) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4 px-6 pt-5'>
        <div className='min-w-0'>
          <p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Arms License</p>
          <div className='mt-1 flex flex-wrap items-center gap-2'>
            <h2 className='text-xl font-bold text-slate-900'>
              {licenseNumber ? `No. ${licenseNumber}` : 'License Details'}
            </h2>
            {badges}
          </div>
          {holderName && <p className='mt-1 text-sm text-slate-600'>{holderName}</p>}
        </div>
        {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
      </div>

      {tabs.length > 0 && (
        <nav className='mt-4 flex gap-1 overflow-x-auto border-t border-slate-100 px-4' aria-label='License sections'>
          {tabs.map(t => {
            const active = t === activeTab;
            const count = tabCounts?.[t];
            const Icon = TAB_ICONS[t];
            return (
              <button
                key={t}
                type='button'
                onClick={() => onTabChange?.(t)}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px flex items-center gap-2 whitespace-nowrap px-4 py-3 transition-colors ${
                  active
                    ? 'border-b-[3px] border-[#071933] text-base font-bold text-[#071933]'
                    : 'border-b-2 border-transparent text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                {Icon && <Icon className={`flex-shrink-0 ${active ? 'h-5 w-5' : 'h-4 w-4'}`} aria-hidden='true' />}
                {t}
                {count != null && count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      active ? 'bg-[#071933] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
