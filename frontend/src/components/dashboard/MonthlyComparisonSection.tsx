'use client';

import React from 'react';
import { BarChart2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface MonthlyComparisonData {
  thisMonth: { submitted: number; approved: number; rejected: number };
  lastMonth: { submitted: number; approved: number; rejected: number };
}

interface MonthlyComparisonSectionProps {
  data: MonthlyComparisonData | null;
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F2D52] text-white px-3 py-2.5 rounded-lg text-xs shadow-xl">
        <div className="font-bold mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
            <span className="text-gray-300">{p.name}:</span>
            <span className="font-bold">{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function DeltaChip({ label, thisVal, lastVal }: { label: string; thisVal: number; lastVal: number }) {
  const delta = thisVal - lastVal;
  const pct = lastVal > 0 ? Math.round((delta / lastVal) * 100) : 0;
  const up = delta >= 0;
  return (
    <div className="text-center">
      <div className="text-[10px] text-gray-400 uppercase font-semibold">{label}</div>
      <div className="text-base font-black text-gray-900 mt-0.5">{thisVal.toLocaleString()}</div>
      <div className={`text-[10px] font-medium flex items-center justify-center gap-0.5 ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
        {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {up ? '+' : ''}{pct}% vs last month
      </div>
    </div>
  );
}

export default function MonthlyComparisonSection({ data, loading }: MonthlyComparisonSectionProps) {
  const now = new Date();
  const thisMonthLabel = now.toLocaleString('default', { month: 'long' });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthLabel = lastMonthDate.toLocaleString('default', { month: 'long' });

  const chartData = [
    {
      metric: 'Submitted',
      'This Month': data?.thisMonth.submitted ?? 0,
      'Last Month': data?.lastMonth.submitted ?? 0,
    },
    {
      metric: 'Approved',
      'This Month': data?.thisMonth.approved ?? 0,
      'Last Month': data?.lastMonth.approved ?? 0,
    },
    {
      metric: 'Rejected',
      'This Month': data?.thisMonth.rejected ?? 0,
      'Last Month': data?.lastMonth.rejected ?? 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#0F2D52]" />
            Monthly Comparison
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{thisMonthLabel} vs {lastMonthLabel}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#0F2D52]" />This month</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />Last month</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-52 gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Loading comparison...
        </div>
      ) : (
        <>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="metric" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="This Month" fill="#0F2D52" radius={[3, 3, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Last Month" fill="#D1D5DB" radius={[3, 3, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Delta chips */}
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
            <DeltaChip label="Submitted" thisVal={data?.thisMonth.submitted ?? 0} lastVal={data?.lastMonth.submitted ?? 0} />
            <DeltaChip label="Approved" thisVal={data?.thisMonth.approved ?? 0} lastVal={data?.lastMonth.approved ?? 0} />
            <DeltaChip label="Rejected" thisVal={data?.thisMonth.rejected ?? 0} lastVal={data?.lastMonth.rejected ?? 0} />
          </div>
        </>
      )}
    </div>
  );
}
