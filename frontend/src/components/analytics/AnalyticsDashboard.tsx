'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  // Local input for license search to debounce network requests
  const [licenseInput, setLicenseInput] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Debounce license input -> update `search` after a short delay
  useEffect(() => {
    const t = setTimeout(() => {
      // only update and trigger refetch when trimmed value changes
      const trimmed = licenseInput.trim();
      if (trimmed !== search) {
        setSearch(trimmed);
        setPage(1);
        if (trimmed) {
          // when filtering by license, remove date range filters
          setFromDate('');
          setToDate('');
        } else {
          // restore default 30-day window when search cleared
          const date = new Date();
          date.setDate(date.getDate() - 30);
          setFromDate(format(date, 'yyyy-MM-dd'));
          setToDate(format(new Date(), 'yyyy-MM-dd'));
        }
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseInput]);

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
      const qStr = search.trim();
      // If user is searching by license id, fetch all (no date-filter) and client-filter
      if (qStr) {
        const res = await analyticsService.getApplicationsDetails({
          page: 1,
          limit: 100000,
          status: status || undefined,
          q: undefined,
          fromDate: undefined,
          toDate: undefined,
          sort: '-updatedAt',
        });
        const filtered = (res.data || []).filter(r =>
          (r.licenseId || '').toLowerCase().includes(qStr.toLowerCase())
        );
        return {
          success: true,
          data: filtered,
          meta: {
            total: filtered.length,
            page: 1,
            limit: filtered.length,
          },
        } as ApplicationsDetailsResult;
      }

      // default: include fromDate/toDate so backend can filter server-side
      return analyticsService.getApplicationsDetails({
        page,
        limit: pageSize,
        status: status || undefined,
        q: undefined,
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: AdminSpacing.lg,
            }}
          >
            <div>
              <h2
                style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}
              >
                Applications by Week
              </h2>
              <AdminCard>
                <TimelineChart data={applicationsByWeek} colors={colors} loading={isLoading} />
              </AdminCard>
            </div>

            <div>
              <h2
                style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}
              >
                Role Load
              </h2>
              <AdminCard>
                <RoleLoadChart data={roleLoad} colors={colors} loading={isLoading} />
              </AdminCard>
            </div>
          </div>

          <div>
            <h2
              style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}
            >
              Status Distribution
            </h2>
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

        {/* Applications Table */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              marginBottom: AdminSpacing.md,
              flexWrap: 'wrap',
              gap: AdminSpacing.md,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}>
                Applications Details
              </h2>
              <div style={{ color: colors.text.secondary, fontSize: 13, marginTop: 4 }}>
                {totalApplicationsCount === 0 ? (
                  'No applications'
                ) : (
                  <>
                    Showing {start + 1} - {start + applications.length} of {totalApplicationsCount}
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <input
                  value={licenseInput}
                  onChange={e => setLicenseInput(e.target.value)}
                  placeholder='Search by License ID'
                  style={{
                    padding: '8px 12px',
                    paddingLeft: '36px',
                    borderRadius: 8,
                    border: '1px solid ' + colors.border,
                    minWidth: 240,
                    height: 38,
                    fontSize: 14,
                  }}
                />
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 18,
                    height: 18,
                    color: colors.text.secondary,
                  }}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 005.196 5.196z'
                  />
                </svg>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleExport(applications, 'applications_details')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid ' + colors.border,
                    background: colors.surface,
                    color: colors.text.primary,
                    fontWeight: 600,
                    fontSize: 13,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    style={{ width: 16, height: 16 }}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3'
                    />
                  </svg>
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
                    fontWeight: 600,
                    fontSize: 13,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    style={{ width: 16, height: 16 }}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5m-4.5 4.5V3'
                    />
                  </svg>
                  Download Visible
                </button>
              </div>
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
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}>
            Admin Activities
          </h2>
          <AdminCard>
            <div
              style={{
                maxHeight: '420px',
                overflowY: 'auto',
                // small right padding so native scrollbar doesn't overlap content
                paddingRight: AdminSpacing.sm,
              }}
            >
              <AdminActivityFeed
                activities={adminActivities}
                isLoading={activitiesLoading}
                error={activitiesError ? String(activitiesError) : undefined}
              />
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}