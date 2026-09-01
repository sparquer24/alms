import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { AdminFilters, AdminBorderRadius, AdminSpacing } from '../../styles/admin-design-system';

interface FilterOption {
  value: string;
  label: string;
}

interface AdminFilterProps {
  filters: {
    [key: string]: {
      value: string;
      label: string;
      type: 'text' | 'select' | 'date';
      placeholder?: string;
      options?: FilterOption[];
      showLabel?: boolean;
      onChange: (value: string) => void;
    };
  };
  onClear?: () => void;
  className?: string;
  showBorder?: boolean;
  compact?: boolean;
}

export const AdminFilter: React.FC<AdminFilterProps> = ({
  filters,
  onClear,
  className = '',
  showBorder = true,
  compact = false,
}) => {
  const { colors } = useAdminTheme();
  const filterKeys = Object.keys(filters);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: compact ? '8px' : AdminFilters.containerGap,
        padding: compact ? '6px 10px' : AdminFilters.containerPadding,
        backgroundColor: colors.surface,
        borderRadius: AdminBorderRadius.lg,
        border: showBorder ? `1px solid ${colors.border}` : 'none',
        alignItems: 'center',
      }}
    >
      {filterKeys.map(key => {
        const filter = filters[key];
        const commonInputStyles = {
          padding: compact ? '8px 10px' : '10px 12px',
          borderRadius: AdminBorderRadius.md,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          color: colors.text.primary,
          fontSize: '14px',
          height: compact ? '36px' : AdminFilters.inputHeight,
          fontFamily: 'inherit',
        };

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: compact ? '6px' : AdminSpacing.sm }}>
            {filter.type === 'text' && (
              <input
                type='text'
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={e => filter.onChange(e.target.value)}
                style={commonInputStyles}
              />
            )}

            {filter.type === 'select' && (
              <select
                value={filter.value}
                onChange={e => filter.onChange(e.target.value)}
                style={commonInputStyles}
              >
                {filter.showLabel !== false && <option value=''>{filter.label}</option>}
                {filter.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {filter.type === 'date' && (
              <input
                type='date'
                value={filter.value}
                onChange={e => filter.onChange(e.target.value)}
                style={commonInputStyles}
              />
            )}
          </div>
        );
      })}

      {onClear && (
        <button
          onClick={onClear}
          style={{
            padding: '10px 16px',
            borderRadius: AdminBorderRadius.md,
            border: `1px solid ${colors.border}`,
            backgroundColor: 'transparent',
            color: colors.text.secondary,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 150ms',
            marginLeft: 'auto',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = colors.hover;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
