'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  analyticsService,
  AnalyticsFilters,
  ApplicationsDetailsResult,
} from '@/services/analyticsService';
import { useAdminTheme } from '@/context/AdminThemeContext';
import {
  AdminSpacing,
  AdminLayout,
  AdminBorderRadius,
  AdminTransitions,
} from '@/styles/admin-design-system';
import {
  AdminCard,
  AdminErrorAlert,
  AdminErrorBoundary,
  AdminSectionSkeleton,
} from '@/components/admin';
import { AdminActivityFeed } from '@/components/analytics/AdminActivityFeed';
import TimelineChart from './TimelineChart';
import RoleLoadChart from './RoleLoadChart';
import StatusDistributionChart from './StatusDistributionChart';
import FiltersHeader from './FiltersHeader';
import SummaryStats from './SummaryStats';
import ApplicationsTable from './ApplicationsTable';

export default function AnalyticsDashboard() {
  const { colors } = useAdminTheme();

  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const {
    data: applicationsByWeek = [],
    isLoading: appLoading,
    error: appError,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ['analytics-applications', fromDate, toDate],
    queryFn: async () =>
      analyticsService.getApplicationsByWeek({ fromDate, toDate } as AnalyticsFilters),
  });

  const {
    data: roleLoad = [],
    isLoading: roleLoading,
    error: roleError,
  } = useQuery({
    queryKey: ['analytics-roleload', fromDate, toDate],
    queryFn: async () => analyticsService.getRoleLoad({ fromDate, toDate } as AnalyticsFilters),
  });

  const {
    data: applicationStates = [],
    isLoading: stateLoading,
    error: stateError,
  } = useQuery({
    queryKey: ['analytics-states', fromDate, toDate],
    queryFn: async () =>
      analyticsService.getApplicationStates({ fromDate, toDate } as AnalyticsFilters),
  });

  const {
    data: adminActivities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: ['analytics-activities', fromDate, toDate],
    queryFn: async () =>
      analyticsService.getAdminActivities({ fromDate, toDate } as AnalyticsFilters),
  });

  const {
    data: applicationsDetails,
    isLoading: applicationsDetailsLoading,
    error: applicationsDetailsError,
    refetch: refetchApplicationsDetails,
  } = useQuery<ApplicationsDetailsResult>({
    queryKey: ['analytics-applications-details', page, pageSize, search, status, fromDate, toDate],
    queryFn: async () => {
      // include fromDate/toDate in API params so backend can filter table results
      return analyticsService.getApplicationsDetails({
        page,
        limit: pageSize,
        status: status || undefined,
        q: search.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sort: '-updatedAt',
      });
    },
  });

  const applications = applicationsDetails?.data || [];
  const totalApplicationsCount = applicationsDetails?.meta?.total ?? applications.length;
  const currentPage = applicationsDetails?.meta?.page ?? page;
  const currentLimit = applicationsDetails?.meta?.limit ?? pageSize;
  const start = (currentPage - 1) * currentLimit;

  const summaryStats = useMemo(() => {
    const totalApplications = applicationsByWeek.reduce(
      (sum: number, item: any) => sum + item.count,
      0
    );
    const totalApproved = applicationStates.find((s: any) => s.state === 'approved')?.count || 0;
    const totalPending = applicationStates.find((s: any) => s.state === 'pending')?.count || 0;
    const totalRejected = applicationStates.find((s: any) => s.state === 'rejected')?.count || 0;

    return {
      totalApplications,
      totalApproved,
      totalPending,
      totalRejected,
      approvalRate:
        totalApplications > 0 ? ((totalApproved / totalApplications) * 100).toFixed(1) : '0',
    };
  }, [applicationsByWeek, applicationStates]);

  const handleReset30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setFromDate(format(date, 'yyyy-MM-dd'));
    setToDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleExport = (data: any[], filename: string) => {
    try {
      analyticsService.exportToCSV(data, filename + '.csv');
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleDownload = () => {
    if (!applications || applications.length === 0) return;
    const header = [
      'S.No',
      'License ID',
      'Application Name',
      'Status',
      'Pending Details',
      'Action Taken At',
    ];
    const rows = applications.map((row, idx) => {
      const actionDate = row.actionTakenAt ? new Date(row.actionTakenAt) : null;
      const formattedDate =
        actionDate && !Number.isNaN(actionDate.valueOf())
          ? format(actionDate, 'yyyy-MM-dd HH:mm')
          : '--';
      const pendingParts: string[] = [];
      if (row.currentUser?.name) pendingParts.push(row.currentUser.name);
      if (row.daysTillToday !== null && row.daysTillToday !== undefined) {
        const dayLabel = row.daysTillToday === 1 ? 'day' : 'days';
        const daysText = '(' + row.daysTillToday + ' ' + dayLabel + ')';
        if (pendingParts.length)
          pendingParts[pendingParts.length - 1] =
            pendingParts[pendingParts.length - 1] + ' ' + daysText;
        else pendingParts.push(daysText);
      }
      const pendingDetails = pendingParts.length ? pendingParts.join(' ') : '--';
      return [
        String(start + idx + 1),
        row.licenseId || '',
        row.applicantName || '',
        row.status || '',
        pendingDetails,
        formattedDate,
      ];
    });
    const csv = [header, ...rows]
      .map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'applications-details.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = appLoading || roleLoading || stateLoading || applicationsDetailsLoading;

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
        <FiltersHeader
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          onReset={handleReset30Days}
          onRefresh={() => {
            refetchApps();
            refetchApplicationsDetails();
          }}
          isLoading={isLoading}
        />

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
        {applicationsDetailsError && (
          <AdminErrorAlert
            title='Failed to Load Application Details'
            message={
              applicationsDetailsError instanceof Error
                ? applicationsDetailsError.message
                : 'Unknown error'
            }
            onRetry={() => refetchApplicationsDetails()}
          />
        )}

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
            <SummaryStats stats={summaryStats} colors={colors} loading={isLoading} />
          )}
        </div>

        {/* Charts section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: AdminSpacing.lg,
            marginTop: AdminSpacing.lg,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: AdminSpacing.lg,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: AdminSpacing.sm,
                  color: 'black',
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Applications by Week
              </h3>
              <AdminCard>
                <TimelineChart data={applicationsByWeek} colors={colors} loading={isLoading} />
              </AdminCard>
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: AdminSpacing.sm,
                  color: 'black',
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Role Load
              </h3>
              <AdminCard>
                <RoleLoadChart data={roleLoad} colors={colors} loading={isLoading} />
              </AdminCard>
            </div>
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                marginBottom: AdminSpacing.sm,
                color: 'black',
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Status Distribution
            </h3>
            <AdminCard>
              <StatusDistributionChart
                data={applicationStates}
                colors={colors}
                loading={isLoading}
              />
            </AdminCard>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: AdminSpacing.lg }} />

        {/* Bottom row removed — applications table shown below; activities moved to end */}

        {/* Applications Table */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: AdminSpacing.sm,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={() => handleExport(applications, 'applications_details')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid ' + colors.border,
                  background: colors.surface,
                  color: colors.text.primary,
                  fontWeight: 700,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                Export CSV
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid ' + colors.border,
                  background: colors.surface,
                  color: colors.text.primary,
                  fontWeight: 700,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                Download Visible
              </button>
            </div>
            <div
              style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: AdminSpacing.sm }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 6 }}>
                  License ID
                </label>
                <input
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder='Search by License ID'
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid ' + colors.border,
                    minWidth: 200,
                  }}
                />
              </div>

              {/* Note: From/To filters are centralized in FiltersHeader; keep only main search here */}
            </div>
            <div style={{ color: colors.text.secondary, fontSize: 13 }}>
              {totalApplicationsCount === 0 ? (
                'No applications'
              ) : (
                <>
                  Showing {start + 1} - {start + applications.length} of {totalApplicationsCount}
                </>
              )}
            </div>
          </div>

          <ApplicationsTable
            applications={applications}
            loading={applicationsDetailsLoading}
            start={start}
            total={totalApplicationsCount}
            colors={colors}
          />

          {/* Simple pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: AdminSpacing.md,
            }}
          >
            {(() => {
              const totalPages = Math.max(1, Math.ceil(totalApplicationsCount / currentLimit));
              return (
                <>
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid ' + colors.border,
                      background: colors.surface,
                    }}
                  >
                    Prev
                  </button>
                  <span style={{ color: colors.text.secondary }}>
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid ' + colors.border,
                      background: colors.surface,
                    }}
                  >
                    Next
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        {/* Admin Activities moved to end */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: AdminSpacing.sm, color: 'black' }}>
            Admin Activities
          </h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: AdminSpacing.sm }}>
            <button
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid ' + colors.border,
                background: colors.surface,
                color: colors.text.primary,
              }}
            >
              👥 Grouped by User
            </button>
            <button
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid ' + colors.border,
                background: colors.surface,
                color: colors.text.primary,
              }}
            >
              📅 Timeline View
            </button>
          </div>
          <AdminCard>
            <AdminActivityFeed
              activities={adminActivities}
              isLoading={activitiesLoading}
              error={activitiesError ? String(activitiesError) : undefined}
            />
          </AdminCard>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}
