'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminCard, AdminTable } from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import {
  AdminBorderRadius,
  AdminLayout,
  AdminShadows,
  AdminSpacing,
  AdminTransitions,
} from '@/styles/admin-design-system';

type ApplicationStatus = 'Approved' | 'Pending' | 'Rejected';

interface ApplicationRow {
  id: number;
  acknowledgementNo: string;
  applicantName: string;
  applicationType: string;
  status: ApplicationStatus;
  actionTakenAt: string;
}

const mockApplications: ApplicationRow[] = [
  {
    id: 1,
    acknowledgementNo: 'ACK-2024-0001',
    applicantName: 'Aarav Sharma',
    applicationType: 'New License',
    status: 'Approved',
    actionTakenAt: '2024-11-18 10:20',
  },
  {
    id: 2,
    acknowledgementNo: 'ACK-2024-0002',
    applicantName: 'Meera Patel',
    applicationType: 'Renewal',
    status: 'Pending',
    actionTakenAt: '2024-11-19 14:05',
  },
  {
    id: 3,
    acknowledgementNo: 'ACK-2024-0003',
    applicantName: 'Rahul Singh',
    applicationType: 'Transfer',
    status: 'Rejected',
    actionTakenAt: '2024-11-17 09:40',
  },
  {
    id: 4,
    acknowledgementNo: 'ACK-2024-0004',
    applicantName: 'Sanya Iyer',
    applicationType: 'New License',
    status: 'Approved',
    actionTakenAt: '2024-11-16 16:20',
  },
  {
    id: 5,
    acknowledgementNo: 'ACK-2024-0005',
    applicantName: 'Kabir Narang',
    applicationType: 'Renewal',
    status: 'Pending',
    actionTakenAt: '2024-11-20 11:05',
  },
  {
    id: 6,
    acknowledgementNo: 'ACK-2024-0006',
    applicantName: 'Nikita Rao',
    applicationType: 'Duplicate',
    status: 'Approved',
    actionTakenAt: '2024-11-15 13:10',
  },
];

const statusPalette: Record<ApplicationStatus, { bg: string; text: string }> = {
  Approved: { bg: '#ECFDF3', text: '#16A34A' },
  Pending: { bg: '#FFFBEB', text: '#CA8A04' },
  Rejected: { bg: '#FEF2F2', text: '#DC2626' },
};

const cardPalette = {
  total: '#3B82F6',
  approved: '#10B981',
  pending: '#F59E0B',
  rejected: '#EF4444',
};

export default function ApplicationsDetailsPage() {
  const { colors } = useAdminTheme();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const qp = (searchParams?.get('status') || '').trim();
    const validStatuses: ApplicationStatus[] = ['Approved', 'Pending', 'Rejected'];
    if (validStatuses.includes(qp as ApplicationStatus)) {
      setStatus(qp);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return mockApplications.filter(app => {
      const matchesTerm =
        app.applicantName.toLowerCase().includes(term) ||
        app.applicationType.toLowerCase().includes(term) ||
        app.acknowledgementNo.toLowerCase().includes(term);
      const matchesStatus = status ? app.status === status : true;
      return matchesTerm && matchesStatus;
    });
  }, [search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const summary = useMemo(() => {
    const total = filtered.length;
    const approved = filtered.filter(a => a.status === 'Approved').length;
    const pending = filtered.filter(a => a.status === 'Pending').length;
    const rejected = filtered.filter(a => a.status === 'Rejected').length;
    return { total, approved, pending, rejected };
  }, [filtered]);

  const handleDownload = () => {
    const header = [
      'S.No',
      'Acknowledgement No',
      'Applicant Name',
      'Application Type',
      'Status',
      'Action Taken At',
    ];
    const rows = filtered.map((row, index) => [
      index + 1,
      row.acknowledgementNo,
      row.applicantName,
      row.applicationType,
      row.status,
      row.actionTakenAt,
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'applications-details.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        padding: AdminLayout.content.padding,
        display: 'flex',
        flexDirection: 'column',
        gap: AdminLayout.content.gap,
        backgroundColor: colors.background,
        minHeight: '100vh',
      }}
    >
      {/* Hero Header Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          borderRadius: AdminBorderRadius.xl,
          padding: `${AdminSpacing['3xl']} ${AdminSpacing['3xl']}`,
          boxShadow: AdminShadows.lg,
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: AdminSpacing['2xl'],
          }}
        >
          {/* Left: Title & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.xs }}>
            {/* <span style={{ fontSize: "14px", color: "#E0E7FF", opacity: 0.9 }}>Admin Panel</span> */}
            <h1
              style={{
                margin: 0,
                fontSize: '30px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              Applications Details
            </h1>
            <p
              style={{
                margin: 0,
                color: '#E0E7FF',
                fontSize: '15px',
                maxWidth: '640px',
              }}
            >
              Search, filter, and download application records. Manage the status of all submitted
              applications in one place.
            </p>
          </div>
        </div>
      </section>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: AdminSpacing.lg,
        }}
      >
        <SummaryCard label='Total Applications' value={summary.total} color={cardPalette.total} />
        <SummaryCard label='Approved' value={summary.approved} color={cardPalette.approved} />
        <SummaryCard label='Pending' value={summary.pending} color={cardPalette.pending} />
        <SummaryCard label='Rejected' value={summary.rejected} color={cardPalette.rejected} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.7fr auto',
          gap: AdminSpacing.md,
          alignItems: 'center',
        backgroundColor: '#FFFFFF',
          padding: AdminSpacing.md,
          borderRadius: AdminBorderRadius.lg,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}
      >
        <input
          type='text'
          placeholder='Search username, email, or phone...'
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            height: '40px',
            borderRadius: AdminBorderRadius.md,
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            color: colors.text.primary,
            fontSize: '14px',
            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
          }}
        />

        <select
          value={status}
          onChange={e => {
            setPage(1);
            setStatus(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            height: '40px',
            borderRadius: AdminBorderRadius.md,
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            color: colors.text.primary,
            fontSize: '14px',
            appearance: 'auto',
            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
          }}
          aria-label='Status filter'
        >
          <option value=''>All Statuses</option>
          <option value='Approved'>Approved</option>
          <option value='Pending'>Pending</option>
          <option value='Rejected'>Rejected</option>
        </select>

        <button
          type='button'
          onClick={handleDownload}
          style={{
            padding: '0 16px',
            height: '40px',
            borderRadius: AdminBorderRadius.md,
            border: 'none',
            backgroundColor: '#374151',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            transition: `all ${AdminTransitions.fast}`,
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1F2937';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#374151';
          }}
        >
          ↓ Download Excel
        </button>
      </div>

      {/* Applications Table */}
      <AdminCard>
        {/* Section header for table */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: AdminSpacing.md,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: colors.text.primary }}>
            Applications
          </h2>
          <span style={{ color: colors.text.secondary, fontSize: '13px' }}>
            Showing {paginated.length} of {filtered.length}
          </span>
        </div>
        <div
          style={{
            maxHeight: 520,
            overflowY: 'auto',
            borderRadius: AdminBorderRadius.lg,
            border: `1px solid ${colors.border}`,
          }}
        >
        <AdminTable
          columns={[
            {
              key: 'id',
              header: 'S.No',
              render: (_value, row) => start + (paginated.indexOf(row) + 1),
              width: '80px',
            },
            {
              key: 'applicationsids',
              header: 'Application IDs',
            },
            { key: 'applicantName', header: 'Applicant Name' },
            { key: 'applicationType', header: 'Application Type' },
            {
              key: 'status',
              header: 'Status',
              render: value => (
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: AdminBorderRadius.full,
                    backgroundColor: statusPalette[value as ApplicationStatus].bg,
                    color: statusPalette[value as ApplicationStatus].text,
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {value}
                </span>
              ),
            },
            { key: 'actionTakenAt', header: 'Action Taken At' },
          ]}
          data={paginated}
          rowKey='id'
          emptyMessage='No applications found'
        />
        </div>
        {/* Pagination Info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: AdminSpacing.lg,
          }}
        ></div>
      </AdminCard>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color }) => {
  const { colors } = useAdminTheme();
  return (
    <AdminCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: AdminSpacing.sm }}>
        <span style={{ color: colors.text.secondary, fontSize: '14px', fontWeight: 600 }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: AdminSpacing.sm }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: AdminBorderRadius.full,
              backgroundColor: color,
              boxShadow: AdminShadows.sm,
            }}
          />
          <span style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</span>
        </div>
      </div>
    </AdminCard>
  );
};
