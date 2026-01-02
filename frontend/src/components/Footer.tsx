import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200 mt-auto">
      <p>&copy; {currentYear} ALMS - Arms License Management System. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
