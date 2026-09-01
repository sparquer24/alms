'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PageSubHeader, SubHeaderButton } from '@/components/common/PageSubHeader';

export const FiltersHeader: React.FC<{
  fromDate: string;
  toDate: string;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}> = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  onReset,
  onRefresh,
  isLoading,
  title = 'Global Analytics Overview',
}) => {
  return (
    <PageSubHeader
      title={title}
      metaBadge="Rolling 30-day analytics window"
      actions={
        <>
          {/* From Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-300">
            <span className="hidden sm:inline text-[11px] text-gray-400">From:</span>
            <input
              type="date"
              aria-label="Analytics From Date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/10 text-white text-xs shadow-xs focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-all cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-300">
            <span className="hidden sm:inline text-[11px] text-gray-400">To:</span>
            <input
              type="date"
              aria-label="Analytics To Date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/10 text-white text-xs shadow-xs focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-all cursor-pointer"
            />
          </div>

          {/* Reset 30 Days Button */}
          <SubHeaderButton
            onClick={onReset}
            title="Reset to past 30 days"
          >
            Reset 30D
          </SubHeaderButton>

          {/* Refresh Button (Gold Primary) */}
          <SubHeaderButton
            variant="primary"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh analytics data"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </SubHeaderButton>
        </>
      }
    />
  );
};

export default FiltersHeader;
