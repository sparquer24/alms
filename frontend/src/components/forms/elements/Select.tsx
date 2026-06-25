// components/forms/elements/Select.tsx
import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Tooltip-style message shown below when the field is disabled */
  disabledMessage?: string;
  error?: string;
  className?: string;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
}

export const Select: React.FC<SelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  disabledMessage,
  error,
  className = '',
  onFocus,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        disabled={disabled}
        className={`
          block w-full px-0 pb-1 border-0 border-b-2 focus:outline-none focus:ring-0 focus:border-[#6366F1]
          appearance-none
          ${error ? 'border-b-red-500' : 'border-b-gray-300'}
          ${disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-900 cursor-pointer'}
          ${required ? (value ? 'bg-green-50' : 'bg-amber-50') : 'bg-transparent'}
          ${className}
        `}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {disabled && disabledMessage && !error && (
        <p className="text-gray-400 text-xs mt-1">{disabledMessage}</p>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
