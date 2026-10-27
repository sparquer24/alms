// components/forms/elements/Select.tsx
'use client';

import React, { useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
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
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  helpText?: string;
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
  onBlur,
  helpText,
}) => {
  const [touched, setTouched] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');

  const validateSelect = (val: string): string => {
    if (required && !val?.trim()) {
      return `${label || 'This field'} is required.`;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (touched) {
      setLocalError(validateSelect(e.target.value));
    }
    onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setTouched(true);
    setLocalError(validateSelect(e.target.value));
    if (onBlur) {
      onBlur(e);
    }
  };

  const displayError = error || (touched ? localError : '');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-gray-700 tracking-wide mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            block w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm bg-white
            border transition-all duration-150 outline-none appearance-none
            ${
              displayError
                ? 'border-red-500 bg-red-50/20 text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-300 hover:border-gray-400 focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/20'
            }
            ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'text-gray-900 cursor-pointer'}
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

        {/* Custom Chevron Down Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {disabled && disabledMessage && !displayError && (
        <p className="text-gray-400 text-xs mt-1">{disabledMessage}</p>
      )}

      {helpText && !disabledMessage && !displayError && (
        <p className="text-gray-500 text-[11px] mt-1">{helpText}</p>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1.5 animate-fadeIn">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
