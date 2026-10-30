import React from 'react';
import IndianFlag from './IndianFlag';

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
    dark: 'text-gray-300 bg-[#071324]'
  };

  const borderClass = showBorder ? 'border-t border-gray-200/80' : '';

  return (
    <footer className={`w-full text-xs py-2 mt-auto ${variantClasses[variant]} ${borderClass} ${className} print:hidden`}>
      <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <IndianFlag width={18} height={12} />
          <p className="font-medium">
            &copy; {currentYear} <span className="font-bold text-[#0B1F3A] dark:text-white">Government of Telangana</span> • Home (Police) Department | ALMS
          </p>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-[11px]">
          <span>The Arms Act, 1959</span>
          <span>•</span>
          <span>The Arms Rules, 2016</span>
          <span>•</span>
          <span className="font-mono text-[#D4AF37]">TG Police Node</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
