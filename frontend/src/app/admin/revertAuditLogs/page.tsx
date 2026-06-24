'use client';
// ─── app/admin/revertAuditLogs/page.tsx ─────────────────────────────────────
// Admin-only page: view all revert audit logs across the system.
// Route: /admin/revertAuditLogs

import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Filter, Download, AlertTriangle, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { RevertAuditLog, RevertAuditLogPage, ApplicationType } from '../../../types/revert';
import { getRevertAuditLogs } from '../../../api/revertService';

const PAGE_SIZE = 20;

const BADGE = (label: string, color: string, bg: string) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: bg, color }}>{label}</span>
);

export default function RevertAuditLogsPage() {
  const [data, setData] = useState<RevertAuditLogPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [filterType, setFilterType] = useState<ApplicationType | ''>('');
  const [filterTerminal, setFilterTerminal] = useState<'' | 'true' | 'false'>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRevertAuditLogs({
        applicationType: filterType || undefined,
        isTerminalRevert: filterTerminal !== '' ? filterTerminal === 'true' : undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterTerminal, filterDateFrom, filterDateTo, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const exportCSV = () => {
    if (!data?.logs?.length) return;
    const headers = ['ID', 'App ID', 'Type', 'From V', 'To V', 'New V', 'By User', 'By Role', 'Reason', 'Date', 'Terminal'];
    const rows = data.logs.map((l) => [
      l.id, l.applicationId, l.applicationType, l.fromVersionNumber, l.toVersionNumber,
      l.newVersionNumber, l.revertedByUser?.username ?? l.revertedByUserId,
      l.revertedByRole?.name ?? l.revertedByRoleId, `"${l.reason}"`,
      formatDate(l.revertedAt), l.isTerminalRevert ? 'YES' : 'No',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'revert-audit-logs.csv'; a.click();
  };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#6366f1', borderRadius: 10, padding: 10 }}>
            <RotateCcw size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Revert Audit Logs</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              Complete log of all application revert operations
              {data && ` — ${data.totalCount} total`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer' }}>
            <RefreshCcw size={14} /> Refresh
          </button>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280' }}>
          <Filter size={15} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Filters:</span>
        </div>

        <select value={filterType} onChange={(e) => { setFilterType(e.target.value as any); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, color: '#374151' }}>
          <option value="">All Types</option>
          <option value="FRESH">Fresh License</option>
          <option value="RENEWAL">Renewal</option>
        </select>

        <select value={filterTerminal} onChange={(e) => { setFilterTerminal(e.target.value as any); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, color: '#374151' }}>
          <option value="">All Reverts</option>
          <option value="true">Terminal Only ⚠</option>
          <option value="false">Normal Only</option>
        </select>

        <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13 }} />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>to</span>
        <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13 }} />

        <button onClick={() => { setFilterType(''); setFilterTerminal(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }}
          style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 130px 120px 100px 1fr 120px', padding: '12px 20px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', gap: 12 }}>
          {['#', 'Application', 'Type', 'Versions', 'Status Change', 'By Role', 'Reason', 'Date'].map((h) => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 14 }}>Loading…</div>
        )}

        {!loading && (!data?.logs?.length) && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
            <RotateCcw size={36} color="#e5e7eb" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14 }}>No revert logs found.</p>
          </div>
        )}

        {!loading && data?.logs?.map((log: RevertAuditLog) => (
          <div key={log.id} style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 100px 130px 120px 100px 1fr 120px',
            padding: '14px 20px', borderBottom: '1px solid #f3f4f6', gap: 12, alignItems: 'center',
            background: log.isTerminalRevert ? '#fff7f7' : '#fff',
          }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>#{log.id}</span>

            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>App #{log.applicationId}</span>
              {log.isTerminalRevert && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <AlertTriangle size={11} color="#dc2626" />
                  <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>TERMINAL REVERT</span>
                </div>
              )}
            </div>

            {BADGE(log.applicationType, '#fff', log.applicationType === 'FRESH' ? '#6366f1' : '#8b5cf6')}

            <div style={{ fontSize: 12, color: '#374151' }}>
              V{log.fromVersionNumber} → V{log.toVersionNumber}
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>New: V{log.newVersionNumber}</div>
            </div>

            <div style={{ fontSize: 12, color: '#374151' }}>
              Status {log.fromStatusId} → {log.toStatusId}
            </div>

            <span style={{ fontSize: 12, color: '#374151' }}>
              {log.revertedByUser?.username ?? `#${log.revertedByUserId}`}
              <div style={{ fontSize: 10, color: '#6b7280' }}>{log.revertedByRole?.name ?? ''}</div>
            </span>

            <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.reason}>
              {log.reason}
            </span>

            <span style={{ fontSize: 11, color: '#6b7280' }}>{formatDate(log.revertedAt)}</span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #d1d5db', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: 13, color: '#374151' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #d1d5db', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
