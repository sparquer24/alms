'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AdminCard, AdminSectionSkeleton } from '@/components/admin';
import { AdminSpacing } from '@/styles/admin-design-system';
import { ApplicationRecord } from '@/services/analyticsService';

const formatDate = (iso?: string | null) => {
  if (!iso) return '--';
  const d = new Date(iso);
  return Number.isNaN(d.valueOf()) ? '--' : format(d, 'dd MMM yyyy');
};

export const PendingApplicationsSection: React.FC<{
  applications: ApplicationRecord[];
  loading?: boolean;
  colors: any;
}> = ({ applications, loading, colors }) => {
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
          Pending Applications
        </h2>
        <button
          onClick={() => router.push('/inbox?type=pending')}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.status.info,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          View All Pending →
        </button>
      </div>
      <AdminCard>
        {loading ? (
          <AdminSectionSkeleton lines={5} height='220px' />
        ) : applications.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: colors.text.secondary }}>
            No pending applications right now.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: colors.text.secondary, borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '8px 12px' }}>Application No.</th>
                  <th style={{ padding: '8px 12px' }}>Applicant Name</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Submitted</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}></th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.applicationId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '10px 12px', color: colors.text.primary }}>{app.applicationId}</td>
                    <td style={{ padding: '10px 12px', color: colors.text.primary }}>{app.applicantName || '--'}</td>
                    <td style={{ padding: '10px 12px', color: colors.text.secondary }}>{app.applicationType || '--'}</td>
                    <td style={{ padding: '10px 12px', color: colors.text.secondary }}>{formatDate(app.actionTakenAt)}</td>
                    <td style={{ padding: '10px 12px', color: colors.status.warning, fontWeight: 600 }}>{app.status}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => router.push(`/application/${app.applicationId}`)}
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

export default PendingApplicationsSection;
