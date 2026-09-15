'use client';

import React from 'react';
import { TrendingDown, Loader2 } from 'lucide-react';
import { ResponsiveContainer, FunnelChart, Funnel, Cell, Tooltip, LabelList } from 'recharts';

interface FunnelStage {
  stage: string;
  code: string;
  count: number;
  order: number;
}

interface ApplicationFunnelSectionProps {
  stages: FunnelStage[];
  loading: boolean;
}

const FUNNEL_COLORS = ['#1E3A8A', '#2563EB', '#0891B2', '#059669', '#D97706', '#10B981'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div className="bg-[#0F2D52] text-white px-3 py-2 rounded-lg text-xs shadow-xl">
        <div className="font-bold">{entry.stage}</div>
        <div className="text-blue-200 mt-0.5">{entry.count.toLocaleString()} applications</div>
        {entry.dropOff > 0 && (
          <div className="text-rose-300 mt-0.5">↓ {entry.dropOff}% drop from prev</div>
        )}
      </div>
    );
  }
  return null;
};

export default function ApplicationFunnelSection({ stages, loading }: ApplicationFunnelSectionProps) {
  // Sort by order and enrich with drop-off %
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const enriched = sorted.map((s, i) => {
    const prev = i > 0 ? sorted[i - 1].count : s.count;
    const dropOff = prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0;
    return { ...s, dropOff: Math.max(0, dropOff), value: s.count };
  });

  const maxCount = Math.max(...enriched.map((s) => s.count), 1);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#0F2D52]" />
            Application Funnel
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Stage-by-stage lifecycle progression</p>
        </div>
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">All Types</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Loading funnel...
        </div>
      ) : enriched.length === 0 || maxCount === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data available</div>
      ) : (
        <div className="mt-4 space-y-2">
          {enriched.map((stage, idx) => {
            const pct = maxCount > 0 ? Math.max(5, Math.round((stage.count / maxCount) * 100)) : 5;
            const color = FUNNEL_COLORS[idx % FUNNEL_COLORS.length];
            return (
              <div key={stage.code} className="flex items-center gap-3">
                {/* Stage label */}
                <div className="w-32 shrink-0 text-right">
                  <span className="text-xs font-semibold text-gray-700 leading-tight">{stage.stage}</span>
                </div>
                {/* Bar */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden relative">
                    <div
                      className="h-full rounded-full flex items-center px-3 transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    >
                      <span className="text-[10px] font-bold text-white truncate">
                        {stage.count > 0 ? stage.count.toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  {/* Count badge */}
                  <span className="text-xs font-black text-gray-800 w-12 text-right shrink-0">
                    {stage.count.toLocaleString()}
                  </span>
                  {/* Drop-off */}
                  {idx > 0 && stage.dropOff > 0 && (
                    <span className="text-[10px] text-rose-500 font-medium w-14 shrink-0">
                      ↓{stage.dropOff}%
                    </span>
                  )}
                  {idx > 0 && stage.dropOff === 0 && (
                    <span className="w-14 shrink-0" />
                  )}
                  {idx === 0 && <span className="w-14 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
