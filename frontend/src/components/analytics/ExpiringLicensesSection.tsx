'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AdminCard, AdminSectionSkeleton } from '@/components/admin';
import { AdminSpacing } from '@/styles/admin-design-system';
import { LicenseData } from '@/types';

const formatDate = (iso?: string | null) => {
  if (!iso) return '--';
  const d = new Date(iso);
  return Number.isNaN(d.valueOf()) ? '--' : format(d, 'dd MMM yyyy');
};

const getFullName = (license: LicenseData) =>
  [license.firstName, license.middleName, license.lastName].filter(Boolean).join(' ') || '-';

// Same day-diff calc as licenses/page.tsx's getExpiryState
const getDaysRemaining = (validTill?: string | null) => {
  if (!validTill) return null;
  const today = new Date();
  const expiry = new Date(validTill);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const ExpiringLicensesSection: React.FC<{
  licenses: LicenseData[];
  loading?: boolean;
  colors: any;
}> = ({ licenses, loading, colors }) => {
  const router = useRouter();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: AdminSpacing.md,
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}>
          Expiring Licenses
        </h2>
        <button
          onClick={() => router.push('/licenses?tab=expiring&days=30')}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.status.info,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          View All Expiring →
        </button>
      </div>
      <AdminCard>
        {loading ? (
          <AdminSectionSkeleton lines={5} height='220px' />
        ) : licenses.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: colors.text.secondary }}>
            No licenses expiring soon.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: colors.text.secondary, borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '8px 12px' }}>License No.</th>
                  <th style={{ padding: '8px 12px' }}>Holder</th>
                  <th style={{ padding: '8px 12px' }}>Expiry Date</th>
                  <th style={{ padding: '8px 12px' }}>Days Remaining</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}></th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(license => {
                  const days = getDaysRemaining(license.validTill);
                  return (
                    <tr key={license.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '10px 12px', color: colors.text.primary }}>{license.licenseNumber}</td>
                      <td style={{ padding: '10px 12px', color: colors.text.primary }}>{getFullName(license)}</td>
                      <td style={{ padding: '10px 12px', color: colors.text.secondary }}>{formatDate(license.validTill)}</td>
                      <td style={{ padding: '10px 12px', color: colors.status.warning, fontWeight: 600 }}>
                        {days !== null ? `${days} day${days === 1 ? '' : 's'}` : '--'}
                      </td>
                      <td style={{ padding: '10px 12px', color: colors.text.secondary }}>{license.status}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => router.push(`/licenses?tab=all&search=${encodeURIComponent(license.licenseNumber)}`)}
                          style={{ color: colors.status.info, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
};

export default ExpiringLicensesSection;
