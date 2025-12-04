import React from 'react';
import { AdminActivity } from '@/services/analyticsService';

interface AdminActivityFeedProps {
  activities: AdminActivity[];
  isLoading?: boolean;
  error?: string;
}

export function AdminActivityFeed({ activities, isLoading, error }: AdminActivityFeedProps) {
  if (error) {
    return (
      <div className='text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded'>
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className='h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse'
          />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className='text-center py-12'>
        <svg
          className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
          />
        </svg>
        <p className='text-gray-500 dark:text-gray-400'>No activities yet</p>
      </div>
    );
  }

  return (
    <div className='space-y-6 relative'>
      {/* Timeline line */}
      <div className='absolute left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-transparent dark:from-blue-500'></div>

      {activities.map((activity, idx) => {
        const timestamp = activity.timestamp
          ? new Date(activity.timestamp)
          : new Date(activity.time);
        const formattedTime = timestamp.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={activity.id} className='flex gap-4 relative pl-8'>
            {/* Timeline dot */}
            <div className='absolute left-0 w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center'>
              <div className='w-2 h-2 bg-white rounded-full' />
            </div>

            {/* Content */}
            <div className='flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow'>
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>{activity.user}</p>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>{activity.action}</p>
                </div>
                <span className='text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-2'>
                  {formattedTime}
                </span>
              </div>
              <div className='mt-2 pt-2 border-t border-gray-200 dark:border-gray-600'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>Activity #{activity.id}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
