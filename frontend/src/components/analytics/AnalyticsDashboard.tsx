'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { analyticsService, AnalyticsFilters } from '@/services/analyticsService';
import { LicenseService } from '@/services/licenseService';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout } from '@/styles/admin-design-system';
import { AdminCard, AdminErrorAlert, AdminErrorBoundary, AdminSectionSkeleton } from '@/components/admin';
import FiltersHeader from './FiltersHeader';
import ApplicationSummaryCards from './ApplicationSummaryCards';
import LicenseOverviewCards from './LicenseOverviewCards';
import ApplicationTypeChart from './ApplicationTypeChart';
import ApplicationStatusChart from './ApplicationStatusChart';
import LicenseStatusChart from './LicenseStatusChart';
import PendingApplicationsSection from './PendingApplicationsSection';
import ExpiringLicensesSection from './ExpiringLicensesSection';
import RecentActivitySection from './RecentActivitySection';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'black' }}>{children}</h2>
);

export default function AnalyticsDashboard({
  analyticsBasePath = '/inbox/analytics',
}: {
  analyticsBasePath?: string;
} = {}) {
  const { colors } = useAdminTheme();
  const pathname = usePathname();
  const applicationsPath = `${analyticsBasePath}/applications`;

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

  const {
    data: pendingApplications = [],
    isLoading: pendingLoading,
    error: pendingError,
  } = useQuery({
    queryKey: ['analytics-pending-applications'],
    queryFn: async () => {
      const res = await analyticsService.getApplicationsDetails({
        status: 'pending',
        limit: 5,
        sort: '-updatedAt',
      });
      return res.data || [];
    },
  });

  const {
    data: expiringLicenses = [],
    isLoading: expiringLoading,
    error: expiringError,
  } = useQuery({
    queryKey: ['analytics-expiring-licenses'],
    queryFn: async () => {
      const res = await LicenseService.getAllLicenses({
        expiringWithinDays: 30,
        orderBy: 'validTill',
        order: 'asc',
        limit: 5,
      });
      return res?.data || [];
    },
  });

  const { data: recentApplications = [], isLoading: recentAppsLoading } = useQuery({
    queryKey: ['analytics-recent-applications'],
    queryFn: async () => {
      const res = await analyticsService.getApplicationsDetails({ limit: 5, sort: '-updatedAt' });
      return res.data || [];
    },
  });

  const { data: recentLicenses = [], isLoading: recentLicensesLoading } = useQuery({
    queryKey: ['analytics-recent-licenses'],
    queryFn: async () => {
      const res = await LicenseService.getAllLicenses({ orderBy: 'createdAt', order: 'desc', limit: 5 });
      return res?.data || [];
    },
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
        {pendingError && (
          <AdminErrorAlert
            title='Failed to Load Pending Applications'
            message={pendingError instanceof Error ? pendingError.message : 'Unknown error'}
          />
        )}
        {expiringError && (
          <AdminErrorAlert
            title='Failed to Load Expiring Licenses'
            message={expiringError instanceof Error ? expiringError.message : 'Unknown error'}
          />
        )}

        {/* Application summary cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: AdminSpacing.lg,
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

        {/* Application Analytics */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <SectionTitle>Application Analytics</SectionTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: AdminSpacing.lg,
              marginTop: AdminSpacing.md,
            }}
          >
            <AdminCard title='By Type'>
              <ApplicationTypeChart
                fresh={summaryStats.totalFresh}
                renewal={summaryStats.totalRenewal}
                cancel={summaryStats.totalCancel}
                colors={colors}
                loading={isLoading}
              />
            </AdminCard>
            <AdminCard title='By Status'>
              <ApplicationStatusChart
                approved={summaryStats.totalApproved}
                pending={summaryStats.totalPending}
                rejected={summaryStats.totalRejected}
                colors={colors}
                loading={isLoading}
              />
            </AdminCard>
          </div>
        </div>

        {/* License Overview */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <SectionTitle>License Overview</SectionTitle>
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
          <div style={{ marginTop: AdminSpacing.lg, maxWidth: 640 }}>
            <AdminCard title='License Status'>
              <LicenseStatusChart stats={licenseStats} colors={colors} loading={licenseStatsLoading} />
            </AdminCard>
          </div>
        </div>

        {/* Pending Applications */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <PendingApplicationsSection
            applications={pendingApplications}
            loading={pendingLoading}
            colors={colors}
          />
        </div>

        {/* Expiring Licenses */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <ExpiringLicensesSection
            licenses={expiringLicenses}
            loading={expiringLoading}
            colors={colors}
          />
        </div>

        {/* Recent Activity */}
        <div style={{ marginTop: AdminSpacing.lg }}>
          <RecentActivitySection
            applications={recentApplications}
            licenses={recentLicenses}
            loading={recentAppsLoading || recentLicensesLoading}
            colors={colors}
          />
        </div>
        </div>
      </div>
    </AdminErrorBoundary>
  );
}
