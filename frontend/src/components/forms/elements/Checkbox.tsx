// components/ui/Checkbox.tsx
import React from 'react';

interface CheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
  required = false,
  error,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="flex items-start space-x-3">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 text-[#6366F1] focus:ring-[#6366F1] border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {error && <p className="text-red-500 text-xs mt-1 ml-7">{error}</p>}
    </div>
  );
};