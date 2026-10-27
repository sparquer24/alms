// components/forms/elements/Input.tsx
'use client';

import React, { useState } from 'react';

export interface InputProps {
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  maxLength?: number;
  max?: string;
  min?: string;
  /** Restrict input strictly to alphabetic letters and spaces */
  textOnly?: boolean;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  disabled = false,
  readOnly = false,
  className = '',
  maxLength,
  max,
  min,
  textOnly = false,
  helpText,
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [touched, setTouched] = useState<boolean>(false);

  // Validate value against type and constraints
  const validateValue = (val: string): string => {
    const trimmed = typeof val === 'string' ? val.trim() : '';

    if (required && !trimmed) {
      return `${label || 'This field'} is required.`;
    }
    if (!trimmed) return '';

    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address (e.g. name@example.com).';
      }
    } else if (type === 'tel') {
      if (!/^\d+$/.test(trimmed)) {
        return 'Phone number must contain digits only.';
      }
      if (maxLength === 10) {
        if (trimmed.length !== 10) {
          return 'Mobile number must be exactly 10 digits.';
        }
        if (!/^[6-9]/.test(trimmed)) {
          return 'Mobile number must start with 6, 7, 8, or 9.';
        }
      } else if (trimmed.length < 10) {
        return 'Phone number must be at least 10 digits.';
      } else if (trimmed.length > 15) {
        return 'Phone number cannot exceed 15 digits.';
      }
    } else if (type === 'number') {
      if (isNaN(Number(trimmed))) {
        return 'Please enter a valid number.';
      }
    } else if (type === 'date') {
      if (max && trimmed > max) {
        return 'Date cannot be in the future.';
      }
      if (min && trimmed < min) {
        return `Date cannot be earlier than ${min}.`;
      }
    } else if (type === 'text') {
      if (typeof val === 'string' && val.startsWith(' ')) {
        return 'Input cannot start with a space.';
      }
      if (textOnly && !/^[A-Za-z\s]*$/.test(trimmed)) {
        return 'Only letters and spaces are allowed.';
      }
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    // Filter characters per input type in real time
    if (type === 'tel') {
      inputVal = inputVal.replace(/\D/g, '');
      e.target.value = inputVal;
    } else if (type === 'email') {
      inputVal = inputVal.replace(/\s/g, '');
      e.target.value = inputVal;
    } else if (textOnly) {
      inputVal = inputVal.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ');
      e.target.value = inputVal;
    }

    if (touched) {
      const err = validateValue(inputVal);
      setLocalError(err);
    }
    onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    const err = validateValue(e.target.value);
    setLocalError(err);
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
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          max={max}
          min={min}
          suppressHydrationWarning
          className={`
            block w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-900 bg-white
            border transition-all duration-150 outline-none
            placeholder:text-gray-400
            ${
              displayError
                ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-300 hover:border-gray-400 focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/20'
            }
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : ''}
            ${readOnly ? 'bg-gray-50 text-gray-600 cursor-default border-gray-200' : ''}
            ${className}
          `}
        />
      </div>
      {helpText && !displayError && (
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

// TextArea Component
export interface TextAreaProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  className?: string;
  maxLength?: number;
  helpText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  disabled = false,
  readOnly = false,
  rows = 3,
  className = '',
  maxLength,
  helpText,
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [touched, setTouched] = useState<boolean>(false);

  const validateText = (val: string): string => {
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (required && !trimmed) {
      return `${label || 'This field'} is required.`;
    }
    if (typeof val === 'string' && val.startsWith(' ')) {
      return 'Input cannot start with a space.';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (touched) {
      setLocalError(validateText(e.target.value));
    }
    onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(true);
    setLocalError(validateText(e.target.value));
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
      <textarea
        id={name}
        name={name}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        className={`
          block w-full rounded-lg p-3 text-sm text-gray-900 bg-white
          border transition-all duration-150 outline-none
          placeholder:text-gray-400
          ${
            displayError
              ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 hover:border-gray-400 focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/20'
          }
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : ''}
          ${readOnly ? 'bg-gray-50 text-gray-600 cursor-default border-gray-200' : ''}
          ${className}
        `}
      />
      {helpText && !displayError && (
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
