import React from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-600 p-4 shadow-md" role="navigation" aria-label="Main Navigation">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          <Link href="/">ALMS</Link>
        </div>
        <ul className="flex space-x-4">
          <li>
            <Link href="/dashboard" className="text-white hover:underline">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/applications" className="text-white hover:underline">
              Applications
            </Link>
          </li>
          <li>
            <Link href="/reports" className="text-white hover:underline">
              Reports
            </Link>
          </li>
          <li>
            <Link href="/settings" className="text-white hover:underline">
              Settings
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;