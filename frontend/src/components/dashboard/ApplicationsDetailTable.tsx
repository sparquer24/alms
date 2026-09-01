'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowUpDown,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { analyticsService, ApplicationRecord } from '@/services/analyticsService';
import { RecordInspectionModal, InspectionTarget } from './RecordInspectionModal';

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  FRESH: { label: 'Fresh Application', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  RENEWAL: { label: 'License Renewal', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CANCEL: { label: 'Cancellation', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  APPROVED: { label: 'Approved & Issued', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
  PENDING: { label: 'In Verification', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', icon: Clock },
  REJECTED: { label: 'Disallowed / Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', icon: AlertCircle },
};

interface ApplicationsDetailTableProps {
  initialType?: string; // 'all' | 'fresh' | 'renewal' | 'cancel'
  initialStatus?: string; // 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'
  embedded?: boolean;
}

export const ApplicationsDetailTable: React.FC<ApplicationsDetailTableProps> = ({
  initialType = 'all',
  initialStatus = 'ALL',
  embedded = false,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedRecord, setSelectedRecord] = useState<InspectionTarget | null>(null);
  const [sortOrder, setSortOrder] = useState<string>('-updatedAt');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ApplicationRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter === 'all' ? undefined : typeFilter;
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const qParam = searchQuery.trim() ? searchQuery.trim() : undefined;

      const res = await analyticsService.getApplicationsDetails({
        type: typeParam,
        status: statusParam,
        q: qParam,
        page,
        limit,
        sort: sortOrder,
      });

      if (res && res.data) {
        setData(res.data);
        const total = res.meta?.total ?? res.data.length;
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('[ApplicationsDetailTable] Error fetching applications:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery, page, limit, sortOrder]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Update filters if props change
  useEffect(() => {
    if (initialType) setTypeFilter(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialStatus) setStatusFilter(initialStatus);
  }, [initialStatus]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const exportData = data.map((item, idx) => ({
      'S.No': (page - 1) * limit + (idx + 1),
      'Application ID': item.applicationId,
      'License / Ack Number': item.licenseId || `APP-${item.applicationId}`,
      'Applicant Name': item.applicantName || 'N/A',
      'Application Type': item.applicationType || 'FRESH',
      'Workflow Status': item.status || 'PENDING',
      'Reviewing Officer': item.currentUser?.name || 'In Queue',
      'Days in Review': item.daysTillToday ?? 0,
      'Last Updated': item.actionTakenAt ? format(new Date(item.actionTakenAt), 'yyyy-MM-dd HH:mm') : 'N/A',
    }));
    analyticsService.exportToCSV(exportData, `Applications_Data_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportExcel = async () => {
    if (!data || data.length === 0) return;
    const exportData = data.map((item, idx) => ({
      'S.No': (page - 1) * limit + (idx + 1),
      'Application ID': item.applicationId,
      'License / Ack Number': item.licenseId || `APP-${item.applicationId}`,
      'Applicant Name': item.applicantName || 'N/A',
      'Application Type': item.applicationType || 'FRESH',
      'Workflow Status': item.status || 'PENDING',
      'Reviewing Officer': item.currentUser?.name || 'In Queue',
      'Days in Review': item.daysTillToday ?? 0,
      'Last Updated': item.actionTakenAt ? format(new Date(item.actionTakenAt), 'yyyy-MM-dd HH:mm') : 'N/A',
    }));
    try {
      await analyticsService.exportToExcel(exportData, `Applications_Data_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      handleExportCSV();
    }
  };

  return (
    <div className={`w-full bg-white ${embedded ? '' : 'rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6'}`}>
      {/* Top Filter & Search Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        {/* Left Side: Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Family / Type Selector */}
          <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-semibold">
            {[
              { key: 'all', label: 'All Types' },
              { key: 'fresh', label: 'Fresh' },
              { key: 'renewal', label: 'Renewal' },
              { key: 'cancel', label: 'Cancellation' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setTypeFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  typeFilter === tab.key
                    ? 'bg-[#0F2D52] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Pills */}
          <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-semibold">
            {[
              { key: 'ALL', label: 'All Status' },
              { key: 'PENDING', label: 'In Review' },
              { key: 'APPROVED', label: 'Approved' },
              { key: 'REJECTED', label: 'Disallowed' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === tab.key
                    ? 'bg-[#B8860B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Search & Export Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by Ack No, License ID, Name..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52] transition-all"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchApplications}
            disabled={loading}
            title="Refresh Table Data"
            className="p-2 text-gray-600 hover:text-[#0F2D52] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export CSV / Excel */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Export Applications to CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Meta Stats Row */}
      <div className="flex items-center justify-between py-3 text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span>Total Filtered Records: <strong className="text-gray-900">{totalRecords.toLocaleString()}</strong></span>
          <span>•</span>
          <span>Showing Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong></span>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 font-medium text-gray-700 focus:outline-none"
          >
            <option value={10}>10 records</option>
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
          </select>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200 select-none">
            <tr>
              <th className="py-3 px-4 w-14">S.No</th>
              <th className="py-3 px-4">Ack No / License ID</th>
              <th className="py-3 px-4">Applicant Name</th>
              <th className="py-3 px-4">Application Type</th>
              <th className="py-3 px-4">Workflow Status</th>
              <th className="py-3 px-4">Assigned Reviewer</th>
              <th className="py-3 px-4">
                <div
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-900"
                  onClick={() => setSortOrder(sortOrder === '-updatedAt' ? 'updatedAt' : '-updatedAt')}
                >
                  <span>Last Activity</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4"><div className="h-3 w-6 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-28 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-32 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 w-20 bg-gray-200 rounded-full"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 w-24 bg-gray-200 rounded-full"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-24 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-20 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-gray-200 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row, idx) => {
                const appType = String(row.applicationType || 'FRESH').toUpperCase();
                const typeCfg = TYPE_CONFIG[appType] || TYPE_CONFIG.FRESH;

                const normStatus = (row.status || 'PENDING').toUpperCase();
                const statusCfg = STATUS_CONFIG[normStatus] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusCfg.icon;

                const rowSNo = (page - 1) * limit + (idx + 1);

                return (
                  <tr key={`${row.applicationId}-${idx}`} className="hover:bg-blue-50/40 transition-colors group">
                    {/* S.No */}
                    <td className="py-3.5 px-4 text-gray-500 font-mono font-medium">
                      {rowSNo}
                    </td>

                    {/* Ack No / License ID */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#0F2D52]" />
                        <span className="font-mono text-xs">{row.licenseId || `APP-${row.applicationId}`}</span>
                      </div>
                    </td>

                    {/* Applicant Name */}
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="capitalize">{row.applicantName || 'Applicant Name Pending'}</span>
                      </div>
                    </td>

                    {/* Application Type */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}>
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCfg.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusCfg.label}</span>
                      </span>
                    </td>

                    {/* Reviewing Officer & Days in Queue */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <div>
                        <div className="font-medium text-gray-900">{row.currentUser?.name || 'Unassigned / Queue'}</div>
                        {row.daysTillToday !== null && row.daysTillToday !== undefined && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            {row.daysTillToday} {row.daysTillToday === 1 ? 'day' : 'days'} in process
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                      {row.actionTakenAt ? (
                        format(new Date(row.actionTakenAt), 'dd MMM yyyy, HH:mm')
                      ) : (
                        '--'
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord({
                          type: 'APPLICATION',
                          id: row.applicationId,
                          acknowledgementNo: row.licenseId || `APP-${row.applicationId}`,
                          appType: row.applicationType,
                          initialData: row,
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0F2D52] text-white hover:bg-[#1E3A8A] transition-colors shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-600">No applications match your selected filters</p>
                    <p className="text-xs text-gray-400">Try adjusting the search keyword or switching status and type pills</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <RecordInspectionModal
          target={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Bottom Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-3 text-xs text-gray-600">
        <div>
          Showing {data.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalRecords)} of {totalRecords.toLocaleString()} applications
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-semibold text-gray-800 bg-gray-100 rounded-md">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsDetailTable;
