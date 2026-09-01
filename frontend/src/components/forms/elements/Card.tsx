// components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-8'
  };

  return (
    <div className={`bg-white ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};