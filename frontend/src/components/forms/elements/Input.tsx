// components/ui/Input.tsx
import React from 'react';

interface InputProps {
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
}) => {
  // Determine background based on required and filled state
  const fieldBg = required
    ? (value?.trim() ? 'bg-emerald-50/60' : 'bg-amber-50/60')
    : 'bg-transparent';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        max={max}
        suppressHydrationWarning
        className={`
          block w-full px-0 pb-1 border-0 border-b-2 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-[#0B1F3A]
          border-b-gray-300 transition-colors
          ${disabled ? 'bg-transparent cursor-not-allowed opacity-60' : fieldBg}
          ${readOnly ? 'bg-gray-50 cursor-default text-gray-500' : ''}
          ${className}
        `}
      />
      {error && <p className="text-red-600 text-[11px] font-medium mt-1">{error}</p>}
    </div>
  );
};

// TextArea Component
interface TextAreaProps {
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
}) => {
  const fieldBg = required
    ? (value?.trim() ? 'bg-emerald-50/50' : 'bg-amber-50/50')
    : 'bg-white';

  return (
    <div>
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        className={`
          block w-full p-2.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:border-[#0B1F3A]
          border-gray-300 transition-colors
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : fieldBg}
          ${readOnly ? 'bg-gray-50 cursor-default text-gray-500' : ''}
          ${className}
        `}
      />
      {error && <p className="text-red-600 text-[11px] font-medium mt-1">{error}</p>}
    </div>
  );
};
