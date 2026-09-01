'use client';

import React from 'react';
import {
  Layers,
  FileText,
  Award,
  TrendingUp,
  Shield,
  Clock,
  Maximize2,
} from 'lucide-react';
import ApplicationsDetailTable from './ApplicationsDetailTable';
import LicensesDetailTable from './LicensesDetailTable';
import TurnaroundSlaTable from './TurnaroundSlaTable';
import BiometricComplianceTable from './BiometricComplianceTable';
import { SummaryKPIs } from '@/services/publicDashboardService';

export type DrillDownTab =
  | 'applications_all'
  | 'applications_fresh'
  | 'applications_renewal'
  | 'applications_cancel'
  | 'licenses_active'
  | 'licenses_all'
  | 'licenses_expiring'
  | 'turnaround'
  | 'biometrics';

interface DashboardDrillDownSectionProps {
  activeTab: DrillDownTab;
  onTabChange: (tab: DrillDownTab) => void;
  summary?: SummaryKPIs;
  onOpenDrawer?: () => void;
}

export const DashboardDrillDownSection: React.FC<DashboardDrillDownSectionProps> = ({
  activeTab,
  onTabChange,
  summary,
  onOpenDrawer,
}) => {
  const getTabConfig = () => {
    switch (activeTab) {
      case 'applications_all':
        return {
          title: 'All Applications Master Registry',
          subtitle: 'Comprehensive record of all Fresh, Renewal, and Cancellation requests across your jurisdiction',
        };
      case 'applications_fresh':
        return {
          title: 'Fresh License Applications',
          subtitle: 'New arms license requests undergoing initial background, police and district verification',
        };
      case 'applications_renewal':
        return {
          title: 'License Renewal Applications',
          subtitle: 'Periodic license renewal submissions under validation',
        };
      case 'applications_cancel':
        return {
          title: 'License Cancellation Requests',
          subtitle: 'Formal license cancellation proceedings and surrender requests',
        };
      case 'licenses_active':
        return {
          title: 'Active & Valid Arms Licenses Registry',
          subtitle: 'Fully issued and operational arms licenses across administrative zones',
        };
      case 'licenses_all':
        return {
          title: 'Total Registered Licenses Repository',
          subtitle: 'Historical registry including active, expired, suspended, and revoked licenses',
        };
      case 'licenses_expiring':
        return {
          title: 'Licenses Approaching Expiry (<90 Days)',
          subtitle: 'Upcoming renewal deadlines requiring holder notice and administrative review',
        };
      case 'turnaround':
        return {
          title: 'Application Turnaround Durations & SLA Benchmarks',
          subtitle: 'Evaluation of processing speed, disposal rates, and service-level agreements',
        };
      case 'biometrics':
        return {
          title: 'UIDAI Aadhaar Biometric Compliance Registry',
          subtitle: 'Fingerprint and facial biometric enrollment audit log under MHA Rule 11',
        };
      default:
        return {
          title: 'Detailed Records View',
          subtitle: 'Real-time database queries matching selected dashboard metrics',
        };
    }
  };

  const tabInfo = getTabConfig();

  return (
    <section id="dashboard-drilldown-section" className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-sm scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0F2D52]" />
              {tabInfo.title}
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#0F2D52]/10 text-[#0F2D52]">
              Live Records Table
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{tabInfo.subtitle}</p>
        </div>

        {/* Action Button to Open Full Screen Drawer */}
        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-[#0F2D52] hover:text-white transition-all shadow-xs self-start lg:self-auto"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open in Fullscreen Drawer</span>
          </button>
        )}
      </div>

      {/* Interactive Tabs Row */}
      <div className="flex items-center gap-2 py-3 overflow-x-auto border-b border-gray-100 text-xs font-semibold scrollbar-none">
        {[
          { key: 'applications_all', label: 'All Applications', count: summary?.totalApplications, icon: FileText },
          { key: 'applications_fresh', label: 'Fresh', count: summary?.freshApplications, icon: FileText },
          { key: 'applications_renewal', label: 'Renewal', count: summary?.renewalApplications, icon: FileText },
          { key: 'applications_cancel', label: 'Cancellation', count: summary?.cancelApplications, icon: FileText },
          { key: 'licenses_active', label: 'Active Licenses', count: summary?.activeLicenses, icon: Award },
          { key: 'licenses_expiring', label: 'Expiring Soon', count: summary?.expiringWithin90Days, icon: Clock },
          { key: 'licenses_all', label: 'All Licenses', count: summary?.totalLicenses, icon: Award },
          { key: 'turnaround', label: 'SLA & Turnaround', count: `${summary?.avgProcessingDays ?? 0}d avg`, icon: TrendingUp },
          { key: 'biometrics', label: 'Biometrics', count: `${summary?.biometricComplianceRate ?? 0}%`, icon: Shield },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key as DrillDownTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0F2D52] text-white shadow-xs'
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/60'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Table Canvas */}
      <div className="mt-4">
        {activeTab === 'applications_all' && (
          <ApplicationsDetailTable initialType="all" initialStatus="ALL" embedded={true} />
        )}
        {activeTab === 'applications_fresh' && (
          <ApplicationsDetailTable initialType="fresh" initialStatus="ALL" embedded={true} />
        )}
        {activeTab === 'applications_renewal' && (
          <ApplicationsDetailTable initialType="renewal" initialStatus="ALL" embedded={true} />
        )}
        {activeTab === 'applications_cancel' && (
          <ApplicationsDetailTable initialType="cancel" initialStatus="ALL" embedded={true} />
        )}
        {activeTab === 'licenses_active' && (
          <LicensesDetailTable initialStatus="ACTIVE" embedded={true} />
        )}
        {activeTab === 'licenses_all' && (
          <LicensesDetailTable initialStatus="ALL" embedded={true} />
        )}
        {activeTab === 'licenses_expiring' && (
          <LicensesDetailTable initialStatus="ACTIVE" initialExpiringDays={90} embedded={true} />
        )}
        {activeTab === 'turnaround' && (
          <TurnaroundSlaTable embedded={true} />
        )}
        {activeTab === 'biometrics' && (
          <BiometricComplianceTable embedded={true} />
        )}
      </div>
    </section>
  );
};

export default DashboardDrillDownSection;
