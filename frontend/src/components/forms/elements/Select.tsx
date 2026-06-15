import React, { useState, useEffect } from 'react';

interface SelectOption {
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
  error?: string;
  disabled?: boolean;
  className?: string;
  disabledMessage?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  disabledMessage,
}) => {
  const [showDisabledMessage, setShowDisabledMessage] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showDisabledMessage) {
      timeout = setTimeout(() => setShowDisabledMessage(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showDisabledMessage]);

  const handleClick = () => {
    if (disabled && disabledMessage) {
      setShowDisabledMessage(true);
    }
  };

  return (
    <div className="w-full relative" onClick={handleClick}>
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
        disabled={disabled}
        className={`
          block w-full px-0 pb-1 border-0 border-b-2 focus:outline-none focus:ring-0 focus:border-[#6366F1]
          ${error || showDisabledMessage ? 'border-b-red-500' : 'border-b-gray-300'}
          ${disabled ? 'bg-transparent cursor-not-allowed pointer-events-none' : 'bg-transparent'}
          ${className}
        `}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && !showDisabledMessage && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {showDisabledMessage && <p className="text-red-500 text-xs mt-1">{disabledMessage}</p>}
    </div>
  );
};