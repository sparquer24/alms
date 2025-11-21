'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '../../../components/Sidebar';
import {
  ChartCard,
  StatCard,
  DrillDownPanel,
  LoadingSkeleton,
} from '../../../components/analytics/AnalyticsComponents';
import { AdminActivityFeed } from '../../../components/analytics/AdminActivityFeed';
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
  LineChart,
  Line,
} from 'recharts';
import {
  analyticsService,
  AnalyticsFilters,
  ApplicationsData,
  RoleLoadData,
  StateData,
  AdminActivity,
} from '@/services/analyticsService';
import { format, parseISO, startOfISOWeek, endOfISOWeek } from 'date-fns';

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
const LineChartFixed = LineChart as any;
const LineFixed = Line as any;

const COLORS = ['#6366F1', '#F59E42', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

interface DrillDownState {
  isOpen: boolean;
  title: string;
  data: any[];
  type?: 'applications' | 'roles' | 'states';
}

export default function AnalyticsPage() {
  // Date range state
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Data state
  const [applicationsByWeek, setApplicationsByWeek] = useState<ApplicationsData[]>([]);
  const [roleLoad, setRoleLoad] = useState<RoleLoadData[]>([]);
  const [applicationStates, setApplicationStates] = useState<StateData[]>([]);
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([]);

  // Loading state
  const [loading, setLoading] = useState({
    applications: false,
    roleLoad: false,
    states: false,
    activities: false,
  });

  // Error state
  const [errors, setErrors] = useState({
    applications: '',
    roleLoad: '',
    states: '',
    activities: '',
  });

  // Drill-down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    isOpen: false,
    title: '',
    data: [],
  });

  // Theme detection
  const [isDark, setIsDark] = useState(false);

  // Fetch all analytics data - memoized function
  const fetchAnalyticsData = useCallback(
    async (fromDateParam?: string, toDateParam?: string) => {
      setLoading({ applications: true, roleLoad: true, states: true, activities: true });
      setErrors({ applications: '', roleLoad: '', states: '', activities: '' });

      const filters: AnalyticsFilters = {
        fromDate: fromDateParam || fromDate,
        toDate: toDateParam || toDate,
      };

      try {
        // Fetch all data in parallel
        const [apps, roles, states, activities] = await Promise.allSettled([
          analyticsService.getApplicationsByWeek(filters),
          analyticsService.getRoleLoad(filters),
          analyticsService.getApplicationStates(filters),
          analyticsService.getAdminActivities(filters),
        ]);

        if (apps.status === 'fulfilled') {
          setApplicationsByWeek(apps.value);
        } else {
          setErrors(prev => ({ ...prev, applications: 'Failed to load applications data' }));
        }

        if (roles.status === 'fulfilled') {
          setRoleLoad(roles.value);
        } else {
          setErrors(prev => ({ ...prev, roleLoad: 'Failed to load role data' }));
        }

        if (states.status === 'fulfilled') {
          setApplicationStates(states.value);
        } else {
          setErrors(prev => ({ ...prev, states: 'Failed to load states data' }));
        }

        if (activities.status === 'fulfilled') {
          setAdminActivities(activities.value);
        } else {
          setErrors(prev => ({ ...prev, activities: 'Failed to load activities' }));
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setErrors({
          applications: 'Error loading data',
          roleLoad: 'Error loading data',
          states: 'Error loading data',
          activities: 'Error loading data',
        });
      } finally {
        setLoading({ applications: false, roleLoad: false, states: false, activities: false });
      }
    },
    [fromDate, toDate]
  );

  // Initial fetch and setup
  useEffect(() => {
    fetchAnalyticsData();

    // Detect dark mode
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(darkMode);

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchAnalyticsData(fromDate, toDate);
  }, [fromDate, toDate]);

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

  // Handle bar click for drill-down
  const handleBarClick = (data: ApplicationsData) => {
    const weekDate = data.date || data.week;
    setDrillDown({
      isOpen: true,
      title: `Applications for Week ${weekDate}`,
      data: [{ week: data.week, count: data.count, date: data.date }],
      type: 'applications',
    });
  };

  // Handle pie slice click for drill-down
  const handlePieClick = (data: RoleLoadData) => {
    setDrillDown({
      isOpen: true,
      title: `${data.name} - Load Details`,
      data: [data],
      type: 'roles',
    });
  };

  // Handle state click for drill-down
  const handleStateClick = (data: StateData) => {
    setDrillDown({
      isOpen: true,
      title: `${data.state.charAt(0).toUpperCase() + data.state.slice(1)} Applications`,
      data: [data],
      type: 'states',
    });
  };

  // Handle export
  const handleExport = (format: 'csv' | 'xlsx') => {
    try {
      const exportData = drillDown.data.length > 0 ? drillDown.data : applicationsByWeek;

      if (format === 'csv') {
        analyticsService.exportToCSV(
          exportData,
          `analytics-${drillDown.type || 'applications'}.csv`
        );
      } else {
        analyticsService.exportToExcel(
          exportData,
          `analytics-${drillDown.type || 'applications'}.xlsx`
        );
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className='flex h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200'>
      <Sidebar />
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <header className='bg-white dark:bg-gray-800 shadow-sm dark:shadow-lg border-b dark:border-gray-700'>
          <div className='px-6 py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Analytics Dashboard
                </h1>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  Track applications and system performance
                </p>
              </div>
              <button
                onClick={() => fetchAnalyticsData(fromDate, toDate)}
                disabled={loading.applications || loading.roleLoad || loading.states}
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Date filters */}
          <div className='px-6 pb-6 border-t dark:border-gray-700 pt-6'>
            <div className='flex flex-col sm:flex-row gap-4 items-end'>
              <div className='flex-1'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  From Date
                </label>
                <input
                  type='date'
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all'
                />
              </div>
              <div className='flex-1'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  To Date
                </label>
                <input
                  type='date'
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all'
                />
              </div>
              <button
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() - 30);
                  setFromDate(format(date, 'yyyy-MM-dd'));
                  setToDate(format(new Date(), 'yyyy-MM-dd'));
                }}
                className='px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors'
              >
                Last 30 Days
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className='flex-1 overflow-y-auto'>
          <div className='p-6 space-y-6'>
            {/* Summary Stats */}
            <div>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-4'>Summary</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
                <StatCard
                  title='Total Applications'
                  value={summaryStats.totalApplications}
                  loading={loading.applications}
                  error={errors.applications}
                />
                <StatCard
                  title='Approved'
                  value={summaryStats.totalApproved}
                  loading={loading.states}
                  subtitle='% of total'
                />
                <StatCard
                  title='Pending'
                  value={summaryStats.totalPending}
                  loading={loading.states}
                  subtitle='Awaiting review'
                />
                <StatCard
                  title='Rejected'
                  value={summaryStats.totalRejected}
                  loading={loading.states}
                  subtitle='Did not pass'
                />
                <StatCard
                  title='Approval Rate'
                  value={`${summaryStats.approvalRate}%`}
                  loading={loading.applications}
                  subtitle='Success rate'
                />
              </div>
            </div>

            {/* Charts Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Applications Over Time Chart */}
              <ChartCard
                title='Applications Over Time (Weekly)'
                isLoading={loading.applications}
                error={errors.applications}
                actions={
                  <button
                    onClick={() =>
                      analyticsService.exportToCSV(applicationsByWeek, 'applications-timeline.csv')
                    }
                    className='px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors'
                  >
                    CSV
                  </button>
                }
              >
                <ResponsiveContainerFixed width='100%' height={300}>
                  <BarChartFixed
                    data={applicationsByWeek}
                    onClick={(state: any) => handleBarClick(state.activeTooltipIndex)}
                  >
                    <CartesianGridFixed
                      strokeDasharray='3 3'
                      stroke={isDark ? '#374151' : '#e5e7eb'}
                    />
                    <XAxisFixed dataKey='week' stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <YAxisFixed stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <TooltipFixed
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                        color: isDark ? '#f3f4f6' : '#111827',
                        borderRadius: '8px',
                      }}
                      cursor={{
                        fill: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                      }}
                    />
                    <BarFixed
                      dataKey='count'
                      fill='#6366F1'
                      radius={[8, 8, 0, 0]}
                      onClick={(data: any) => handleBarClick(data)}
                      animationDuration={300}
                    />
                  </BarChartFixed>
                </ResponsiveContainerFixed>
              </ChartCard>

              {/* Role-wise Application Load Chart */}
              <ChartCard
                title='Role-wise Application Load'
                isLoading={loading.roleLoad}
                error={errors.roleLoad}
                actions={
                  <button
                    onClick={() => analyticsService.exportToCSV(roleLoad, 'role-load.csv')}
                    className='px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors'
                  >
                    CSV
                  </button>
                }
              >
                <ResponsiveContainerFixed width='100%' height={300}>
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
                      onClick={(data: any) => handlePieClick(data)}
                    >
                      {roleLoad.map((entry, idx) => (
                        <CellFixed key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </PieFixed>
                    <TooltipFixed
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                        color: isDark ? '#f3f4f6' : '#111827',
                        borderRadius: '8px',
                      }}
                    />
                    <LegendFixed />
                  </PieChartFixed>
                </ResponsiveContainerFixed>
              </ChartCard>
            </div>

            {/* Application States Distribution */}
            <ChartCard
              title='Application Status Distribution'
              isLoading={loading.states}
              error={errors.states}
              actions={
                <button
                  onClick={() =>
                    analyticsService.exportToCSV(applicationStates, 'application-states.csv')
                  }
                  className='px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors'
                >
                  CSV
                </button>
              }
            >
              <ResponsiveContainerFixed width='100%' height={300}>
                <BarChartFixed data={applicationStates} layout='vertical'>
                  <CartesianGridFixed
                    strokeDasharray='3 3'
                    stroke={isDark ? '#374151' : '#e5e7eb'}
                  />
                  <XAxisFixed type='number' stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxisFixed
                    dataKey='state'
                    type='category'
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                  />
                  <TooltipFixed
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                      color: isDark ? '#f3f4f6' : '#111827',
                      borderRadius: '8px',
                    }}
                  />
                  <BarFixed
                    dataKey='count'
                    fill='#10B981'
                    radius={[0, 8, 8, 0]}
                    onClick={(data: any) => handleStateClick(data)}
                    animationDuration={300}
                  />
                </BarChartFixed>
              </ResponsiveContainerFixed>
            </ChartCard>

            {/* Admin Activity Feed */}
            <div>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-4'>
                Recent Activities
              </h2>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6'>
                <AdminActivityFeed
                  activities={adminActivities}
                  isLoading={loading.activities}
                  error={errors.activities}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Drill-down Side Panel */}
      <DrillDownPanel
        isOpen={drillDown.isOpen}
        title={drillDown.title}
        data={drillDown.data}
        onClose={() => setDrillDown({ ...drillDown, isOpen: false })}
        onExport={handleExport}
      />
    </div>
  );
}
