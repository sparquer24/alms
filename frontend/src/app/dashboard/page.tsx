'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Building2,
  Users,
  Target,
  Trees,
  Check,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Download,
  Printer,
  X,
  Lock,
  ArrowRight,
  Radio,
  MousePointerClick,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { normalizeRole } from '@/utils/roleUtils';
import { getRoleBasedRedirectPath } from '@/config/roleRedirections';
import { useDispatch } from 'react-redux';
import { logoutUser } from '@/store/thunks/authThunks';
import { Sidebar } from '@/components/Sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LayoutProvider } from '@/config/layoutContext';
import {
  publicDashboardService,
  PublicDashboardData,
  SummaryKPIs,
} from '@/services/publicDashboardService';

// Color definitions matching the ALMS government palette
const COLORS = {
  navy: '#0F2D52',
  navyDark: '#0A1C33',
  navyLight: '#1E3A8A',
  gold: '#B8860B',
  goldLight: '#D4AF37',
  emerald: '#10B981',
  blue: '#3B82F6',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  rose: '#EF4444',
  slate: '#64748B',
};

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
const WEAPON_COLORS = ['#0F2D52', '#2563EB', '#0D9488', '#D97706', '#DC2626'];

export default function UniversalDashboard() {
  const { user, userRole, userName, token, isLoading: authLoading, initialized: authInitialized } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();

  const [mounted, setMounted] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [data, setData] = useState<PublicDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('all');
  const [appTypeFilter, setAppTypeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Search & Lookup State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);

  // Active Tab for Analytics View
  const [activeChartTab, setActiveChartTab] = useState<'trend' | 'family' | 'status'>('trend');

  const effectiveRole = useMemo(() => {
    return normalizeRole(userRole);
  }, [userRole]);

  // Helper to determine analytics path based on role
  const getAnalyticsPath = useCallback(() => {
    return effectiveRole === 'SUPER_ADMIN' ? '/superAdmin/analytics' : '/admin/analytics';
  }, [effectiveRole]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Role-based Access Control Guard (ADMIN & SUPER_ADMIN only) ──
  useEffect(() => {
    if (!authInitialized || authLoading) return;
    if (authChecked) return;

    if (!token) {
      router.replace('/login?redirect=/dashboard');
      return;
    }

    if (!effectiveRole) {
      router.replace('/login?error=no_role');
      return;
    }

    if (effectiveRole !== 'ADMIN' && effectiveRole !== 'SUPER_ADMIN') {
      const redirectPath = getRoleBasedRedirectPath(effectiveRole);
      router.replace(redirectPath);
      return;
    }

    setAuthChecked(true);
  }, [token, effectiveRole, authLoading, authInitialized, authChecked, router]);

  // Fetch dashboard data
  const fetchData = useCallback(async (range: string, type: string) => {
    try {
      const res = await publicDashboardService.getOverview(range, type);
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchData(timeRange, appTypeFilter);
    }
  }, [authChecked, timeRange, appTypeFilter, fetchData]);

  // Auto-refresh interval (every 30 seconds if enabled)
  useEffect(() => {
    if (!autoRefresh || !authChecked) return;
    const interval = setInterval(() => {
      fetchData(timeRange, appTypeFilter);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, authChecked, timeRange, appTypeFilter, fetchData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData(timeRange, appTypeFilter);
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await publicDashboardService.lookupApplicationStatus(searchQuery.trim());
      if (res) {
        setLookupResult(res);
      } else {
        setLookupError('No matching application found. Please verify the Application ID or Acknowledgement Number.');
      }
    } catch (err) {
      setLookupError('Unable to fetch status. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const trendDiff = useMemo(() => {
    if (!data?.trend || data.trend.length < 2) return null;
    const current = data.trend[data.trend.length - 1]?.total || 0;
    const previous = data.trend[data.trend.length - 2]?.total || 0;
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = (((current - previous) / previous) * 100).toFixed(1);
    return `${Number(pct) >= 0 ? '+' : ''}${pct}% vs last month`;
  }, [data?.trend]);

  // Show loading while checking authentication and role authorization
  if (authLoading || !authChecked || !authInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F2D52] mx-auto mb-4"></div>
          <p className="text-sm font-medium text-gray-600">Verifying Admin Authorization...</p>
        </div>
      </div>
    );
  }

  // Guard against unprivileged render while redirecting
  if (!token || !effectiveRole || (effectiveRole !== 'ADMIN' && effectiveRole !== 'SUPER_ADMIN')) {
    return null;
  }

  const summary = data?.summary;

  return (
    <LayoutProvider>
      <div className="flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white">
        {/* Standard ALMS Sidebar */}
        <Sidebar />

        {/* Official Top Header with User Profile, Notifications & Role */}
        <Header
          breadcrumbs={[
            { label: effectiveRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' },
            { label: 'Dashboard' },
          ]}
          pageTitle={effectiveRole === 'SUPER_ADMIN' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
        />

        {/* Main Content Area with Header spacing */}
        <main className="flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col pt-[64px] md:pt-[86px]">

          {/* Sticky Sub-header Navigation & Period Controls Bar */}
          <div className="sticky top-0 z-30 bg-[#0F2D52]/95 backdrop-blur-md text-white px-4 sm:px-6 lg:px-8 py-2.5 shadow-md border-b border-[#1E3A8A]/50 transition-all">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Breadcrumb / Title Info */}
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Link
                  href={effectiveRole === 'SUPER_ADMIN' ? '/superAdmin/userManagement' : '/admin/userManagement'}
                  className="hover:text-white transition-colors"
                >
                  {effectiveRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </Link>
                <span>/</span>
                <span className="text-[#D4AF37] font-medium">Executive Overview Dashboard</span>
                {mounted ? (
                  <span className="hidden sm:inline text-gray-400">• Updated: {lastUpdated.toLocaleTimeString()}</span>
                ) : (
                  <span className="hidden sm:inline text-gray-400">• Real-time System Feed</span>
                )}
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Application Family Filter */}
                <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10 text-xs">
                  <button
                    onClick={() => setAppTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      appTypeFilter === 'all'
                        ? 'bg-[#B8860B] text-white shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setAppTypeFilter('fresh')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      appTypeFilter === 'fresh'
                        ? 'bg-[#B8860B] text-white shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Fresh
                  </button>
                  <button
                    onClick={() => setAppTypeFilter('renewal')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      appTypeFilter === 'renewal'
                        ? 'bg-[#B8860B] text-white shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Renewal
                  </button>
                  <button
                    onClick={() => setAppTypeFilter('cancel')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      appTypeFilter === 'cancel'
                        ? 'bg-[#B8860B] text-white shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Cancellation
                  </button>
                </div>

                {/* Time Range Pills */}
                <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10 text-xs">
                  {[
                    { key: '7d', label: '7D' },
                    { key: '30d', label: '30D' },
                    { key: '90d', label: '90D' },
                    { key: '1y', label: '1Y' },
                    { key: 'all', label: 'All' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTimeRange(item.key)}
                      className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                        timeRange === item.key
                          ? 'bg-white text-[#0F2D52] shadow'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Live Auto-Refresh Toggle */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300">
                  <span className="relative flex h-2 w-2">
                    {autoRefresh && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        autoRefresh ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    ></span>
                  </span>
                  <span>Live Feed</span>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase transition-colors ${
                      autoRefresh
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-gray-600/30 text-gray-400'
                    }`}
                  >
                    {autoRefresh ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Manual Refresh Button */}
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  title="Refresh Overview Data"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors border border-white/10 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                {/* Print / Export */}
                <button
                  onClick={handlePrint}
                  title="Print Dashboard Report"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white text-xs flex items-center gap-1 transition-colors border border-white/10"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* Quick Status Lookup Trigger */}
                <button
                  onClick={() => setShowLookupModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8860B] hover:bg-[#A0750A] text-xs font-semibold text-white shadow-xs transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lookup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content Area */}
          <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0F2D52]" />
                Core Application &amp; Licensing Metrics
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Key performance indicators across all licensing lifecycles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Total Applications */}
            <Link href="/inbox?type=all" className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-[#0F2D52]/30 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Applications
                  </span>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-[#0F2D52] group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
                  {summary ? summary.totalApplications.toLocaleString() : '...'}
                </div>
                <div className="mt-1 flex items-center text-xs text-emerald-600 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>{trendDiff || 'Live Database Inflow'}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
                <span>Fresh: <strong>{summary?.freshApplications.toLocaleString()}</strong></span>
                <span>Renewal: <strong>{summary?.renewalApplications.toLocaleString()}</strong></span>
                <MousePointerClick className="w-3 h-3 text-gray-300 group-hover:text-[#0F2D52] transition-colors" />
              </div>
            </Link>

            {/* Card 2: Active Arms Licenses */}
            <Link href="/licenses?tab=all&status=ACTIVE" className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-emerald-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Active Licenses
                  </span>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
                  {summary ? summary.activeLicenses.toLocaleString() : '...'}
                </div>
                <div className="mt-1 text-xs text-gray-500 font-medium">
                  Across all jurisdictional districts
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-emerald-700 font-medium flex justify-between items-center">
                <span>Total Registered:</span>
                <strong>{summary?.totalLicenses.toLocaleString()}</strong>
                <MousePointerClick className="w-3 h-3 text-gray-300 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Link>

            {/* Card 3: Approved & Issued */}
            <Link href="/inbox?type=approved" className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-blue-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Approval Rate
                  </span>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
                  {summary ? `${summary.approvalRate}%` : '...'}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {summary ? `${summary.approvedApplications.toLocaleString()} approved` : ''}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
                <span>Disallowed:</span>
                <strong className="text-rose-600">{summary?.rejectedApplications.toLocaleString()}</strong>
                <MousePointerClick className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>

            {/* Card 4: In-Review / Pending */}
            <Link href="/inbox?type=pending" className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-amber-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    In Verification
                  </span>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
                  {summary ? summary.pendingApplications.toLocaleString() : '...'}
                </div>
                <div className="mt-1 text-xs text-amber-700 font-medium">
                  Under multi-level review
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
                <span>Under Review:</span>
                <strong className="text-amber-700">{summary?.pendingApplications || 0} In Progress</strong>
                <MousePointerClick className="w-3 h-3 text-gray-300 group-hover:text-amber-600 transition-colors" />
              </div>
            </Link>

            {/* Card 5: Turnaround Time */}
            <Link href={getAnalyticsPath()} className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-purple-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Avg Turnaround
                  </span>
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
                  {summary ? `${summary.avgProcessingDays} Days` : '...'}
                </div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">
                  {summary?.approvedApplications ? `Based on ${summary.approvedApplications} approved` : 'Live Application SLA'}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
                <span>Disposal Rate:</span>
                <strong className="text-purple-700">{summary?.disposalRate}%</strong>
                <MousePointerClick className="w-3 h-3 text-gray-300 group-hover:text-purple-500 transition-colors" />
              </div>
            </Link>

            {/* Card 6: Biometric Compliance */}
            <Link href={getAnalyticsPath()} className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-[#B8860B]/40 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Biometric Sync
                  </span>
                  <div className="p-2 rounded-lg bg-[#B8860B]/10 text-[#B8860B] group-hover:bg-[#B8860B] group-hover:text-white transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
                  {summary ? `${summary.biometricComplianceRate}%` : '...'}
                </div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">
                  UIDAI Aadhaar biometric sync
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
                <span>Expiring &lt;30d:</span>
                <strong className="text-amber-600">{summary?.expiringWithin30Days}</strong>
                <MousePointerClick className="w-3 h-3 text-gray-300 group-hover:text-[#B8860B] transition-colors" />
              </div>
            </Link>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            4. INTERACTIVE CHARTS & VISUAL ANALYTICS SECTION
        ────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: Volume Inflow Trends (2 cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0F2D52]" />
                  Application Inflow &amp; Processing Trends
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monthly volume trajectories across Fresh, Renewal, and Cancellation requests
                </p>
              </div>

              {/* Chart Mode Switcher */}
              <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-medium">
                <button
                  onClick={() => setActiveChartTab('trend')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeChartTab === 'trend'
                      ? 'bg-[#0F2D52] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Trend Area
                </button>
                <button
                  onClick={() => setActiveChartTab('family')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeChartTab === 'family'
                      ? 'bg-[#0F2D52] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Type Comparison
                </button>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="mt-6 h-72 sm:h-80 w-full">
              {data?.trend && data.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'trend' ? (
                    <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F2D52" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0F2D52" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="period" stroke="#64748B" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F2D52',
                          borderColor: '#1E3A8A',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total Inflow"
                        stroke="#0F2D52"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name="Approved"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorApproved)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={data.trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="period" stroke="#64748B" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F2D52',
                          borderColor: '#1E3A8A',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="fresh" name="Fresh" fill="#0F2D52" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="renewal" name="Renewal" fill="#B8860B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cancel" name="Cancellation" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  Loading trend data...
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Status Lifecycle Distribution */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Status Distribution
                </h3>
                <span className="text-[11px] font-semibold text-gray-500 uppercase">Workflow</span>
              </div>

              {/* Donut Chart */}
              <div className="mt-4 h-44 w-full relative flex items-center justify-center">
                {data?.statusDistribution ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.statusDistribution as any}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {data.statusDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F2D52',
                          borderColor: '#1E3A8A',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-gray-900">
                    {summary?.approvalRate || '75.9'}%
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase font-medium">Approved</span>
                </div>
              </div>

              {/* Status Breakdown List */}
              <div className="mt-4 space-y-2">
                {data?.statusDistribution?.map((item, idx) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      ></span>
                      <span className="font-medium text-gray-700 truncate max-w-[180px]">
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold">{item.count.toLocaleString()}</span>
                      <span className="text-gray-400 text-[10px]">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 text-center">
              Multi-tiered verification under Rule 11 &amp; Arms Rules 2016
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. WEAPON CATEGORIES & PURPOSE DISTRIBUTION
        ────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weapon Categories */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0F2D52]" />
                Weapon Category Breakdown
              </h3>
              <span className="text-xs text-gray-500 font-medium">Authorized Calibers</span>
            </div>

            <div className="mt-5 space-y-4">
              {data?.weaponCategories?.map((cat, idx) => (
                <div key={cat.category}>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                      {cat.category}
                      {cat.permissible ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-normal">
                          Permissible
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-normal">
                          Restricted
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-gray-900">
                      {cat.count.toLocaleString()}{' '}
                      <span className="text-gray-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: WEAPON_COLORS[idx % WEAPON_COLORS.length],
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purpose Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#B8860B]" />
                Authorized Purpose Distribution
              </h3>
              <span className="text-xs text-gray-500 font-medium">Statutory Grounds</span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data?.purposeBreakdown?.map((item) => (
                <div
                  key={item.purpose}
                  className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white hover:border-[#0F2D52]/30 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 line-clamp-1">
                      {item.purpose}
                    </span>
                    <span className="text-xs font-bold text-[#0F2D52] bg-[#0F2D52]/10 px-2 py-0.5 rounded-full">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="mt-3 text-xl font-extrabold text-gray-900">
                    {item.count.toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">Verified holders</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            6. ZONAL & JURISDICTIONAL WORKLOAD DISTRIBUTION
        ────────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F2D52]" />
                Jurisdictional Zonal &amp; District Load Analysis
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Workload and licensing volume distributed across police administrative zones
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0F2D52] bg-blue-50 px-3 py-1 rounded-full self-start sm:self-auto">
              {data?.zoneLoads?.length || 0} Administrative Zones Active
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Administrative Zone</th>
                  <th className="py-3 px-4">Divisions Covered</th>
                  <th className="py-3 px-4">Application Volume</th>
                  <th className="py-3 px-4">Active Licenses</th>
                  <th className="py-3 px-4">Biometric Compliance</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.zoneLoads?.map((zone) => (
                  <tr key={zone.zoneId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#0F2D52]"></div>
                      {zone.zoneName}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {zone.divisionsCount} Police Divisions
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {zone.applicationsCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0F2D52]">
                      {zone.activeLicenses.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${zone.complianceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-700 font-medium">{zone.complianceRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Operational
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            7. LIVE PUBLIC ACTIVITY FEED & SYSTEM HEALTH
        ────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Live System Milestones &amp; Public Activity
              </h3>
              <span className="text-xs text-gray-500">Sanitized Real-Time Log</span>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {data?.recentActivities?.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-blue-700">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{act.title}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5 flex flex-wrap gap-2">
                        <span>Ref: <strong className="font-mono text-gray-700">{act.reference}</strong></span>
                        <span>•</span>
                        <span>{act.location}</span>
                        <span>•</span>
                        <span className="text-[#B8860B] font-medium">{act.category}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {mounted
                      ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Services Health */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  Service Health &amp; SLAs
                </h3>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Online
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {data?.systemServices?.map((svc) => (
                  <div
                    key={svc.name}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{svc.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Latency: <span className="font-mono text-gray-700">{svc.latency}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {svc.status}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-0.5">{svc.uptime} uptime</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <Link
                href={effectiveRole === 'SUPER_ADMIN' ? '/superAdmin/analytics' : '/admin/analytics'}
                className="text-xs font-semibold text-[#0F2D52] hover:text-[#B8860B] transition-colors flex items-center justify-center gap-1"
              >
                <span>View System Diagnostics &amp; Audit Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            8. ADMINISTRATIVE QUICK ACTIONS & MANAGEMENT CONSOLE
        ────────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F2D52]" />
                Administrative Quick Actions &amp; Management Console
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Direct statutory controls and configurations for authorized {effectiveRole === 'SUPER_ADMIN' ? 'Super Administrators' : 'Administrators'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Action 1: User & Hierarchy Management */}
            <div className="p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-blue-50/40 to-white hover:border-[#0F2D52]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#0F2D52] text-white flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">User &amp; Hierarchy Management</h4>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Manage officer accounts, role assignments, zonal jurisdiction mapping, and permission access across all police divisions.
                </p>
              </div>
              <Link
                href={effectiveRole === 'SUPER_ADMIN' ? '/superAdmin/userManagement' : '/admin/userManagement'}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0F2D52] hover:text-[#B8860B] transition-colors"
              >
                <span>Open User Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Action 2: Workflow Configuration */}
            <div className="p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-amber-50/40 to-white hover:border-[#B8860B]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#B8860B] text-white flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Workflow &amp; Stage Mapping</h4>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Configure multi-level approval hierarchies, statutory enquiry workflows, and action transition rules for licensing applications.
                </p>
              </div>
              <Link
                href={effectiveRole === 'SUPER_ADMIN' ? '/superAdmin/flowMapping' : '/admin/workflows'}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#B8860B] hover:text-[#A0750A] transition-colors"
              >
                <span>Configure Workflows</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Action 3: Analytics & Detailed Reports */}
            <div className="p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50/40 to-white hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Advanced Analytics &amp; Reports</h4>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Generate comprehensive audit reports, SLA compliance matrices, and jurisdictional workload exports across all districts.
                </p>
              </div>
              <Link
                href={effectiveRole === 'SUPER_ADMIN' ? '/superAdmin/analytics' : '/admin/analytics'}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
              >
                <span>View Analytics Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Standard Portal Footer */}
      <Footer />
    </main>
  </div>

      {/* Application Lookup Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#0F2D52] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Search className="w-5 h-5 text-[#B8860B]" />
                <h3 className="font-bold text-base">Track Application Status</h3>
              </div>
              <button
                onClick={() => {
                  setShowLookupModal(false);
                  setLookupResult(null);
                  setLookupError(null);
                }}
                className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <form onSubmit={handleLookupSubmit} className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acknowledgement No. / ALMS Ref ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. ALMS-2024-001429 or 104"
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0F2D52] focus:border-transparent outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={lookupLoading || !searchQuery.trim()}
                    className="absolute right-2 top-2 p-1.5 rounded-lg bg-[#0F2D52] text-white hover:bg-[#1A365D] disabled:opacity-50 transition-colors"
                  >
                    {lookupLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Search by official acknowledgement number, temporary reference, or application ID.
                </p>
              </form>

              {lookupError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}

              {lookupResult && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-900">{lookupResult.acknowledgementNo || `ID #${lookupResult.applicationId}`}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        lookupResult.isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : lookupResult.isRejected
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lookupResult.applicationStatus || 'In Process'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Applicant</span>
                      <span className="font-medium text-gray-800">{lookupResult.applicantName || 'Confidential'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">District</span>
                      <span className="font-medium text-gray-800">{lookupResult.permanentAddress?.district || 'Registered District'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Submission Date</span>
                      <span className="font-medium text-gray-800">
                        {lookupResult.createdAt ? new Date(lookupResult.createdAt).toLocaleDateString() : 'Recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Police Station</span>
                      <span className="font-medium text-gray-800">{lookupResult.permanentAddress?.policeStation || 'Jurisdictional PS'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowLookupModal(false);
                  setLookupResult(null);
                  setLookupError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutProvider>
  );
}
