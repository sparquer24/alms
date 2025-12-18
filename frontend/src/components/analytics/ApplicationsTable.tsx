import React from 'react';
import { AdminTable, AdminTableSkeleton } from '@/components/admin';
import { format } from 'date-fns';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { ApplicationRecord } from '@/services/analyticsService';

export const ApplicationsTable: React.FC<{
  applications: ApplicationRecord[];
  loading: boolean;
  start: number;
  total: number;
  colors: any;
}> = ({ applications, loading, start, total, colors }) => {
  if (loading) return <AdminTableSkeleton rows={6} columns={6} />;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: AdminSpacing.md,
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'black' }}>
          Applications
        </h2>
        <span style={{ color: colors.text.secondary, fontSize: '13px' }}>
          {total === 0 ? 'No applications' : `Showing ${start + 1} - ${start + applications.length} of ${total}`}
        </span>
      </div>
      <div
        style={{
          height: 300,
          overflowY: 'auto',
          borderRadius: AdminBorderRadius.lg,
          border: '1px solid ' + colors.border,
        }}
      >
        <AdminTable
          columns={[
            {
              key: 'applicationId',
              header: 'S.No',
              render: (_v, _r, idx) => start + (idx + 1),
              width: '80px',
            },
            { key: 'licenseId', header: 'License ID', render: v => v || '--' },
            { key: 'applicantName', header: 'Application Name', render: v => v || '--' },
            {
              key: 'status',
              header: 'Status',
              render: value => {
                const normalized = (value || '').toUpperCase() as
                  | 'APPROVED'
                  | 'PENDING'
                  | 'REJECTED';
                const palette: any = {
                  APPROVED: { bg: '#ECFDF3', text: '#16A34A' },
                  PENDING: { bg: '#FFFBEB', text: '#CA8A04' },
                  REJECTED: { bg: '#FEF2F2', text: '#DC2626' },
                }[normalized] || { bg: '#F3F4F6', text: '#111827' };
                const label = normalized
                  ? `${normalized.charAt(0)}${normalized.slice(1).toLowerCase()}`
                  : 'Unknown';
                return (
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: AdminBorderRadius.full,
                      backgroundColor: palette.bg,
                      color: palette.text,
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    {label}
                  </span>
                );
              },
            },
            {
              key: 'pendingDetails',
              header: 'Pending Details',
              render: (_v, row: ApplicationRecord) => {
                const parts: string[] = [];
                if (row.currentUser?.name) parts.push(row.currentUser.name);
                if (row.daysTillToday !== null && row.daysTillToday !== undefined) {
                  const dayLabel = row.daysTillToday === 1 ? 'day' : 'days';
                  const daysText = `(${row.daysTillToday} ${dayLabel})`;
                  if (parts.length)
                    parts[parts.length - 1] = `${parts[parts.length - 1]} ${daysText}`;
                  else parts.push(daysText);
                }
                return parts.length ? parts.join(' ') : '--';
              },
            },
            {
              key: 'actionTakenAt',
              header: 'Action Taken At',
              render: v => {
                if (!v) return '--';
                const date = new Date(v as string);
                if (Number.isNaN(date.valueOf())) return '--';
                return format(date, 'yyyy-MM-dd HH:mm');
              },
            },
          ]}
          data={applications}
          rowKey='applicationId'
          emptyMessage='No applications found'
        />
      </div>
    </>
  );
};

export default ApplicationsTable;
