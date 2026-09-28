'use client';

import React from 'react';
import { Award, AlertTriangle, Loader2 } from 'lucide-react';

interface ExpiryBucket {
  label: string;
  days: number;
  count: number;
}

interface LicenseExpiryBucketsSectionProps {
  buckets: ExpiryBucket[];
  loading: boolean;
  onBucketClick?: (days: number, label: string) => void;
}

const BUCKET_CONFIG = [
  { days: 30, color: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', hover: 'hover:bg-amber-100' },
  { days: 60, color: 'bg-orange-400', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', hover: 'hover:bg-orange-100' },
  { days: 90, color: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', hover: 'hover:bg-blue-100' },
  { days: 0, color: 'bg-rose-600', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', hover: 'hover:bg-rose-100' },
];

export default function LicenseExpiryBucketsSection({ buckets, loading, onBucketClick }: LicenseExpiryBucketsSectionProps) {
  const totalAtRisk = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            License Expiry
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Expiry timeline &amp; revoked licenses</p>
        </div>
        {totalAtRisk > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {totalAtRisk.toLocaleString()} at risk
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Loading expiry data...
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {buckets.map((bucket, idx) => {
            const cfg = BUCKET_CONFIG[idx] ?? BUCKET_CONFIG[3];
            return (
              <button
                key={bucket.label}
                type="button"
                onClick={() => onBucketClick?.(bucket.days, bucket.label)}
                disabled={bucket.count === 0}
                className={`${cfg.bg} border rounded-xl p-3 text-left transition-all group ${
                  bucket.count > 0 ? `${cfg.hover} cursor-pointer` : 'opacity-50 cursor-default'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                  {bucket.days > 0 ? (
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{bucket.days}d</span>
                  ) : (
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">N/A</span>
                  )}
                </div>
                <div className={`text-2xl font-black ${cfg.text} tracking-tight`}>
                  {bucket.count.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5 leading-tight">{bucket.label}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
