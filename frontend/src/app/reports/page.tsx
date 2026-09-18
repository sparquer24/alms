"use client";

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Undo2,
  Flag,
  Archive,
  TrendingUp,
  CalendarDays,
  CalendarClock,
  Download,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { PageSubHeader } from '@/components/common/PageSubHeader';
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from '../../config/layoutContext';
import { ApplicationApi } from '../../config/APIClient';
import { PageLayoutSkeleton } from '../../components/Skeleton';

type StatusBucket = 'pending' | 'approved' | 'rejected' | 'returned' | 'flagged' | 'disposed';

const STATUS_META: Record<StatusBucket, { label: string; bar: string; chipBg: string; chipText: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', bar: 'bg-amber-500', chipBg: 'bg-amber-50', chipText: 'text-amber-700', icon: <Clock className="w-4 h-4" /> },
  approved: { label: 'Approved', bar: 'bg-emerald-500', chipBg: 'bg-emerald-50', chipText: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  rejected: { label: 'Rejected', bar: 'bg-rose-500', chipBg: 'bg-rose-50', chipText: 'text-rose-700', icon: <XCircle className="w-4 h-4" /> },
  returned: { label: 'Returned', bar: 'bg-orange-500', chipBg: 'bg-orange-50', chipText: 'text-orange-700', icon: <Undo2 className="w-4 h-4" /> },
  flagged: { label: 'Red Flagged', bar: 'bg-red-600', chipBg: 'bg-red-50', chipText: 'text-red-700', icon: <Flag className="w-4 h-4" /> },
  disposed: { label: 'Disposed', bar: 'bg-gray-500', chipBg: 'bg-gray-100', chipText: 'text-gray-700', icon: <Archive className="w-4 h-4" /> },
};

/** Resolve a human-readable status name from whatever shape the backend sends
 * (plain string, or a workflowStatus/status object with name/code). */
function extractStatusName(app: any): string {
  const wf = app?.workflowStatus;
  if (wf?.name) return String(wf.name);
  if (wf?.code) return String(wf.code);
  const st = app?.status;
  if (st) {
    if (typeof st === 'string') return st;
    if (typeof st === 'object') return String(st.name || st.code || '');
  }
  return '';
}

/** Collapse the many raw workflow status names into the 6 buckets this report shows. */
function bucketStatus(rawName: string): StatusBucket {
  const n = rawName.toLowerCase().replace(/[-\s_]+/g, '');
  if (n.includes('approved') || n === 'approve') return 'approved';
  if (n.includes('rejected') || n === 'reject') return 'rejected';
  if (n.includes('returned') || n === 'return') return 'returned';
  if (n.includes('redflag') || n.includes('flag')) return 'flagged';
  if (n.includes('closed') || n.includes('disposed')) return 'disposed';
  // forwarded, submitted, sent, initiated, draft, re-enquiry, pending, in-progress, etc.
  return 'pending';
}

function getApplicationType(app: any): 'fresh' | 'renewal' | 'cancel' {
  const t = String(app?.applicationType || '');
  if (/cancel/i.test(t)) return 'cancel';
  if (/renewal/i.test(t)) return 'renewal';
  return 'fresh';
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { setShowHeader, setShowSidebar, headerHeight } = useLayout();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    setShowHeader(true);
    setShowSidebar(true);
    return () => {
      setShowHeader(true);
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

  // The backend already scopes /application-form to the signed-in user's role
  // and jurisdiction, so no extra client-side "is this mine" filtering is needed.
  const applicationsQuery = useQuery({
    queryKey: ['reports', 'myApplications'],
    queryFn: async () => {
      const res: any = await ApplicationApi.getAll();
      if (res && typeof res === 'object') {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.body)) return res.body;
        if (Array.isArray(res)) return res;
      }
      return [] as any[];
    },
    staleTime: 60_000,
  });

  const applications: any[] = applicationsQuery.data ?? [];
  const isLoading = applicationsQuery.isLoading;

  const stats = useMemo(() => {
    const total = applications.length;
    const byStatus: Record<StatusBucket, number> = {
      pending: 0, approved: 0, rejected: 0, returned: 0, flagged: 0, disposed: 0,
    };
    const byType = { fresh: 0, renewal: 0, cancel: 0 };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    let processedToday = 0;
    let processedThisWeek = 0;

    let processingDaysSum = 0;
    let processingDaysCount = 0;

    applications.forEach(app => {
      const bucket = bucketStatus(extractStatusName(app));
      byStatus[bucket] += 1;
      byType[getApplicationType(app)] += 1;

      const createdDate = parseDate(app?.createdAt || app?.applicationDate);
      const actionDate = parseDate(app?.actionTakenAt || app?.updatedAt);

      if (actionDate && actionDate >= startOfToday) processedToday += 1;
      if (actionDate && actionDate >= weekAgo) processedThisWeek += 1;

      const isTerminal = bucket === 'approved' || bucket === 'rejected' || bucket === 'disposed';
      if (isTerminal && createdDate && actionDate) {
        const diffDays = (actionDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0) {
          processingDaysSum += diffDays;
          processingDaysCount += 1;
        }
      }
    });

    return {
      total,
      byStatus,
      byType,
      approvalRate: total > 0 ? Math.round((byStatus.approved / total) * 100) : 0,
      processedToday,
      processedThisWeek,
      avgProcessingDays: processingDaysCount > 0 ? processingDaysSum / processingDaysCount : null,
    };
  }, [applications]);

  const pct = (n: number) => (stats.total > 0 ? Math.round((n / stats.total) * 100) : 0);

  const handleExportExcel = async () => {
    if (applications.length === 0 || exporting) return;
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const rows = applications.map(app => ({
        'Acknowledgement No': app.acknowledgementNo || app.applicationId || app.id || '',
        'Applicant Name': app.applicantName || '',
        'Application Type': app.applicationType || '',
        Status: extractStatusName(app) || 'Unknown',
        'Created At': app.createdAt || app.applicationDate || '',
        'Last Updated': app.actionTakenAt || app.updatedAt || '',
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'My Applications');
      const fileName = `my_reports_${new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ARMS LICENSE MANAGEMENT SYSTEM', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(13);
      doc.text('MY REPORTS & ANALYTICS', pageWidth / 2, y, { align: 'center' });
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const section = (title: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, margin, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      };

      const row = (label: string, value: string) => {
        doc.text(label, margin + 2, y);
        doc.text(value, pageWidth - margin - 2, y, { align: 'right' });
        y += 6;
      };

      section('Summary');
      row('Total Applications', String(stats.total));
      row('Approval Rate', `${stats.approvalRate}%`);
      row('Average Processing Time', stats.avgProcessingDays !== null ? `${stats.avgProcessingDays.toFixed(1)} days` : 'N/A');
      row('Processed Today', String(stats.processedToday));
      row('Processed This Week', String(stats.processedThisWeek));
      y += 4;

      section('Status Breakdown');
      (Object.keys(STATUS_META) as StatusBucket[]).forEach(key => {
        row(STATUS_META[key].label, `${stats.byStatus[key]} (${pct(stats.byStatus[key])}%)`);
      });
      y += 4;

      section('Applications by Type');
      row('Fresh', String(stats.byType.fresh));
      row('Renewal', String(stats.byType.renewal));
      row('Cancellation', String(stats.byType.cancel));

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('This report was generated from the Arms License Management System.', pageWidth / 2, 285, { align: 'center' });

      const fileName = `my_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } finally {
      setExportingPdf(false);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <PageLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white">
      <Sidebar />
      <Header />

      <main
        className="flex-1 ml-0 md:ml-66 min-w-0 overflow-auto flex flex-col pt-[52px] md:pt-[66px]"
        style={headerHeight != null ? { paddingTop: headerHeight } : undefined}
      >
        <PageSubHeader
          title="My Reports & Analytics"
          metaBadge={`${stats.total.toLocaleString()} application${stats.total === 1 ? '' : 's'} in scope`}
        />

        <div className="flex-grow p-3 sm:p-4 lg:p-6 max-w-[1800px] w-full mx-auto flex flex-col gap-4 sm:gap-5">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F2D52]" />
            </div>
          ) : (
            <>
              {/* Top KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Applications</span>
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700"><FileText className="w-4 h-4" /></div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-gray-900">{stats.total.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</span>
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700"><Clock className="w-4 h-4" /></div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-gray-900">{stats.byStatus.pending.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</span>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-4 h-4" /></div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-gray-900">{stats.byStatus.approved.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejected</span>
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-700"><XCircle className="w-4 h-4" /></div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-gray-900">{stats.byStatus.rejected.toLocaleString()}</div>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Application Status Breakdown</h2>
                {stats.total === 0 ? (
                  <p className="text-sm text-gray-500">No applications found yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(Object.keys(STATUS_META) as StatusBucket[]).map(key => {
                      const meta = STATUS_META[key];
                      const count = stats.byStatus[key];
                      const percent = pct(count);
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 w-32 shrink-0 text-xs font-semibold ${meta.chipText}`}>
                            {meta.icon}
                            {meta.label}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div className={`${meta.bar} h-3 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-20 text-right text-xs font-bold text-gray-700">{count.toLocaleString()} ({percent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By type */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Applications by Type</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="font-medium text-gray-700">Fresh</span>
                      <span className="font-bold text-gray-900">{stats.byType.fresh.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="font-medium text-gray-700">Renewal</span>
                      <span className="font-bold text-gray-900">{stats.byType.renewal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="font-medium text-gray-700">Cancellation</span>
                      <span className="font-bold text-gray-900">{stats.byType.cancel.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Performance metrics */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Performance Metrics</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" />Average Processing Time</span>
                      <span className="font-bold text-gray-900">
                        {stats.avgProcessingDays !== null ? `${stats.avgProcessingDays.toFixed(1)} days` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-600"><TrendingUp className="w-4 h-4" />Approval Rate</span>
                      <span className="font-bold text-gray-900">{stats.approvalRate}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-600"><CalendarDays className="w-4 h-4" />Processed Today</span>
                      <span className="font-bold text-gray-900">{stats.processedToday.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-600"><CalendarClock className="w-4 h-4" />Processed This Week</span>
                      <span className="font-bold text-gray-900">{stats.processedThisWeek.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report actions */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Report Actions</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={exporting || stats.total === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F2D52] text-white rounded-lg font-semibold text-sm hover:bg-[#1A365D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                    Export Data (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={exportingPdf || stats.total === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#0F2D52] text-[#0F2D52] rounded-lg font-semibold text-sm hover:bg-[#0F2D52]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download Full Report (PDF)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
