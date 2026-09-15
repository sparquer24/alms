'use client';

import React from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number;
  count: number;
}

interface AgingAnalysisSectionProps {
  buckets: AgingBucket[];
  loading: boolean;
}

const BUCKET_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#7C3AED'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F2D52] text-white px-3 py-2 rounded-lg text-xs shadow-xl">
        <div className="font-bold">{label}</div>
        <div className="text-blue-200 mt-0.5">{payload[0].value.toLocaleString()} pending applications</div>
      </div>
    );
  }
  return null;
};

export default function AgingAnalysisSection({ buckets, loading }: AgingAnalysisSectionProps) {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const critical = buckets.filter((b) => b.minDays >= 16).reduce((s, b) => s + b.count, 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Application Aging
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Pending applications by waiting time</p>
        </div>
        {critical > 0 && (
          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
            {critical} overdue
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-44 gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Loading aging data...
        </div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center h-44 text-gray-400 text-sm">
          No pending applications
        </div>
      ) : (
        <>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {buckets.map((_, idx) => (
                    <Cell key={idx} fill={BUCKET_COLORS[idx % BUCKET_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            {buckets.map((b, idx) => (
              <div key={b.label} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: BUCKET_COLORS[idx % BUCKET_COLORS.length] }} />
                <span>{b.label}: <strong>{b.count}</strong></span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
