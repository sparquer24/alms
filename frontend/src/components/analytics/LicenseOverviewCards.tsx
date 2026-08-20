'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin';
import { LicenseStatistics } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { isLicenseManagementRole } from '@/utils/roleUtils';

const buildLicensesUrl = (state: { tab: 'all' | 'expiring' | 'expired'; status?: string; days?: number }) => {
  const params = new URLSearchParams();
  params.set('tab', state.tab);
  if (state.status) params.set('status', state.status);
  if (state.tab === 'expiring' && state.days && state.days !== 90) params.set('days', String(state.days));
  return `/licenses?${params.toString()}`;
};

const CARDS: Array<{
  key: keyof LicenseStatistics;
  label: string;
  href: string;
  colorKey: 'info' | 'success' | 'warning' | 'error';
}> = [
  { key: 'total', label: 'Total Licenses', href: buildLicensesUrl({ tab: 'all' }), colorKey: 'info' },
  { key: 'active', label: 'Active', href: buildLicensesUrl({ tab: 'all', status: 'ACTIVE' }), colorKey: 'success' },
  { key: 'expiringWithin30Days', label: 'Expiring Soon', href: buildLicensesUrl({ tab: 'expiring', days: 30 }), colorKey: 'warning' },
  { key: 'expired', label: 'Expired', href: buildLicensesUrl({ tab: 'expired' }), colorKey: 'error' },
  { key: 'suspended', label: 'Suspended', href: buildLicensesUrl({ tab: 'all', status: 'SUSPENDED' }), colorKey: 'info' },
  { key: 'cancelled', label: 'Cancelled', href: buildLicensesUrl({ tab: 'all', status: 'CANCELLED' }), colorKey: 'warning' },
];

export const LicenseOverviewCards: React.FC<{
  stats: LicenseStatistics | null | undefined;
  colors: any;
}> = ({ stats, colors }) => {
  const router = useRouter();
  const { userRole } = useAuth();
  const canViewLicenses = isLicenseManagementRole(userRole);

  return (
    <>
      {CARDS.map(card => {
        const value = stats?.[card.key];
        if (value === undefined) return null;
        return (
          <AdminCard
            key={card.key}
            title={card.label}
            onClick={canViewLicenses ? () => router.push(card.href) : undefined}
          >
            <div style={{ fontSize: '30px', fontWeight: 700, color: colors.status[card.colorKey] }}>
              {value ?? 0}
            </div>
            {!canViewLicenses && (
              <div style={{ fontSize: '12px', color: colors.text.secondary, marginTop: 4 }}>
                License list restricted for your role
              </div>
            )}
          </AdminCard>
        );
      })}
    </>
  );
};

export default LicenseOverviewCards;
