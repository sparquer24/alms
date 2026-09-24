import React, { useState } from 'react';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminDataTable } from '@/components/tables/AdminDataTable';

interface Role {
  id?: number;
  name: string;
  code: string;
  dashboard_title: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  description?: string;
}

interface RoleTableProps {
  roles: Role[];
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onToggleStatus?: (role: Role) => void;
  onViewPermissions?: (role: Role) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

const SortIcon: React.FC<{ field: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }> = ({
  field,
  sortBy,
  sortOrder,
}) => {
  if (sortBy !== field) {
    return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
  }
  return <span style={{ marginLeft: '4px' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
};

export const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  isLoading = false,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewPermissions,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
}) => {
  const { colors } = useAdminTheme();

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: AdminSpacing.xl,
          textAlign: 'center',
          color: colors.text.secondary,
        }}
      >
        Loading roles...
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div
        style={{
          padding: AdminSpacing.xl,
          textAlign: 'center',
          color: colors.text.secondary,
          backgroundColor: colors.background,
          borderRadius: AdminBorderRadius.lg,
          border: `1px solid ${colors.border}`,
        }}
      >
        No roles found
      </div>
    );
  }

  return (
    <AdminDataTable
      data={roles}
      columns={[
        {
          key: 'sno',
          header: 'S.No',
          width: '80px',
          render: (_, row) => (currentPage - 1) * 10 + (roles.indexOf(row)) + 1
        },
        {
          key: 'name',
          header: 'Role Name',
          sortable: true,
          render: (_, role) => (
            <div>
              <div className="font-medium text-slate-800">{role.name}</div>
              {role.description && (
                <div className="text-xs text-slate-500 mt-1">{role.description}</div>
              )}
            </div>
          )
        },
        {
          key: 'code',
          header: 'Code',
          sortable: true,
          render: (_, role) => (
            <span className="font-mono text-xs text-slate-500">{role.code}</span>
          )
        },
        {
          key: 'is_active',
          header: 'Status',
          render: (_, role) => (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: AdminBorderRadius.sm,
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: role.is_active ? '#d4edda' : '#f8d7da',
                color: role.is_active ? '#155724' : '#856404',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: role.is_active ? '#28a745' : '#dc3545',
                }}
              />
              {role.is_active ? 'Active' : 'Inactive'}
            </span>
          )
        },
        {
          key: 'created_at',
          header: 'Created',
          sortable: true,
          render: (_, role) => <span className="text-xs text-slate-500">{formatDate(role.created_at)}</span>
        },
        {
          key: 'updated_at',
          header: 'Updated',
          sortable: true,
          render: (_, role) => <span className="text-xs text-slate-500">{formatDate(role.updated_at)}</span>
        }
      ]}
      loading={isLoading}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        pageSize: 10,
        onPageChange: (page) => onPageChange && onPageChange(page)
      }}
      rowActions={[
        ...(onViewPermissions ? [{
          label: 'Perms',
          onClick: (role: Role) => onViewPermissions(role),
          variant: 'primary' as const
        }] : []),
        ...(onEdit ? [{
          label: 'Edit',
          onClick: (role: Role) => onEdit(role),
          variant: 'secondary' as const
        }] : []),
        ...(onToggleStatus ? [{
          label: (row: Role) => row.is_active ? 'Deactivate' : 'Activate',
          onClick: (role: Role) => onToggleStatus(role),
          variant: 'secondary' as const
        }] : []),
        ...(onDelete ? [{
          label: 'Delete',
          onClick: (role: Role) => onDelete(role),
          variant: 'danger' as const
        }] : []),
      ]}
      emptyMessage="No roles found"
      className="border-none shadow-none"
    />
  );
};
