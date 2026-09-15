'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface ProcessingPerformanceProps {
  data: {
    avgDays: number;
    medianDays: number;
    slaPercent: number;
    delayedCount: number;
    totalProcessed: number;
  } | null;
  loading: boolean;
}

export default function ProcessingPerformanceSection({ data, loading }: ProcessingPerformanceProps) {
  const slaColor =
    !data ? 'text-gray-400' :
    data.slaPercent >= 80 ? 'text-emerald-600' :
    data.slaPercent >= 60 ? 'text-amber-600' : 'text-rose-600';

  const slaIcon =
    !data || data.slaPercent < 60
      ? <AlertTriangle className="w-4 h-4 text-rose-400" />
      : <CheckCircle2 className="w-4 h-4 text-emerald-400" />;

  const stats = [
    {
      label: 'Avg Processing',
      value: data ? `${data.avgDays}d` : '—',
      sub: 'Days to approval',
      color: 'text-[#0F2D52]',
      bg: 'bg-blue-50',
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
    },
    {
      label: 'Median Time',
      value: data ? `${data.medianDays}d` : '—',
      sub: 'Median days',
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
    },
    {
      label: 'Within SLA',
      value: data ? `${data.slaPercent}%` : '—',
      sub: '≤30 day target',
      color: slaColor,
      bg: data?.slaPercent && data.slaPercent >= 80 ? 'bg-emerald-50' : data?.slaPercent && data.slaPercent >= 60 ? 'bg-amber-50' : 'bg-rose-50',
      icon: slaIcon,
    },
    {
      label: 'Delayed',
      value: data ? data.delayedCount.toLocaleString() : '—',
      sub: 'Over 30 days',
      color: data?.delayedCount ? 'text-rose-600' : 'text-emerald-600',
      bg: data?.delayedCount ? 'bg-rose-50' : 'bg-emerald-50',
      icon: data?.delayedCount ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0F2D52]" />
            Processing Performance
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Based on {data?.totalProcessed?.toLocaleString() ?? '—'} processed applications
          </p>
        </div>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">30-day SLA</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Calculating performance...
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 flex flex-col gap-1`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{s.label}</span>
                {s.icon}
              </div>
              <div className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}</div>
              <div className="text-[10px] text-gray-500">{s.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
