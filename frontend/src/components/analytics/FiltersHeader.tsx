import React from 'react';
import { AdminSpacing, AdminBorderRadius, AdminTransitions } from '@/styles/admin-design-system';

export const FiltersHeader: React.FC<{
  fromDate: string;
  toDate: string;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}> = ({ fromDate, toDate, setFromDate, setToDate, onReset, onRefresh, isLoading }) => {
  return (
    <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
      <div className='bg-[#001F54] text-white px-6 py-8'>
        <div className='text-white'>
          <h1 className='text-3xl font-bold mb-2'>Analytics Dashboard</h1>
          <p className='text-blue-100 text-lg'>Track applications and system performance</p>
        </div>
      </div>
      <div className='p-6 bg-white'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div className='flex flex-col sm:flex-row gap-3 flex-1'>
            <div className='relative flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>From Date</label>
              <input
                type='date'
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className='w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              />
            </div>
            <div className='relative flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>To Date</label>
              <input
                type='date'
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className='w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              />
            </div>
          </div>
          <div className='flex gap-2 items-end'>
            <button
              onClick={onReset}
              className='inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-300 transition-colors whitespace-nowrap'
            >
              Reset 30 Days
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className='inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap'
            >
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.581 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersHeader;
