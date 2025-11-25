'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
} from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';
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

export default function AnalyticsPage() {
  const { colors } = useAdminTheme();

  // Date range state
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

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
  const handleExport = (data: any[], filename: string) => {
    try {
      analyticsService.exportToCSV(data, `${filename}.csv`);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const isLoading = appLoading || roleLoading || stateLoading;

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
        {/* Header Toolbar */}
        <AdminToolbar sticky>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Analytics Dashboard
            </h1>
            <p style={{ color: colors.text.secondary, fontSize: '14px', margin: '4px 0 0 0' }}>
              Track applications and system performance
            </p>
          </div>
          <button
            onClick={() => refetchApps()}
            disabled={isLoading}
            style={{
              padding: '10px 16px',
              backgroundColor: colors.status.info,
              color: '#ffffff',
              border: 'none',
              borderRadius: AdminBorderRadius.md,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            ↻ Refresh
          </button>
        </AdminToolbar>

        {/* Date Filters */}
        <AdminFilter
          filters={{
            fromDate: {
              value: fromDate,
              label: 'From Date',
              type: 'date',
              onChange: setFromDate,
            },
            toDate: {
              value: toDate,
              label: 'To Date',
              type: 'date',
              onChange: setToDate,
            },
          }}
          onClear={handleReset30Days}
        />

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

        {/* Admin Activity Feed */}
        <AdminCard title='Recent Activities'>
          {activitiesLoading ? (
            <AdminSectionSkeleton lines={5} height='400px' />
          ) : activitiesError ? (
            <AdminErrorAlert
              title='Failed to Load Activities'
              message={activitiesError instanceof Error ? activitiesError.message : 'Unknown error'}
            />
          ) : (
            <AdminActivityFeed activities={adminActivities} />
          )}
        </AdminCard>
      </div>
    </AdminErrorBoundary>
  );
}
