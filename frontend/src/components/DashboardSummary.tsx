"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardApi } from '../config/APIClient';
import { useAuth } from '../config/auth';
import {
  ApplicationStatusChart,
  ApplicationTrendChart,
  ProcessingTimeChart,
} from './DashboardCharts';

interface DashboardStat {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  action: string;
  applicationId: string;
  timestamp: string;
}

const StatsCard: React.FC<DashboardStat> = React.memo(({ label, count, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-5" aria-label={`${label} stats card`}>
    <div className="flex justify-between">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="mt-1 text-3xl font-semibold">{count}</span>
      </div>
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    </div>
  </div>
));

const RecentActivityItem: React.FC<RecentActivity & { getActionLabel: (action: string) => string; getActionColor: (action: string) => string; formatDate: (date: string) => string }> = React.memo(({ action, applicationId, timestamp, getActionLabel, getActionColor, formatDate }) => (
  <div className="px-5 py-4" aria-label={`Recent activity for application ${applicationId}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <span className={`font-medium ${getActionColor(action)}`}>{getActionLabel(action)}</span>
        <span className="mx-2 text-gray-500">-</span>
        <span className="text-gray-900">{applicationId}</span>
      </div>
      <span className="text-sm text-gray-500">{formatDate(timestamp)}</span>
    </div>
  </div>
));

export default function DashboardSummary() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [userStats, setUserStats] = useState<{
    totalProcessed: number;
    approvalRate: number;
    averageProcessTime: string;
  } | null>(null);

  const [applicationStatusData, setApplicationStatusData] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    returned: 0,
    verified: 0,
  });

  const [applicationTrendData, setApplicationTrendData] = useState({
    labels: [] as string[],
    pending: [] as number[],
    approved: [] as number[],
    rejected: [] as number[],
  });

  const [processingTimeData, setProcessingTimeData] = useState({
    labels: [] as string[],
    averageDays: [] as number[],
  });

  const { token } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await DashboardApi.getSummary();

      if (response.success && response.body) {
        const data = response.body;

        setStats(
          [
            {
              label: 'Pending',
              count: data.pendingApplications || 0,
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              color: 'bg-yellow-100 text-yellow-800',
            },
            {
              label: 'Approved',
              count: data.approvedApplications || 0,
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              color: 'bg-green-100 text-green-800',
            },
            {
              label: 'Rejected',
              count: data.rejectedApplications || 0,
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              color: 'bg-red-100 text-red-800',
            },
            {
              label: 'Notifications',
              count: data.unreadNotifications || 0,
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
              color: 'bg-indigo-100 text-indigo-800',
            },
          ]
        );

        setRecentActivities(data.recentActivities || []);
        setUserStats(data.userStats || null);

        setApplicationStatusData({
          pending: data.pendingApplications || 0,
          approved: data.approvedApplications || 0,
          rejected: data.rejectedApplications || 0,
          returned: data.returnedApplications || 0,
          verified: data.verifiedApplications || 0,
        });

        if (data.applicationTrends) {
          setApplicationTrendData({
            labels: data.applicationTrends.dates || [],
            pending: data.applicationTrends.pending || [],
            approved: data.applicationTrends.approved || [],
            rejected: data.applicationTrends.rejected || [],
          });
        }

        if (data.processingTimes) {
          setProcessingTimeData({
            labels: data.processingTimes.licenseTypes || [],
            averageDays: data.processingTimes.averageDays || [],
          });
        }
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('An error occurred while fetching dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  }, []);

  const getActionLabel = useCallback((action: string): string => {
    const actionMap: Record<string, string> = {
      APPLICATION_APPROVED: 'Approved',
      APPLICATION_REJECTED: 'Rejected',
      APPLICATION_FORWARDED: 'Forwarded',
      APPLICATION_RETURNED: 'Returned',
      APPLICATION_CREATED: 'Created',
      APPLICATION_UPDATED: 'Updated',
      APPLICATION_RED_FLAGGED: 'Flagged',
    };
    return actionMap[action] || action;
  }, []);

  const getActionColor = useCallback((action: string): string => {
    const colorMap: Record<string, string> = {
      APPLICATION_APPROVED: 'text-green-600',
      APPLICATION_REJECTED: 'text-red-600',
      APPLICATION_FORWARDED: 'text-blue-600',
      APPLICATION_RETURNED: 'text-yellow-600',
      APPLICATION_CREATED: 'text-gray-600',
      APPLICATION_UPDATED: 'text-indigo-600',
      APPLICATION_RED_FLAGGED: 'text-orange-600',
    };
    return colorMap[action] || 'text-gray-600';
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <ApplicationStatusChart statusData={applicationStatusData} />
        </div>

        {/* Application Trend Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <ApplicationTrendChart trendData={applicationTrendData} />
        </div>
      </div>

      {/* Processing Time Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <ProcessingTimeChart processingTimeData={processingTimeData} />
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.length === 0 ? (
            <div className="px-5 py-4 text-gray-500 text-center">No recent activities</div>
          ) : (
            recentActivities.map((activity, index) => (
              <RecentActivityItem
                key={index}
                {...activity}
                getActionLabel={getActionLabel}
                getActionColor={getActionColor}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{userStats.totalProcessed}</div>
              <div className="text-sm text-gray-500 mt-1">Applications Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{userStats.approvalRate}%</div>
              <div className="text-sm text-gray-500 mt-1">Approval Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{userStats.averageProcessTime}</div>
              <div className="text-sm text-gray-500 mt-1">Avg. Process Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
