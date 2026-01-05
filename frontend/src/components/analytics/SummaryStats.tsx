import React from 'react';
import { AdminCard } from '@/components/admin';

export const SummaryStats: React.FC<{ stats: any; colors: any; loading?: boolean }> = ({
  stats,
  colors,
  loading,
}) => {
  if (loading) {
    return null;
  }

  return (
    <>
      <AdminCard title='Total Applications'>
        <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.info }}>
          {stats.totalApplications}
        </div>
      </AdminCard>
      <AdminCard title='Approved'>
        <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.success }}>
          {stats.totalApproved}
        </div>
      </AdminCard>
      <AdminCard title='Pending'>
        <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.warning }}>
          {stats.totalPending}
        </div>
      </AdminCard>
      <AdminCard title='Rejected'>
        <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.error }}>
          {stats.totalRejected}
        </div>
      </AdminCard>
      <AdminCard title='Approval Rate'>
        <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.success }}>
          {stats.approvalRate}%
        </div>
      </AdminCard>
    </>
  );
};

export default SummaryStats;
