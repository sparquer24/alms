'use client';

import React, { useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  FileText,
  Award,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';
import ApplicationsDetailTable from './ApplicationsDetailTable';
import LicensesDetailTable from './LicensesDetailTable';
import TurnaroundSlaTable from './TurnaroundSlaTable';
import BiometricComplianceTable from './BiometricComplianceTable';

export type CardCategoryType = 'applications' | 'licenses' | 'turnaround' | 'biometrics';

export interface CardModalConfig {
  isOpen: boolean;
  category: CardCategoryType;
  title: string;
  subtitle?: string;
  badge?: string;
  initialType?: string; // for applications: 'all' | 'fresh' | 'renewal' | 'cancel'
  initialStatus?: string; // 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'ACTIVE' | 'EXPIRED'
  expiringDays?: number;
}

interface DashboardCardDetailModalProps {
  config: CardModalConfig;
  onClose: () => void;
  onChangeCategory?: (category: CardCategoryType) => void;
}

export const DashboardCardDetailModal: React.FC<DashboardCardDetailModalProps> = ({
  config,
  onClose,
  onChangeCategory,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [activeCategory, setActiveCategory] = React.useState<CardCategoryType>(config.category);

  useEffect(() => {
    setActiveCategory(config.category);
  }, [config.category]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && config.isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.isOpen, onClose]);

  if (!config.isOpen) return null;

  const handleTabClick = (cat: CardCategoryType) => {
    setActiveCategory(cat);
    if (onChangeCategory) onChangeCategory(cat);
  };

  const getCategoryIcon = () => {
    switch (activeCategory) {
      case 'applications':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'licenses':
        return <Award className="w-5 h-5 text-[#B8860B]" />;
      case 'turnaround':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'biometrics':
        return <Shield className="w-5 h-5 text-emerald-600" />;
      default:
        return <Layers className="w-5 h-5 text-[#0F2D52]" />;
    }
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'applications':
        return 'Applications Master Directory';
      case 'licenses':
        return 'Arms Licenses Registry & Validity';
      case 'turnaround':
        return 'Turnaround SLA & Processing Durations';
      case 'biometrics':
        return 'Biometric Verification & Compliance';
      default:
        return config.title;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Drawer Container */}
      <div
        className={`relative z-10 bg-[#F4F6F9] h-full flex flex-col shadow-2xl transition-all duration-300 ${
          isFullscreen ? 'w-full' : 'w-full max-w-6xl'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-[#0F2D52] text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-white backdrop-blur-xs">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  {getCategoryTitle()}
                </h3>
                {config.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#B8860B] text-white">
                    {config.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {config.subtitle || 'Filtered live records according to selected dashboard metric card'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close Panel (Esc)"
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {[
              { key: 'applications', label: 'All Applications', icon: FileText },
              { key: 'licenses', label: 'Licenses Registry', icon: Award },
              { key: 'turnaround', label: 'SLA & Turnaround', icon: TrendingUp },
              { key: 'biometrics', label: 'Biometrics & Aadhaar', icon: Shield },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabClick(tab.key as CardCategoryType)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#0F2D52] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <span className="hidden md:inline text-[11px] text-gray-400 font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono text-[10px]">Esc</kbd> to exit
          </span>
        </div>

        {/* Drawer Body with Selected Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeCategory === 'applications' && (
            <ApplicationsDetailTable
              initialType={config.initialType || 'all'}
              initialStatus={config.initialStatus || 'ALL'}
              embedded={false}
            />
          )}

          {activeCategory === 'licenses' && (
            <LicensesDetailTable
              initialStatus={config.initialStatus || 'ALL'}
              initialExpiringDays={config.expiringDays}
              embedded={false}
            />
          )}

          {activeCategory === 'turnaround' && (
            <TurnaroundSlaTable embedded={false} />
          )}

          {activeCategory === 'biometrics' && (
            <BiometricComplianceTable embedded={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCardDetailModal;
