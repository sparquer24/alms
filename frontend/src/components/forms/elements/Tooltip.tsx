import React from 'react';



const Tooltip: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <span className="relative group inline-block">
    {children}
    <span className="absolute left-1/2 translate-x-[-50%] top-full mt-1 w-max px-2 py-1 text-xs text-white bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
      {title}
    </span>
  </span>
);

export default Tooltip;
