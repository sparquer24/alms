'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Download,
  Award,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { LicenseService } from '@/services/licenseService';
import { LicenseData } from '@/types';
import { RecordInspectionModal, InspectionTarget } from './RecordInspectionModal';

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: { label: 'Active & Valid', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  EXPIRED: { label: 'Expired', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  REVOKED: { label: 'Revoked', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

interface LicensesDetailTableProps {
  initialStatus?: string; // 'ALL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED'
  initialExpiringDays?: number;
  embedded?: boolean;
}

export const LicensesDetailTable: React.FC<LicensesDetailTableProps> = ({
  initialStatus = 'ALL',
  initialExpiringDays,
  embedded = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [expiringFilter, setExpiringFilter] = useState<number | undefined>(initialExpiringDays);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedRecord, setSelectedRecord] = useState<InspectionTarget | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<LicenseData[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await LicenseService.getAllLicenses({
        page,
        limit,
        status: statusParam,
        expiringWithinDays: expiringFilter,
        search: searchQuery.trim() || undefined,
        orderBy: 'createdAt',
        order: 'desc',
      });

      if (res && res.data) {
        setData(res.data);
        setTotalRecords(res.total ?? res.data.length);
        setTotalPages(Math.max(1, Math.ceil((res.total ?? res.data.length) / limit)));
      } else {
        setData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('[LicensesDetailTable] Error fetching licenses:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, expiringFilter, searchQuery, page, limit]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  useEffect(() => {
    if (initialStatus) setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (initialExpiringDays !== undefined) setExpiringFilter(initialExpiringDays);
  }, [initialExpiringDays]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const csvRows = [
      ['S.No', 'License Number', 'ALMS UIN', 'Holder Name', 'Arms Category', 'Status', 'Valid From', 'Valid Till', 'Days Remaining', 'Issued Date'],
      ...data.map((lic, idx) => {
        const remainingDays = lic.validTill ? differenceInDays(new Date(lic.validTill), new Date()) : 'N/A';
        return [
          (page - 1) * limit + (idx + 1),
          `"${lic.licenseNumber || ''}"`,
          `"${lic.almsLicenseId || ''}"`,
          `"${lic.firstName || ''} ${lic.lastName || ''}"`,
          `"${lic.armsCategory || ''}"`,
          `"${lic.status || ''}"`,
          `"${lic.validFrom ? format(new Date(lic.validFrom), 'yyyy-MM-dd') : ''}"`,
          `"${lic.validTill ? format(new Date(lic.validTill), 'yyyy-MM-dd') : ''}"`,
          `"${remainingDays}"`,
          `"${lic.issueDate ? format(new Date(lic.issueDate), 'yyyy-MM-dd') : ''}"`,
        ];
      }),
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Licenses_Registry_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className={`w-full bg-white ${embedded ? '' : 'rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6'}`}>
      {/* Top Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center rounded-lg bg-gray-100 p-1 text-xs font-semibold">
            {[
              { key: 'ALL', label: 'All Licenses' },
              { key: 'ACTIVE', label: 'Active' },
              { key: 'EXPIRED', label: 'Expired' },
              { key: 'SUSPENDED', label: 'Suspended' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setExpiringFilter(undefined);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === tab.key && expiringFilter === undefined
                    ? 'bg-[#0F2D52] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Expiry Window Pills */}
          <div className="flex items-center rounded-lg bg-amber-50/80 border border-amber-200/60 p-1 text-xs font-semibold">
            {[
              { days: 30, label: 'Expiring <30d' },
              { days: 60, label: 'Expiring <60d' },
              { days: 90, label: 'Expiring <90d' },
            ].map((tab) => (
              <button
                key={tab.days}
                type="button"
                onClick={() => {
                  setExpiringFilter(tab.days);
                  setStatusFilter('ACTIVE');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  expiringFilter === tab.days
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Search & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search License No, Holder, Aadhar..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2D52]/20 focus:border-[#0F2D52] transition-all"
            />
          </div>

          <button
            type="button"
            onClick={fetchLicenses}
            disabled={loading}
            title="Refresh Licenses"
            className="p-2 text-gray-600 hover:text-[#0F2D52] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Export to CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center justify-between py-3 text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span>Total Matches: <strong className="text-gray-900">{totalRecords.toLocaleString()} licenses</strong></span>
          <span>•</span>
          <span>Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong></span>
        </div>

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

      {/* Table Canvas */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200 select-none">
            <tr>
              <th className="py-3 px-4 w-14">S.No</th>
              <th className="py-3 px-4">License Number</th>
              <th className="py-3 px-4">License Holder</th>
              <th className="py-3 px-4">Weapon Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Validity Horizon</th>
              <th className="py-3 px-4">Renewals</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4"><div className="h-3 w-6 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-32 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-28 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-24 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 w-20 bg-gray-200 rounded-full"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-28 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4"><div className="h-3.5 w-12 bg-gray-200 rounded"></div></td>
                  <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-gray-200 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((lic, idx) => {
                const normStatus = String(lic.status || 'ACTIVE').toUpperCase();
                const statusCfg = STATUS_BADGES[normStatus] || STATUS_BADGES.ACTIVE;

                const daysLeft = lic.validTill ? differenceInDays(new Date(lic.validTill), new Date()) : null;
                const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 90;
                const isPastExpiry = daysLeft !== null && daysLeft <= 0;

                const sNo = (page - 1) * limit + (idx + 1);

                return (
                  <tr key={lic.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="py-3.5 px-4 text-gray-500 font-mono font-medium">{sNo}</td>

                    {/* License Number & UIN */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#B8860B] shrink-0" />
                        <div>
                          <div className="font-mono font-bold text-gray-900 text-xs">
                            {lic.licenseNumber || `LIC-${lic.id}`}
                          </div>
                          {lic.almsLicenseId && (
                            <div className="text-[10px] text-gray-400 font-mono">UIN: {lic.almsLicenseId}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* License Holder */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {lic.firstName} {lic.lastName}
                      </div>
                      {lic.presentAddressLine && (
                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                          <MapPin className="w-2.5 h-2.5 text-gray-400" />
                          <span>{lic.presentAddressLine}</span>
                        </div>
                      )}
                    </td>

                    {/* Arms Category */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {lic.armsCategory ? String(lic.armsCategory).replace(/_/g, ' ') : 'Standard Category'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Validity Dates */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <div className="flex flex-col">
                        <div className="font-mono text-xs text-gray-900">
                          Till {lic.validTill ? format(new Date(lic.validTill), 'dd MMM yyyy') : '--'}
                        </div>
                        {isExpiringSoon && (
                          <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Expires in {daysLeft} days</span>
                          </span>
                        )}
                        {isPastExpiry && (
                          <span className="text-[10px] text-rose-700 font-semibold flex items-center gap-0.5 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Expired {Math.abs(daysLeft)}d ago</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Renewal Count */}
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                      {lic.renewalCount ? `${lic.renewalCount} Renewed` : 'Original'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord({
                          type: 'LICENSE',
                          id: lic.id,
                          licenseNumber: lic.licenseNumber,
                          initialData: lic,
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
                    <Award className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-600">No licenses match your filter criteria</p>
                    <p className="text-xs text-gray-400">Try changing status filter or search parameters</p>
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-3 text-xs text-gray-600">
        <div>
          Showing {data.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalRecords)} of {totalRecords.toLocaleString()} licenses
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

export default LicensesDetailTable;
