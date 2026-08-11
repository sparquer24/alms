'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin';

export interface ApplicationSummaryValues {
  totalApplications: number;
  totalFresh: number;
  totalRenewal: number;
  totalCancel: number;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
}

const CARDS: Array<{
  key: keyof ApplicationSummaryValues;
  label: string;
  type?: string;
  colorKey: 'info' | 'success' | 'warning' | 'error';
}> = [
  { key: 'totalApplications', label: 'Total Applications', type: 'all', colorKey: 'info' },
  { key: 'totalFresh', label: 'Fresh', type: 'freshform', colorKey: 'info' },
  { key: 'totalRenewal', label: 'Renewal', type: 'renewal', colorKey: 'success' },
  { key: 'totalCancel', label: 'Cancellation', type: 'cancel', colorKey: 'warning' },
  { key: 'totalApproved', label: 'Approved', type: 'approved', colorKey: 'success' },
  { key: 'totalPending', label: 'Pending', type: 'pending', colorKey: 'warning' },
  // REJECT and RETURN are a single merged status (statusMap.ts: returned: ['REJECT', 'RETURN']) -
  // there's no standalone "rejected" view, so this links to the combined bucket.
  { key: 'totalRejected', label: 'Returned/Rejected', type: 'returned', colorKey: 'error' },
];

export const ApplicationSummaryCards: React.FC<{
  stats: ApplicationSummaryValues;
  colors: any;
  /** Where the cards link to, e.g. `/inbox` (default) or `/admin/analytics/applications`. */
  basePath?: string;
}> = ({ stats, colors, basePath = '/inbox' }) => {
  const router = useRouter();

  return (
    <>
      {CARDS.map(card => {
        const href = card.type ? `${basePath}?type=${card.type}` : undefined;
        return (
        <AdminCard
          key={card.key}
          title={card.label}
          onClick={href ? () => router.push(href) : undefined}
          className={href ? '' : 'cursor-default'}
        >
          <div
            style={{ fontSize: '30px', fontWeight: 700, color: colors.status[card.colorKey] }}
          >
            {stats[card.key] ?? 0}
          </div>
          {!href && (
            <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: 4 }}>
              No dedicated view for this status
            </div>
          )}
        </AdminCard>
        );
      })}
    </>
  );
};

export default ApplicationSummaryCards;
