'use client';

import React from 'react';
import { AlertTriangle, ChevronRight, Bell, Clock, Award, FileText, Shield, Loader2 } from 'lucide-react';

interface ActionItem {
  key: string;
  label: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
}

interface ActionRequiredSectionProps {
  items: ActionItem[];
  loading: boolean;
  onItemClick?: (key: string, label: string) => void;
}

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-700',
    icon: 'text-rose-500',
  },
  warning: {
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-700',
    icon: 'text-amber-500',
  },
  info: {
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    badge: 'bg-blue-600 text-white',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
};

const KEY_ICONS: Record<string, React.ReactNode> = {
  under_verification: <Clock className="w-4 h-4" />,
  pending_over_15: <AlertTriangle className="w-4 h-4" />,
  expiring_licenses: <Award className="w-4 h-4" />,
  awaiting_action: <FileText className="w-4 h-4" />,
  biometric_pending: <Shield className="w-4 h-4" />,
};

export default function ActionRequiredSection({ items, loading, onItemClick }: ActionRequiredSectionProps) {
  const totalActions = items.reduce((s, i) => s + i.count, 0);
  const criticalCount = items.filter((i) => i.severity === 'critical' && i.count > 0).length;

  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 flex items-center justify-between ${criticalCount > 0 ? 'bg-rose-600' : 'bg-[#0F2D52]'}`}>
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            {totalActions > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </div>
          <Bell className="w-4 h-4 text-white/80" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Action Required</h3>
        </div>
        <span className="text-xs text-white/70 font-medium">
          {totalActions > 0 ? `${totalActions} items need attention` : 'All clear'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-28 gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Loading action items...
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">No action items found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {items.map((item) => {
            const cfg = SEVERITY_CONFIG[item.severity];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onItemClick?.(item.key, item.label)}
                disabled={item.count === 0}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-5 transition-all group text-center ${
                  item.count === 0 ? 'bg-gray-50 opacity-50 cursor-default' : `${cfg.bg} cursor-pointer`
                }`}
              >
                <span className={`${item.count === 0 ? 'text-gray-300' : cfg.icon}`}>
                  {KEY_ICONS[item.key] ?? <Bell className="w-4 h-4" />}
                </span>
                <span className={`text-2xl font-black ${item.count === 0 ? 'text-gray-300' : cfg.badge.includes('rose') ? 'text-rose-600' : cfg.badge.includes('amber') ? 'text-amber-600' : 'text-blue-600'}`}>
                  {item.count}
                </span>
                <span className="text-[11px] font-medium text-gray-600 leading-tight text-center">{item.label}</span>
                {item.count > 0 && (
                  <ChevronRight className={`w-3 h-3 ${cfg.icon} opacity-0 group-hover:opacity-100 transition-all`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
