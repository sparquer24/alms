'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AdminCard, AdminSectionSkeleton } from '@/components/admin';
import { AdminSpacing } from '@/styles/admin-design-system';
import { ApplicationRecord } from '@/services/analyticsService';
import { LicenseData } from '@/types';

const formatDate = (iso?: string | null) => {
  if (!iso) return '--';
  const d = new Date(iso);
  return Number.isNaN(d.valueOf()) ? '--' : format(d, 'dd MMM yyyy');
};

const getFullName = (license: LicenseData) =>
  [license.firstName, license.middleName, license.lastName].filter(Boolean).join(' ') || '-';

type ActivityRow = {
  id: string;
  number: string;
  name: string;
  type: string;
  status: string;
  date: string | null;
  href: string;
};

export const RecentActivitySection: React.FC<{
  applications: ApplicationRecord[];
  licenses: LicenseData[];
  loading?: boolean;
  colors: any;
}> = ({ applications, licenses, loading, colors }) => {
  const router = useRouter();

  const rows = useMemo<ActivityRow[]>(() => {
    const fromApplications: ActivityRow[] = applications.map(app => {
      // applicationId comes from separate fresh/renewal/cancel tables, so it can
      // collide across types. Key on type + id, and route to the type-specific page.
      const appId = app.applicationId;
      const href =
        app.applicationType === 'CANCEL'
          ? `/cancelForm/${appId}`
          : app.applicationType === 'RENEWAL'
            ? `/renewalApplication/${appId}`
            : `/application/${appId}`;
      return {
        id: `app-${app.applicationType || 'FRESH'}-${appId}`,
        number: String(appId),
        name: app.applicantName || '--',
        type: app.applicationType || '--',
        status: app.status,
        date: app.actionTakenAt ?? null,
        href,
      };
    });
    const fromLicenses: ActivityRow[] = licenses.map(license => ({
      id: `lic-${license.id}`,
      number: license.licenseNumber,
      name: getFullName(license),
      type: 'License',
      status: license.status,
      date: license.updatedAt ?? license.createdAt ?? null,
      href: `/licenses?tab=all&search=${encodeURIComponent(license.licenseNumber)}`,
    }));

    return [...fromApplications, ...fromLicenses]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 8);
  }, [applications, licenses]);

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
          Recent Activity
        </h2>
        <button
          onClick={() => router.push('/inbox?type=all')}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.status.info,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          View All →
        </button>
      </div>
      <AdminCard>
        {loading ? (
          <AdminSectionSkeleton lines={6} height='260px' />
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: colors.text.secondary }}>
            No recent activity.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: colors.text.secondary, borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '8px 12px' }}>Number</th>
                  <th style={{ padding: '8px 12px' }}>Applicant / Holder</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                  <th style={{ padding: '8px 12px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '10px 12px', color: colors.text.primary }}>{row.number}</td>
                    <td style={{ padding: '10px 12px', color: colors.text.primary }}>{row.name}</td>
                    <td style={{ padding: '10px 12px', color: colors.text.secondary }}>{row.type}</td>
                    <td style={{ padding: '10px 12px', color: colors.text.secondary }}>{row.status}</td>
                    <td style={{ padding: '10px 12px', color: colors.text.secondary }}>{formatDate(row.date)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => router.push(row.href)}
                        style={{ color: colors.status.info, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
};

export default RecentActivitySection;
