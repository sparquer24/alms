'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  Eye,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { analyticsService, ApplicationRecord } from '@/services/analyticsService';
import { RecordInspectionModal, InspectionTarget } from './RecordInspectionModal';

interface TurnaroundSlaTableProps {
  embedded?: boolean;
}

export const TurnaroundSlaTable: React.FC<TurnaroundSlaTableProps> = ({ embedded = false }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'MET' | 'STANDARD' | 'DELAYED'>('ALL');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedRecord, setSelectedRecord] = useState<InspectionTarget | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ApplicationRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchTurnaroundData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getApplicationsDetails({
        page,
        limit,
        q: searchQuery.trim() || undefined,
        sort: '-updatedAt',
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
      console.error('[TurnaroundSlaTable] Error fetching data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => {
    fetchTurnaroundData();
  }, [fetchTurnaroundData]);

  // Compute SLA badge for a record
  const getSlaInfo = (days: number, isApproved: boolean, isRejected: boolean) => {
    if (days <= 14) {
      return {
        label: 'Fast-Track SLA (<15d)',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        type: 'MET',
      };
    } else if (days <= 30) {
      return {
        label: 'Standard Target (15-30d)',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        type: 'STANDARD',
      };
    } else {
      return {
        label: 'Overdue SLA (>30d)',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        type: 'DELAYED',
      };
    }
  };

  const filteredData = data.filter((row) => {
    if (slaFilter === 'ALL') return true;
    const days = row.daysTillToday ?? 0;
    const info = getSlaInfo(days, row.status === 'APPROVED', row.status === 'REJECTED');
    return info.type === slaFilter;
  });

  return (
    <div className={`w-full bg-white ${embedded ? '' : 'rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6'}`}>
      {/* SLA Benchmarks Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 pb-5 border-b border-gray-100">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Fast-Track Disposal</div>
            <div className="text-base font-black text-emerald-700">&lt;15 Calendar Days</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Standard SLA Window</div>
            <div className="text-base font-black text-blue-700">15 – 30 Days Target</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-600 text-white shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Escalation Threshold</div>
            <div className="text-base font-black text-rose-700">&gt;30 Days Flagged</div>
          </div>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        {/* SLA Filter Pills */}
        <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-semibold">
          {[
            { key: 'ALL', label: 'All Cases' },
            { key: 'MET', label: 'Fast-Track (<15d)' },
            { key: 'STANDARD', label: 'Standard (15-30d)' },
            { key: 'DELAYED', label: 'Overdue (>30d)' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSlaFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                slaFilter === tab.key
                  ? 'bg-[#0F2D52] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Ack No, License ID..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52]"
            />
          </div>

          <button
            type="button"
            onClick={fetchTurnaroundData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-[#0F2D52] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 w-14">S.No</th>
              <th className="py-3 px-4">Ack No / License ID</th>
              <th className="py-3 px-4">Applicant Name</th>
              <th className="py-3 px-4">Application Type</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Days In Process</th>
              <th className="py-3 px-4">SLA Compliance</th>
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
                  <td className="py-3.5 px-4"><div className="h-3.5 w-16 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 w-28 bg-gray-200 rounded-full"></div></td>
                  <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-gray-200 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((row, idx) => {
                const days = row.daysTillToday ?? 0;
                const slaInfo = getSlaInfo(days, row.status === 'APPROVED', row.status === 'REJECTED');
                const sNo = (page - 1) * limit + (idx + 1);

                return (
                  <tr key={`${row.applicationId}-${idx}`} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-500 font-medium">{sNo}</td>

                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <FileText className="w-3.5 h-3.5 text-[#0F2D52]" />
                        <span>{row.licenseId || `APP-${row.applicationId}`}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {row.applicantName || 'Applicant Pending'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {row.applicationType || 'FRESH'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        row.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status || 'PENDING'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{days} {days === 1 ? 'Day' : 'Days'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${slaInfo.bg}`}>
                        {slaInfo.label}
                      </span>
                    </td>

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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0F2D52] text-white hover:bg-[#1E3A8A] transition-colors cursor-pointer"
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
                  No records match the selected SLA tier
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

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-3 text-xs text-gray-600">
        <div>
          Showing {data.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalRecords)} of {totalRecords.toLocaleString()} cases
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurnaroundSlaTable;
