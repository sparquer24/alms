// components/ui/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'gold' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-[#0B1F3A] text-white hover:bg-[#15325B] focus-visible:ring-[#D4AF37] shadow-xs',
    gold: 'bg-[#D4AF37] text-[#0B1F3A] hover:bg-[#B89628] font-bold focus-visible:ring-[#0B1F3A] shadow-xs',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus-visible:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-[#0B1F3A]'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
    lg: 'px-5 py-2.5 text-sm sm:text-base'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? disabledClasses : ''}
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
