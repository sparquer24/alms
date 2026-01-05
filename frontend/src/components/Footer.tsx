import React from 'react';

interface FooterProps {
  className?: string;
  showBorder?: boolean;
  variant?: 'default' | 'light' | 'dark';
}

const Footer: React.FC<FooterProps> = ({ 
  className = '', 
  showBorder = true,
  variant = 'default'
}) => {
  const currentYear = new Date().getFullYear();

  const baseClasses = 'w-full text-center text-sm mt-8';
  
  const variantClasses = {
    default: 'text-gray-600 bg-gray-50',
    light: 'text-gray-500 bg-white',
    dark: 'text-gray-300 bg-gray-900'
  };

  const borderClass = showBorder ? 'border-t border-gray-200' : '';

  return (
    <footer className={`${baseClasses} ${variantClasses[variant]} ${borderClass} ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-sm">
          &copy; {currentYear} ALMS - Arms License Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
