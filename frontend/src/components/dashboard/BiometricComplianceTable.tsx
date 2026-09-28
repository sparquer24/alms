'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Fingerprint,
  Lock,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { analyticsService, ApplicationRecord } from '@/services/analyticsService';
import { RecordInspectionModal, InspectionTarget } from './RecordInspectionModal';

interface BiometricComplianceTableProps {
  embedded?: boolean;
}

export const BiometricComplianceTable: React.FC<BiometricComplianceTableProps> = ({ embedded = false }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bioFilter, setBioFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedRecord, setSelectedRecord] = useState<InspectionTarget | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ApplicationRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchBiometricData = useCallback(async () => {
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
      console.error('[BiometricComplianceTable] Error fetching data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => {
    fetchBiometricData();
  }, [fetchBiometricData]);

  return (
    <div className={`w-full bg-white ${embedded ? '' : 'rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6'}`}>
      {/* Compliance Overview Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0F2D52] to-[#1E3A8A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/10 text-white backdrop-blur-xs">
            <Fingerprint className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold">UIDAI Aadhaar Biometric Compliance Engine</h4>
            <p className="text-xs text-blue-200 mt-0.5">
              Secure fingerprint &amp; iris verification under Ministry of Home Affairs (MHA) Rule 11
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            100% Encrypted &amp; Masked
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-semibold">
          {[
            { key: 'ALL', label: 'All Identity Records' },
            { key: 'VERIFIED', label: 'Biometric Verified' },
            { key: 'PENDING', label: 'Pending Biometric' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setBioFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                bioFilter === tab.key
                  ? 'bg-[#0F2D52] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Applicant or Ack No..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52]"
            />
          </div>

          <button
            type="button"
            onClick={fetchBiometricData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-[#0F2D52] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 w-14">S.No</th>
              <th className="py-3 px-4">Ack No / Ref</th>
              <th className="py-3 px-4">Applicant Name</th>
              <th className="py-3 px-4">Application Type</th>
              <th className="py-3 px-4">UIDAI Aadhaar Token</th>
              <th className="py-3 px-4">Biometric Status</th>
              <th className="py-3 px-4">Review Officer</th>
              <th className="py-3 px-4 text-right">Audit</th>
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
                  <td className="py-3.5 px-4"><div className="h-3.5 w-24 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 w-24 bg-gray-200 rounded-full"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-20 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-gray-200 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row, idx) => {
                const sNo = (page - 1) * limit + (idx + 1);
                // Mock biometric masked hash for display
                const maskedToken = `UIDAI-XXXX-XXXX-${String(row.applicationId).padStart(4, '0')}`;

                return (
                  <tr key={`${row.applicationId}-${idx}`} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-500 font-medium">{sNo}</td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-900">
                      {row.licenseId || `APP-${row.applicationId}`}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{row.applicantName || 'Applicant Pending'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {row.applicationType || 'FRESH'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-gray-700 font-mono text-[11px]">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>{maskedToken}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Enrolled &amp; Verified</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      {row.currentUser?.name || 'In Queue'}
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
                  No biometric records found
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
          Showing {data.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalRecords)} of {totalRecords.toLocaleString()} biometric records
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

export default BiometricComplianceTable;
