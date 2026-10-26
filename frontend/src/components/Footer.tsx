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

  const variantClasses = {
    default: 'text-gray-500 bg-[#F3F5F8]',
    light: 'text-gray-500 bg-white',
    dark: 'text-gray-400 bg-[#0B1F3A]'
  };

  const borderClass = showBorder ? 'border-t border-gray-200/80' : '';

  return (
    <footer className={`w-full text-center text-xs py-3 mt-auto ${variantClasses[variant]} ${borderClass} ${className} print:hidden`}>
      <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-gray-600 font-medium">
          &copy; {currentYear} <span className="font-bold text-[#0B1F3A]">ALMS</span> — Arms License Management System. by Sparquer AI.
        </p>
        <div className="flex items-center gap-3 text-gray-400 text-[11px]">
          <span>Security &amp; Compliance Verified</span>
          <span>•</span>
          <span className="font-mono">v1.2-enterprise</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
