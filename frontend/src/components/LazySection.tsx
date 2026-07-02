'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  minHeight?: string;
}

export function LazySection({ children, fallback, rootMargin = '300px', minHeight = '200px' }: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If it's already visible, no need to observe again
    if (isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { rootMargin }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? children : (fallback || <div className="w-full h-full min-h-[200px] animate-pulse bg-slate-100 rounded-xl" />)}
    </div>
  );
}
