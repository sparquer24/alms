import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  AdminBorderRadius,
  AdminShadows,
  AdminSpacing,
  AdminComponentSizes,
} from '../../styles/admin-design-system';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  width?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const AdminTable = React.forwardRef<HTMLDivElement, AdminTableProps<any>>(
  (
    {
      columns,
      data,
      rowKey,
      onRowClick,
      loading = false,
      emptyMessage = 'No data available',
      className = '',
    },
    ref
  ) => {
    const { colors } = useAdminTheme();

    return (
      <div
        ref={ref}
        className={className}
        style={{
          borderRadius: AdminBorderRadius.lg,
          overflow: 'hidden',
          boxShadow: AdminShadows.md,
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: colors.surface,
            }}
          >
            <thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: colors.background,
              }}
            >
              <tr
                style={{
                  backgroundColor: colors.background,
                  borderBottom: `1px solid ${colors.border}`,
                  height: AdminComponentSizes.table.headerHeight,
                }}
              >
                {columns.map((col, idx) => (
                  <th
                    key={`header-${idx}-${col.header}`}
                    style={{
                      padding: AdminComponentSizes.table.cellPadding,
                      textAlign: 'left',
                      color: colors.text.secondary,
                      fontWeight: 600,
                      fontSize: '14px',
                      width: col.width,
                      position: idx === 0 ? 'sticky' : undefined,
                      left: idx === 0 ? 0 : undefined,
                      backgroundColor: colors.background,
                      zIndex: idx === 0 ? 2 : 1,
                      boxShadow: idx === 0 ? '2px 0 0 rgba(0,0,0,0.05)' : undefined,
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: AdminSpacing['2xl'],
                      textAlign: 'center',
                      color: colors.text.secondary,
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: AdminSpacing['2xl'],
                      textAlign: 'center',
                      color: colors.text.secondary,
                    }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => (
                  <tr
                    key={String(row[rowKey])}
                    onClick={() => onRowClick?.(row)}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      height: AdminComponentSizes.table.rowHeight,
                      cursor: onRowClick ? 'pointer' : 'default',
                      backgroundColor: rowIdx % 2 === 0 ? colors.surface : colors.background,
                      transition: `background-color 150ms`,
                    }}
                    onMouseEnter={e => {
                      if (onRowClick) {
                        e.currentTarget.style.backgroundColor = colors.hover;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = rowIdx % 2 === 0 ? colors.surface : colors.background;
                    }}
                  >
                    {columns.map((col, idx) => (
                      <td
                        key={`cell-${idx}-${String(col.key)}`}
                        style={{
                          padding: AdminComponentSizes.table.cellPadding,
                          color: colors.text.primary,
                          fontSize: '14px',
                          width: col.width,
                          position: idx === 0 ? 'sticky' : undefined,
                          left: idx === 0 ? 0 : undefined,
                          backgroundColor: rowIdx % 2 === 0 ? colors.surface : colors.background,
                          zIndex: idx === 0 ? 1 : 0,
                          boxShadow: idx === 0 ? '2px 0 0 rgba(0,0,0,0.05)' : undefined,
                        }}
                      >
                        {col.render ? col.render(row[col.key], row, rowIdx) : String(row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    );
  }
);

AdminTable.displayName = 'AdminTable';
