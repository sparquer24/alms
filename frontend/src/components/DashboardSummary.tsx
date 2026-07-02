"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardApi } from '../config/APIClient';
import { useAuth } from '@/hooks/useAuth';
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
  <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl group bg-white border border-slate-100 shadow-sm`} aria-label={`${label} stats card`}>
    <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-20 transition-transform duration-500 group-hover:scale-150 ${color.split(' ')[0]}`}></div>
    <div className="relative flex justify-between items-start z-10">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-500 tracking-wide uppercase">{label}</span>
        <span className="mt-2 text-4xl font-extrabold text-slate-800 tracking-tight">{count}</span>
      </div>
      <div className={`p-4 rounded-2xl shadow-sm ${color} backdrop-blur-sm bg-opacity-90 transition-transform duration-300 group-hover:rotate-12`}>
        {icon}
      </div>
    </div>
  </div>
));

const RecentActivityItem: React.FC<RecentActivity & { getActionLabel: (action: string) => string; getActionColor: (action: string) => string; formatDate: (date: string) => string }> = React.memo(({ action, applicationId, timestamp, getActionLabel, getActionColor, formatDate }) => (
  <div className="px-6 py-4 hover:bg-slate-50 transition-colors duration-200 cursor-pointer group" aria-label={`Recent activity for application ${applicationId}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${getActionColor(action).replace('text-', 'bg-')} shadow-sm group-hover:animate-pulse`}></div>
        <div className="flex flex-col sm:flex-row sm:items-center">
           <span className={`font-semibold ${getActionColor(action)}`}>{getActionLabel(action)}</span>
           <span className="hidden sm:inline mx-2 text-slate-300">|</span>
           <span className="text-slate-700 font-medium">App #{applicationId}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">{formatDate(timestamp)}</span>
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
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              color: 'bg-amber-100 text-amber-600',
            },
            {
              label: 'Approved',
              count: data.approvedApplications || 0,
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              color: 'bg-emerald-100 text-emerald-600',
            },
            {
              label: 'Rejected',
              count: data.rejectedApplications || 0,
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              color: 'bg-rose-100 text-rose-600',
            },
            {
              label: 'Notifications',
              count: data.unreadNotifications || 0,
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
              color: 'bg-blue-100 text-blue-600',
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
    <div className="space-y-8 p-2 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Application Status Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-300">
          <ApplicationStatusChart statusData={applicationStatusData} />
        </div>

        {/* Application Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-300">
          <ApplicationTrendChart trendData={applicationTrendData} />
        </div>
      </div>

      {/* Processing Time Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-300">
        <ProcessingTimeChart processingTimeData={processingTimeData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activities
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="px-6 py-8 text-slate-400 text-center font-medium">No recent activities found.</div>
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
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-indigo-900 opacity-20 rounded-full blur-xl"></div>
            
            <h3 className="text-xl font-bold mb-6 relative z-10 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Your Performance
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                <div className="text-sm font-medium text-indigo-100 uppercase tracking-wider mb-1">Processed</div>
                <div className="text-4xl font-black">{userStats.totalProcessed}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                  <div className="text-xs font-medium text-indigo-100 uppercase tracking-wider mb-1">Approval Rate</div>
                  <div className="text-2xl font-bold">{userStats.approvalRate}%</div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
                  <div className="text-xs font-medium text-indigo-100 uppercase tracking-wider mb-1">Avg Time</div>
                  <div className="text-2xl font-bold">{userStats.averageProcessTime}</div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
      </div>
  );
}
