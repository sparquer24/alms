import React from "react";

export const HamburgerButton = ({ onClick, open }: { onClick: () => void; open: boolean }) => (
  <button
    className="md:hidden p-2 focus:outline-none"
    aria-label="Toggle sidebar"
    aria-expanded={open}
    onClick={onClick}
  >
    <span
      className={`block w-6 h-0.5 bg-gray-800 mb-1 transition-transform ${
        open ? 'transform rotate-45 translate-y-1.5' : ''
      }`}
    />
    <span
      className={`block w-6 h-0.5 bg-gray-800 mb-1 transition-opacity ${
        open ? 'opacity-0' : ''
      }`}
    />
    <span
      className={`block w-6 h-0.5 bg-gray-800 transition-transform ${
        open ? 'transform -rotate-45 -translate-y-1.5' : ''
      }`}
    />
  </button>
);
