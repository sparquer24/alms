'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { analyticsService, AnalyticsFilters } from '@/services/analyticsService';
import { LicenseService } from '@/services/licenseService';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout } from '@/styles/admin-design-system';
import { AdminErrorAlert, AdminErrorBoundary, AdminSectionSkeleton } from '@/components/admin';
import FiltersHeader from './FiltersHeader';
import ApplicationSummaryCards from './ApplicationSummaryCards';
import LicenseOverviewCards from './LicenseOverviewCards';
import ApplicationsByTypeView from '@/components/ApplicationsByTypeView';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}>{children}</h2>
);

/** Base analytics route (e.g. `/admin/analytics`) this panel is nested under. */
export default function ApplicationsOverviewPanel({ analyticsBasePath }: { analyticsBasePath: string }) {
  const { colors } = useAdminTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listType = searchParams?.get('type');

  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

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
    data: applicationStates = [],
    isLoading: stateLoading,
    error: stateError,
    refetch: refetchStates,
  } = useQuery({
    queryKey: ['analytics-states', fromDate, toDate],
    queryFn: async () =>
      analyticsService.getApplicationStates({ fromDate, toDate } as AnalyticsFilters),
  });

  const {
    data: licenseStats,
    isLoading: licenseStatsLoading,
    error: licenseStatsError,
    refetch: refetchLicenseStats,
  } = useQuery({
    queryKey: ['analytics-license-dashboard'],
    queryFn: async () => LicenseService.getLicenseDashboard(),
  });

  const summaryStats = useMemo(() => {
    const totalApplications = applicationsByWeek.reduce(
      (sum: number, item: any) => sum + item.count,
      0
    );
    const totalApproved = applicationStates.find((s: any) => s.state === 'approved')?.count || 0;
    const totalPending = applicationStates.find((s: any) => s.state === 'pending')?.count || 0;
    const totalRejected = applicationStates.find((s: any) => s.state === 'rejected')?.count || 0;

    const totalFresh = applicationsByWeek.reduce((sum: number, item: any) => sum + (item.fresh || 0), 0);
    const totalRenewal = applicationsByWeek.reduce((sum: number, item: any) => sum + (item.renewal || 0), 0);
    const totalCancel = applicationsByWeek.reduce((sum: number, item: any) => sum + (item.cancel || 0), 0);

    return {
      totalApplications,
      totalApproved,
      totalPending,
      totalRejected,
      totalFresh,
      totalRenewal,
      totalCancel,
    };
  }, [applicationsByWeek, applicationStates]);

  const handleReset30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setFromDate(format(date, 'yyyy-MM-dd'));
    setToDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const isLoading = appLoading || stateLoading;
  const applicationsPath = `${analyticsBasePath}/applications`;

  return (
    <AdminErrorBoundary>
      <div className="flex flex-col flex-grow">
        <FiltersHeader
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          onReset={handleReset30Days}
          onRefresh={() => {
            refetchApps();
            refetchStates();
            refetchLicenseStats();
          }}
          isLoading={isLoading}
          title="Applications Overview"
          subtitle="Total applications and licenses at a glance"
        />

        <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex gap-2 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-gray-200/80 w-fit">
            <Link
              href={analyticsBasePath}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                pathname === analyticsBasePath
                  ? 'bg-[#001F54] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Overview
            </Link>
            <Link
              href={applicationsPath}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                pathname === applicationsPath
                  ? 'bg-[#001F54] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Applications
            </Link>
          </div>

        {appError && (
          <AdminErrorAlert
            title='Failed to Load Applications'
            message={appError instanceof Error ? appError.message : 'Unknown error'}
            onRetry={() => refetchApps()}
          />
        )}
        {stateError && (
          <AdminErrorAlert
            title='Failed to Load Application States'
            message={stateError instanceof Error ? stateError.message : 'Unknown error'}
            onRetry={() => refetchStates()}
          />
        )}
        {licenseStatsError && (
          <AdminErrorAlert
            title='Failed to Load License Overview'
            message={licenseStatsError instanceof Error ? licenseStatsError.message : 'Unknown error'}
            onRetry={() => refetchLicenseStats()}
          />
        )}

        {listType ? (
          <div>
            <Link
              href={applicationsPath}
              style={{
                display: 'inline-block',
                marginBottom: AdminSpacing.md,
                fontSize: 14,
                fontWeight: 600,
                color: '#001F54',
                textDecoration: 'none',
              }}
            >
              ← Back to overview
            </Link>
            <ApplicationsByTypeView
              queryType={listType}
              source='org-wide'
              showActionColumn={false}
              fromDate={fromDate}
              toDate={toDate}
            />
          </div>
        ) : (
          <>
            {/* Total Applications */}
            <div>
              <SectionTitle>Total Applications</SectionTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: AdminSpacing.lg,
                  marginTop: AdminSpacing.md,
                }}
              >
                {isLoading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ minHeight: '100px' }}>
                      <AdminSectionSkeleton lines={3} height='100px' />
                    </div>
                  ))
                ) : (
                  <ApplicationSummaryCards stats={summaryStats} colors={colors} basePath={applicationsPath} />
                )}
              </div>
            </div>

            {/* Total Licenses */}
            <div style={{ marginTop: AdminSpacing.lg }}>
              <SectionTitle>Total Licenses</SectionTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: AdminSpacing.lg,
                  marginTop: AdminSpacing.md,
                }}
              >
                {licenseStatsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ minHeight: '100px' }}>
                      <AdminSectionSkeleton lines={3} height='100px' />
                    </div>
                  ))
                ) : (
                  <LicenseOverviewCards stats={licenseStats} colors={colors} />
                )}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </AdminErrorBoundary>
  );
}
