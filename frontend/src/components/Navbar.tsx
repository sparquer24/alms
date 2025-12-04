import React from 'react';
import Link from 'next/link';

// Type assertion for Next.js Link to fix React 18 compatibility
const LinkFixed = Link as any;

const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-600 p-4 shadow-md" role="navigation" aria-label="Main Navigation">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          <LinkFixed href="/">ALMS</LinkFixed>
        </div>
        <ul className="flex space-x-4">
          <li>
            <LinkFixed href="/dashboard" className="text-white hover:underline">
              Dashboard
            </LinkFixed>
          </li>
          <li>
            <LinkFixed href="/applications" className="text-white hover:underline">
              Applications
            </LinkFixed>
          </li>
          <li>
            <LinkFixed href="/reports" className="text-white hover:underline">
              Reports
            </LinkFixed>
          </li>
          <li>
            <LinkFixed href="/settings" className="text-white hover:underline">
              Settings
            </LinkFixed>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;