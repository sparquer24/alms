import React, { useState } from 'react';
import { AdminBorderRadius, AdminSpacing } from '@/styles/admin-design-system';
import { useAdminTheme } from '@/context/AdminThemeContext';

interface Role {
  id: number;
  name: string;
  code: string;
  dashboard_title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  onPageChange,
}) => {
  const { colors } = useAdminTheme();

  const formatDate = (date: string) => {
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
    <div style={{ overflow: 'x-auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: colors.surface,
          borderRadius: AdminBorderRadius.lg,
          overflow: 'hidden',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: colors.background,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <th
              style={{
                padding: AdminSpacing.md,
                textAlign: 'left',
                fontWeight: 600,
                color: colors.text.primary,
                cursor: onSort ? 'pointer' : 'default',
              }}
              onClick={() => handleSort('name')}
            >
              Role Name
              <SortIcon field='name' sortBy={sortBy} sortOrder={sortOrder} />
            </th>
            <th
              style={{
                padding: AdminSpacing.md,
                textAlign: 'left',
                fontWeight: 600,
                color: colors.text.primary,
                cursor: onSort ? 'pointer' : 'default',
              }}
              onClick={() => handleSort('code')}
            >
              Code
              <SortIcon field='code' sortBy={sortBy} sortOrder={sortOrder} />
            </th>
            <th
              style={{
                padding: AdminSpacing.md,
                textAlign: 'left',
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Status
            </th>
            <th
              style={{
                padding: AdminSpacing.md,
                textAlign: 'left',
                fontWeight: 600,
                color: colors.text.primary,
                cursor: onSort ? 'pointer' : 'default',
              }}
              onClick={() => handleSort('created_at')}
            >
              Created
              <SortIcon field='created_at' sortBy={sortBy} sortOrder={sortOrder} />
            </th>
            <th
              style={{
                padding: AdminSpacing.md,
                textAlign: 'left',
                fontWeight: 600,
                color: colors.text.primary,
                cursor: onSort ? 'pointer' : 'default',
              }}
              onClick={() => handleSort('updated_at')}
            >
              Updated
              <SortIcon field='updated_at' sortBy={sortBy} sortOrder={sortOrder} />
            </th>
            <th
              style={{
                padding: AdminSpacing.md,
                textAlign: 'center',
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr
              key={role.id}
              style={{
                borderBottom: `1px solid ${colors.border}`,
                '&:hover': {
                  backgroundColor: colors.background,
                },
              }}
            >
              <td
                style={{
                  padding: AdminSpacing.md,
                  color: colors.text.primary,
                  fontWeight: 500,
                }}
              >
                <div>
                  <div>{role.name}</div>
                  {role.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: colors.text.secondary,
                        marginTop: '4px',
                      }}
                    >
                      {role.description}
                    </div>
                  )}
                </div>
              </td>
              <td
                style={{
                  padding: AdminSpacing.md,
                  color: colors.text.secondary,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                {role.code}
              </td>
              <td
                style={{
                  padding: AdminSpacing.md,
                }}
              >
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
              </td>
              <td
                style={{
                  padding: AdminSpacing.md,
                  color: colors.text.secondary,
                  fontSize: '12px',
                }}
              >
                {formatDate(role.created_at)}
              </td>
              <td
                style={{
                  padding: AdminSpacing.md,
                  color: colors.text.secondary,
                  fontSize: '12px',
                }}
              >
                {formatDate(role.updated_at)}
              </td>
              <td
                style={{
                  padding: AdminSpacing.md,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: AdminSpacing.sm,
                    justifyContent: 'center',
                  }}
                >
                  {onViewPermissions && (
                    <button
                      onClick={() => onViewPermissions(role)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        border: 'none',
                        borderRadius: AdminBorderRadius.sm,
                        cursor: 'pointer',
                      }}
                      title='View Permissions'
                    >
                      Perms
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(role)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: '#fff3e0',
                        color: '#f57c00',
                        border: 'none',
                        borderRadius: AdminBorderRadius.sm,
                        cursor: 'pointer',
                      }}
                      title='Edit Role'
                    >
                      Edit
                    </button>
                  )}
                  {onToggleStatus && (
                    <button
                      onClick={() => onToggleStatus(role)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: role.is_active ? '#fce4ec' : '#c8e6c9',
                        color: role.is_active ? '#c2185b' : '#2e7d32',
                        border: 'none',
                        borderRadius: AdminBorderRadius.sm,
                        cursor: 'pointer',
                      }}
                      title={role.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {role.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(role)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        border: 'none',
                        borderRadius: AdminBorderRadius.sm,
                        cursor: 'pointer',
                      }}
                      title='Delete Role'
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: AdminSpacing.md,
            marginTop: AdminSpacing.lg,
            padding: AdminSpacing.md,
          }}
        >
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              borderRadius: AdminBorderRadius.sm,
              border: `1px solid ${colors.border}`,
              backgroundColor: currentPage === 1 ? colors.background : 'white',
              color: colors.text.primary,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span style={{ color: colors.text.secondary, fontSize: '14px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 12px',
              borderRadius: AdminBorderRadius.sm,
              border: `1px solid ${colors.border}`,
              backgroundColor: currentPage === totalPages ? colors.background : 'white',
              color: colors.text.primary,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
