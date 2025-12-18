import React, { useState, useMemo } from 'react';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminActivity } from '@/services/analyticsService';

interface AdminActivityFeedProps {
  activities: AdminActivity[];
  isLoading?: boolean;
  error?: string;
}

type StatusPalette = { success: string; error: string; warning: string; info: string };

// Convert hex color to rgba string with opacity
const withOpacity = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized
        .split('')
        .map(ch => ch + ch)
        .join('')
    : sanitized;

  const int = parseInt(value, 16);
  if (Number.isNaN(int)) return hex;

  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper function to get action color and icon aligned with analytics palette
const getActionStyle = (action: string, palette: StatusPalette, neutral: string) => {
  const baseStyle = (color: string, icon: string) => ({
    textColor: color,
    bgColor: withOpacity(color, 0.1),
    borderColor: withOpacity(color, 0.35),
    icon,
    iconBg: color,
    chipBg: withOpacity(color, 0.16),
    chipText: color,
  });

  const actionUpper = action.toUpperCase();
  if (actionUpper.includes('APPROVED')) {
    return baseStyle(palette.success, '✓');
  } else if (actionUpper.includes('REJECTED')) {
    return baseStyle(palette.error, '✕');
  } else if (actionUpper.includes('FORWARD')) {
    return baseStyle(palette.info, '→');
  } else if (actionUpper.includes('INITIATED')) {
    return baseStyle(palette.warning, '⚡');
  }
  return baseStyle(neutral, '●');
};

// Helper function to format relative time
const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export function AdminActivityFeed({ activities, isLoading, error }: AdminActivityFeedProps) {
  const { colors } = useAdminTheme();
  const [viewMode, setViewMode] = useState<'timeline' | 'grouped'>('grouped');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const neutralText = colors.text.secondary;
  const palette = colors.status;

  // Group activities by user
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, AdminActivity[]>();
    activities.forEach((activity) => {
      if (!groups.has(activity.user)) {
        groups.set(activity.user, []);
      }
      groups.get(activity.user)?.push(activity);
    });
    return groups;
  }, [activities]);

  const toggleUser = (user: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(user)) {
        newSet.delete(user);
      } else {
        newSet.add(user);
      }
      return newSet;
    });
  };

  if (error) {
    return (
      <div className='text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>⚠</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className='h-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg animate-pulse'
          />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className='text-center py-16'>
        <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4'>
          <svg
            className='w-8 h-8 text-gray-400 dark:text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
            />
          </svg>
        </div>
        <p className='text-lg font-medium text-gray-600 dark:text-gray-400'>No activities yet</p>
        <p className='text-sm text-gray-500 dark:text-gray-500 mt-1'>
          Activity feed will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div
        className='flex gap-2 mb-6 rounded-lg p-1 w-fit border'
        style={{
          backgroundColor: withOpacity(palette.info, 0.08),
          borderColor: withOpacity(palette.info, 0.2),
        }}
      >
        <button
          onClick={() => setViewMode('grouped')}
          className='px-4 py-2 rounded-md text-sm font-medium transition-all'
          style={
            viewMode === 'grouped'
              ? {
                  backgroundColor: colors.background,
                  color: palette.info,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }
              : {
                  color: neutralText,
                }
          }
        >
          👥 Grouped by User
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className='px-4 py-2 rounded-md text-sm font-medium transition-all'
          style={
            viewMode === 'timeline'
              ? {
                  backgroundColor: colors.background,
                  color: palette.info,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }
              : {
                  color: neutralText,
                }
          }
        >
          📅 Timeline View
        </button>
      </div>

      {/* Grouped View */}
      {viewMode === 'grouped' ? (
        <div className='space-y-4'>
          {Array.from(groupedActivities.entries()).map(([user, userActivities]) => {
            const isExpanded = expandedUsers.has(user);
            const latestActivity = userActivities[0];
            const activityCount = userActivities.length;
            const style = getActionStyle(latestActivity.action, palette, neutralText);

            return (
              <div
                key={user}
                className='border rounded-lg overflow-hidden hover:shadow-lg transition-shadow'
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                }}
              >
                {/* User Header */}
                <div
                  className='p-4 cursor-pointer transition-colors'
                  style={{
                    backgroundColor: style.bgColor,
                    borderBottom: `1px solid ${style.borderColor}`,
                  }}
                  onClick={() => toggleUser(user)}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 flex-1'>
                      {/* User Avatar */}
                      <div
                        className='w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md'
                        style={{ backgroundColor: style.iconBg }}
                      >
                        {user.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-semibold text-gray-900 dark:text-white'>{user}</h3>
                          <span
                            className='px-2 py-0.5 rounded-full text-xs font-medium'
                            style={{
                              backgroundColor: withOpacity(palette.info, 0.16),
                              color: palette.info,
                            }}
                          >
                            {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${style.textColor}`}>{latestActivity.action}</p>
                        <div className='flex flex-wrap items-center gap-3 mt-2'>
                          {latestActivity.applicantName && (
                            <div className='flex items-center gap-1.5'>
                              <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                                Applicant Name:
                              </span>
                              <span className='text-xs text-gray-700 dark:text-gray-300 font-medium'>
                                {latestActivity.applicantName}
                              </span>
                            </div>
                          )}
                          {latestActivity.almsLicenseId && (
                            <div className='flex items-center gap-1.5'>
                              <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                                Application Id:
                              </span>
                              <span className='px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold'>
                                {latestActivity.almsLicenseId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Time */}
                      <div className='text-right'>
                        <p className='text-xs' style={{ color: neutralText }}>
                          {getRelativeTime(latestActivity.timestamp || Date.now())}
                        </p>
                        <p className='text-xs mt-0.5' style={{ color: colors.text.tertiary }}>
                          {latestActivity.time}
                        </p>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className='ml-4'>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Activities */}
                {isExpanded && userActivities.length > 1 && (
                  <div
                    className='border-t'
                    style={{
                      borderColor: colors.border,
                      backgroundColor: withOpacity(colors.border, 0.08),
                    }}
                  >
                    {userActivities.slice(1).map((activity) => {
                      const activityStyle = getActionStyle(activity.action, palette, neutralText);
                      return (
                        <div
                          key={activity.id}
                          className='px-4 py-3 border-b last:border-b-0 transition-colors'
                          style={{
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                          }}
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className='w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0'
                              style={{ backgroundColor: activityStyle.iconBg }}
                            >
                              {activityStyle.icon}
                            </div>
                            <div className='flex-1'>
                            <p className={`text-sm font-medium ${activityStyle.textColor}`}>{activity.action}</p>
                              <div className='flex flex-wrap items-center gap-3 mt-1.5'>
                                {activity.applicantName && (
                                  <div className='flex items-center gap-1'>
                                    <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                                      Applicant Name:
                                    </span>
                                    <span className='text-xs text-gray-700 dark:text-gray-300'>
                                      {activity.applicantName}
                                    </span>
                                  </div>
                                )}
                                {activity.almsLicenseId && (
                                  <div className='flex items-center gap-1'>
                                    <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                                      Application Id:
                                    </span>
                                    <span className='px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold'>
                                      {activity.almsLicenseId}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className='text-right'>
                              <p className='text-xs' style={{ color: neutralText }}>
                                {getRelativeTime(activity.timestamp || Date.now())}
                              </p>
                              <p className='text-xs' style={{ color: colors.text.tertiary }}>
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Timeline View
        <div className='space-y-4 relative'>
          {/* Timeline line */}
          <div
            className='absolute left-5 top-0 bottom-0 w-0.5'
            style={{
              background: `linear-gradient(to bottom, ${palette.info}, ${palette.warning}, transparent)`,
            }}
          ></div>

          {activities.map((activity) => {
            const style = getActionStyle(activity.action, palette, neutralText);
            return (
              <div key={activity.id} className='flex gap-4 relative pl-12'>
                {/* Timeline dot */}
                <div
                  className='absolute left-0 w-10 h-10 rounded-full border-4 flex items-center justify-center text-white font-bold shadow-lg z-10'
                  style={{
                    backgroundColor: style.iconBg,
                    borderColor: colors.background,
                  }}
                >
                  {style.icon}
                </div>

                {/* Content Card */}
                <div
                  className='flex-1 rounded-lg p-4 border hover:shadow-lg transition-all hover:scale-[1.01]'
                  style={{
                    borderColor: style.borderColor,
                    backgroundColor: style.bgColor,
                  }}
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-medium text-gray-700 dark:text-gray-300'>
                          {activity.user}
                        </span>
                        <span className='text-xs text-gray-400 dark:text-gray-500'>
                          #{activity.id}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${style.textColor}`}>{activity.action}</p>
                      <div className='flex flex-wrap items-center gap-3 mt-2'>
                        {activity.applicantName && (
                          <div className='flex items-center gap-1.5'>
                            <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                              Applicant Name:
                            </span>
                            <span className='text-xs text-gray-700 dark:text-gray-300 font-medium'>
                              {activity.applicantName}
                            </span>
                          </div>
                        )}
                        {activity.almsLicenseId && (
                          <div className='flex items-center gap-1.5'>
                            <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>
                              Application Id:
                            </span>
                            <span className='px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold'>
                              {activity.almsLicenseId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='text-right ml-4'>
                      <p className='text-xs font-medium' style={{ color: neutralText }}>
                        {getRelativeTime(activity.timestamp || Date.now())}
                      </p>
                      <p className='text-xs mt-0.5' style={{ color: colors.text.tertiary }}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
