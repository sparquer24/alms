'use client';

/**
 * SUPER ADMIN ANALYTICS PAGE
 * This page is exclusively for SUPER_ADMIN role users.
 * Key Features:
 * - ✅ GLOBAL ANALYTICS: View data across all states, districts, and zones
 * - ✅ NO GEOGRAPHIC FILTERING: Access complete system-wide analytics
 * - ✅ COMPREHENSIVE REPORTING: See all user activities and application metrics
 * - ✅ Backend automatically bypasses location filters for SUPER_ADMIN role
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  analyticsService,
  AnalyticsFilters,
  ApplicationsData,
  RoleLoadData,
  StateData,
  AdminActivity,
} from '@/services/analyticsService';
import { format } from 'date-fns';
import {
  AdminCard,
  AdminToolbar,
  AdminFilter,
  AdminErrorAlert,
  AdminErrorBoundary,
  AdminSectionSkeleton,
  AdminTableSkeleton,
  AdminTable,
} from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius, AdminTransitions } from '@/styles/admin-design-system';
import { AdminActivityFeed } from '@/components/analytics/AdminActivityFeed';

// Type assertions for recharts components
const ResponsiveContainerFixed = ResponsiveContainer as any;
const BarChartFixed = BarChart as any;
const BarFixed = Bar as any;
const XAxisFixed = XAxis as any;
const YAxisFixed = YAxis as any;
const TooltipFixed = Tooltip as any;
const CartesianGridFixed = CartesianGrid as any;
const PieChartFixed = PieChart as any;
const PieFixed = Pie as any;
const CellFixed = Cell as any;
const LegendFixed = Legend as any;

const COLORS = ['#6366F1', '#F59E42', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

const statusPalette: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: '#ECFDF3', text: '#16A34A' },
  Approved: { bg: '#ECFDF3', text: '#16A34A' },
  PENDING: { bg: '#FFFBEB', text: '#CA8A04' },
  Pending: { bg: '#FFFBEB', text: '#CA8A04' },
  REJECTED: { bg: '#FEF2F2', text: '#DC2626' },
  Rejected: { bg: '#FEF2F2', text: '#DC2626' },
};

export default function AnalyticsPage() {
  const { colors } = useAdminTheme();
  const router = useRouter();

  // Date range state
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Applications table state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Fetch applications data
  const {
    data: applicationsByWeek = [],
    isLoading: appLoading,
    error: appError,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ['analytics-applications', fromDate, toDate],
    queryFn: async () => {
      const filters: AnalyticsFilters = { fromDate, toDate };
      return analyticsService.getApplicationsByWeek(filters);
    },
  });

  // Fetch role load data
  const {
    data: roleLoad = [],
    isLoading: roleLoading,
    error: roleError,
  } = useQuery({
    queryKey: ['analytics-roleload', fromDate, toDate],
    queryFn: async () => {
      const filters: AnalyticsFilters = { fromDate, toDate };
      return analyticsService.getRoleLoad(filters);
    },
  });

  // Fetch application states
  const {
    data: applicationStates = [],
    isLoading: stateLoading,
    error: stateError,
  } = useQuery({
    queryKey: ['analytics-states', fromDate, toDate],
    queryFn: async () => {
      const filters: AnalyticsFilters = { fromDate, toDate };
      return analyticsService.getApplicationStates(filters);
    },
  });

  // Fetch admin activities
  const {
    data: adminActivities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: ['analytics-activities', fromDate, toDate],
    queryFn: async () => {
      const filters: AnalyticsFilters = { fromDate, toDate };
      return analyticsService.getAdminActivities(filters);
    },
  });

  // Fetch applications details with pagination
  const {
    data: applicationsDetails,
    isLoading: detailsLoading,
    error: detailsError,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ['analytics-applications-details', page, pageSize, status, search],
    queryFn: async () => {
      return analyticsService.getApplicationsDetails({
        page,
        limit: pageSize,
        status: status || undefined,
        q: search || undefined,
        sort: '-updatedAt',
      });
    },
  });

  const applicationsData = applicationsDetails?.data || [];
  const totalRecords = applicationsDetails?.meta?.total || 0;
  const totalPages = applicationsDetails?.meta?.pages || 1;

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalApplications = applicationsByWeek.reduce((sum, item) => sum + item.count, 0);
    const totalApproved = applicationStates.find(s => s.state === 'approved')?.count || 0;
    const totalPending = applicationStates.find(s => s.state === 'pending')?.count || 0;
    const totalRejected = applicationStates.find(s => s.state === 'rejected')?.count || 0;

    return {
      totalApplications,
      totalApproved,
      totalPending,
      totalRejected,
      approvalRate:
        totalApplications > 0 ? ((totalApproved / totalApplications) * 100).toFixed(1) : '0',
    };
  }, [applicationsByWeek, applicationStates]);

  // Handle date reset
  const handleReset30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setFromDate(format(date, 'yyyy-MM-dd'));
    setToDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Handle export
  const handleDownload = () => {
    if (!applicationsData || applicationsData.length === 0) {
      console.warn('No data to export');
      return;
    }
    const header = ['S.No', 'License ID', 'Applicant Name', 'Current User', 'Status', 'Action Taken At'];
    const rows = applicationsData.map((row, idx) => [
      String(idx + 1),
      row.licenseId || 'N/A',
      row.applicantName || 'N/A',
      row.currentUser?.name || 'N/A',
      row.status,
      row.actionTakenAt || 'N/A',
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'applications.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = (data: any[], filename: string) => {
    try {
      analyticsService.exportToCSV(data, `${filename}.csv`);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const isLoading = appLoading || roleLoading || stateLoading;
  const isTableLoading = detailsLoading;

  return (
    <AdminErrorBoundary>
      <div
        style={{
          padding: AdminLayout.content.padding,
          gap: AdminLayout.content.gap,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Section with Gradient Background */}
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
          <div className='bg-[#001F54] text-white px-6 py-8'>
            <div className='text-white'>
              <h1 className='text-3xl font-bold mb-2'>Analytics Dashboard</h1>
              <p className='text-blue-100 text-lg'>
                Track applications and system performance
              </p>
            </div>
          </div>
          <div className='p-6 bg-white'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
              <div className='flex flex-col sm:flex-row gap-3 flex-1'>
                <div className='relative flex-1'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>From Date</label>
                  <input
                    type='date'
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className='w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                </div>
                <div className='relative flex-1'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>To Date</label>
                  <input
                    type='date'
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className='w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                </div>
              </div>
              <div className='flex gap-2 items-end'>
                <button
                  onClick={handleReset30Days}
                  className='inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-300 transition-colors whitespace-nowrap'
                >
                  Reset 30 Days
                </button>
                <button
                  onClick={() => refetchApps()}
                  disabled={isLoading}
                  className='inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap'
                >
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.581 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alerts */}
        {appError && (
          <AdminErrorAlert
            title='Failed to Load Applications'
            message={appError instanceof Error ? appError.message : 'Unknown error'}
            onRetry={() => refetchApps()}
          />
        )}
        {roleError && (
          <AdminErrorAlert
            title='Failed to Load Role Data'
            message={roleError instanceof Error ? roleError.message : 'Unknown error'}
          />
        )}
        {stateError && (
          <AdminErrorAlert
            title='Failed to Load Application States'
            message={stateError instanceof Error ? stateError.message : 'Unknown error'}
          />
        )}
        {detailsError && (
          <AdminErrorAlert
            title='Failed to Load Application Details'
            message={detailsError instanceof Error ? detailsError.message : 'Unknown error'}
            onRetry={() => refetchDetails()}
          />
        )}

        {/* Summary Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: AdminSpacing.lg,
          }}
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ minHeight: '100px' }}>
                <AdminSectionSkeleton lines={3} height='100px' />
              </div>
            ))
          ) : (
            <>
              <AdminCard title='Total Applications'>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.info }}>
                  {summaryStats.totalApplications}
                </div>
              </AdminCard>
              <AdminCard title='Approved'>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.success }}>
                  {summaryStats.totalApproved}
                </div>
              </AdminCard>
              <AdminCard title='Pending'>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.warning }}>
                  {summaryStats.totalPending}
                </div>
              </AdminCard>
              <AdminCard title='Rejected'>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.error }}>
                  {summaryStats.totalRejected}
                </div>
              </AdminCard>
              <AdminCard title='Approval Rate'>
                <div style={{ fontSize: '32px', fontWeight: 700, color: colors.status.success }}>
                  {summaryStats.approvalRate}%
                </div>
              </AdminCard>
            </>
          )}
        </div>

        {/* Charts Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: AdminSpacing.xl,
          }}
        >
          {/* Applications Over Time Chart */}
          <AdminCard title='Applications Over Time (Weekly)'>
            {appLoading ? (
              <AdminSectionSkeleton lines={5} height='300px' />
            ) : (
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainerFixed width='100%' height='100%'>
                  <BarChartFixed data={applicationsByWeek}>
                    <CartesianGridFixed stroke={colors.border} />
                    <XAxisFixed dataKey='week' stroke={colors.text.secondary} />
                    <YAxisFixed stroke={colors.text.secondary} />
                    <TooltipFixed
                      contentStyle={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        color: colors.text.primary,
                        borderRadius: AdminBorderRadius.md,
                      }}
                    />
                    <BarFixed dataKey='count' fill={colors.status.info} radius={[8, 8, 0, 0]} />
                  </BarChartFixed>
                </ResponsiveContainerFixed>
              </div>
            )}
            <button
              onClick={() => handleExport(applicationsByWeek, 'applications-timeline')}
              style={{
                marginTop: AdminSpacing.lg,
                padding: '8px 12px',
                backgroundColor: colors.status.success,
                color: '#ffffff',
                border: 'none',
                borderRadius: AdminBorderRadius.sm,
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Export CSV
            </button>
          </AdminCard>

          {/* Role-wise Load Chart */}
          <AdminCard title='Role-wise Application Load'>
            {roleLoading ? (
              <AdminSectionSkeleton lines={5} height='300px' />
            ) : (
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainerFixed width='100%' height='100%'>
                  <PieChartFixed>
                    <PieFixed
                      data={roleLoad}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      fill='#8884d8'
                      label={({ name, value }: any) => `${name}: ${value}`}
                    >
                      {roleLoad.map((entry, idx) => (
                        <CellFixed key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </PieFixed>
                    <TooltipFixed
                      contentStyle={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        color: colors.text.primary,
                        borderRadius: AdminBorderRadius.md,
                      }}
                    />
                    <LegendFixed />
                  </PieChartFixed>
                </ResponsiveContainerFixed>
              </div>
            )}
            <button
              onClick={() => handleExport(roleLoad, 'role-load')}
              style={{
                marginTop: AdminSpacing.lg,
                padding: '8px 12px',
                backgroundColor: colors.status.success,
                color: '#ffffff',
                border: 'none',
                borderRadius: AdminBorderRadius.sm,
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Export CSV
            </button>
          </AdminCard>
        </div>

        {/* Application States Distribution */}
        <AdminCard title='Application Status Distribution'>
          {stateLoading ? (
            <AdminSectionSkeleton lines={5} height='300px' />
          ) : (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainerFixed width='100%' height='100%'>
                <BarChartFixed data={applicationStates} layout='vertical'>
                  <CartesianGridFixed stroke={colors.border} />
                  <XAxisFixed type='number' stroke={colors.text.secondary} />
                  <YAxisFixed dataKey='state' type='category' stroke={colors.text.secondary} />
                  <TooltipFixed
                    contentStyle={{
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      color: colors.text.primary,
                      borderRadius: AdminBorderRadius.md,
                    }}
                  />
                  <BarFixed dataKey='count' fill={colors.status.success} radius={[0, 8, 8, 0]} />
                </BarChartFixed>
              </ResponsiveContainerFixed>
            </div>
          )}
          <button
            onClick={() => handleExport(applicationStates, 'application-states')}
            style={{
              marginTop: AdminSpacing.lg,
              padding: '8px 12px',
              backgroundColor: colors.status.success,
              color: '#ffffff',
              border: 'none',
              borderRadius: AdminBorderRadius.sm,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Export CSV
          </button>
        </AdminCard>

        {/* Applications Table Section */}
        <div
          style={{
            display: 'flex',
            gap: AdminSpacing.md,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: AdminSpacing.md,
          }}
        >
          <input
            type='text'
            placeholder='Search applications...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              height: '40px',
              borderRadius: AdminBorderRadius.md,
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: colors.text.primary,
              fontSize: '14px',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            }}
            aria-label='Search applications'
          />

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              height: '40px',
              borderRadius: AdminBorderRadius.md,
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: colors.text.primary,
              fontSize: '14px',
              appearance: 'auto',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            }}
            aria-label='Status filter'
          >
            <option value=''>All Statuses</option>
            <option value='Approved'>Approved</option>
            <option value='Pending'>Pending</option>
            <option value='Rejected'>Rejected</option>
          </select>

          <button
            type='button'
            onClick={handleDownload}
            style={{
              padding: '0 16px',
              height: '40px',
              borderRadius: AdminBorderRadius.md,
              border: 'none',
              backgroundColor: '#374151',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
              transition: `all ${AdminTransitions.fast}`,
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1F2937';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#374151';
            }}
          >
            ↓ Download Excel
          </button>
        </div>

        <AdminCard>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: AdminSpacing.md,
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: colors.text.primary }}>
              Applications
            </h2>
            <span style={{ color: colors.text.secondary, fontSize: '13px' }}>
              Showing {applicationsData.length} of {totalRecords}
            </span>
          </div>
          <div
            style={{
              height: 300,
              overflowY: 'auto',
              borderRadius: AdminBorderRadius.lg,
              border: `1px solid ${colors.border}`,
            }}
          >
            {isTableLoading ? (
              <AdminTableSkeleton rows={6} columns={5} />
            ) : (
              <AdminTable
                columns={[
                  {
                    key: 'applicationId',
                    header: 'S.No',
                    render: (_value, row, idx) => (page - 1) * pageSize + (idx + 1),
                    width: '80px',
                  },
                  {
                    key: 'licenseId',
                    header: 'License ID',
                    render: value => value || 'N/A',
                  },
                  { 
                    key: 'applicantName', 
                    header: 'Applicant Name',
                    render: value => value || 'N/A',
                  },
                  {
                    key: 'currentUser',
                    header: 'Current User',
                    render: value => value?.name || 'N/A',
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: value => (
                      <span
                        style={{
                          padding: '6px 10px',
                          borderRadius: AdminBorderRadius.full,
                          backgroundColor: statusPalette[value as string]?.bg || '#F3F4F6',
                          color: statusPalette[value as string]?.text || '#6B7280',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        {value}
                      </span>
                    ),
                  },
                  { 
                    key: 'actionTakenAt', 
                    header: 'Action Taken At',
                    render: value => value || 'N/A',
                  },
                ]}
                data={applicationsData}
                rowKey='applicationId'
                emptyMessage='No applications found'
              />
            )}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: AdminSpacing.lg,
            }}
          >
            <span style={{ color: colors.text.secondary, fontSize: '13px' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: AdminSpacing.sm }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: AdminBorderRadius.md,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: page === 1 ? colors.surface : colors.background,
                  color: page === 1 ? colors.text.secondary : colors.text.primary,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: AdminBorderRadius.md,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: page === totalPages ? colors.surface : colors.background,
                  color: page === totalPages ? colors.text.secondary : colors.text.primary,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </AdminCard>
        
        {/* Admin Activity Feed */}
        <AdminCard title='Recent Activities'>
          <div style={{ height: 450, overflowY: 'auto' }}>
            {activitiesLoading ? (
              <AdminSectionSkeleton lines={5} height='300px' />
            ) : activitiesError ? (
              <AdminErrorAlert
                title='Failed to Load Activities'
                message={activitiesError instanceof Error ? activitiesError.message : 'Unknown error'}
              />
            ) : (
              <AdminActivityFeed activities={adminActivities} />
            )}
          </div>
        </AdminCard>
        
      </div>
    </AdminErrorBoundary>
  );
}
