"use client";

import React from "react";

interface IndianFlagProps {
  className?: string;
  width?: number;
  height?: number;
  rounded?: boolean;
}

/**
 * High-precision Indian National Flag (Tiranga) SVG
 * Ratio 3:2 with 24-spoke Ashoka Chakra in Navy Blue (#000080)
 */
export default function IndianFlag({
  className = "h-4 w-6",
  width = 24,
  height = 16,
  rounded = true,
}: IndianFlagProps) {
  // Generate 24 spokes for the Ashoka Chakra
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24;
    return (
      <line
        key={i}
        x1="18"
        y1="12"
        x2="18"
        y2="8.8"
        stroke="#000080"
        strokeWidth="0.35"
        transform={`rotate(${angle} 18 12)`}
      />
    );
  });

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 24"
      width={width}
      height={height}
      className={`${className} ${rounded ? "rounded-[2px] shadow-sm" : ""} shrink-0 inline-block align-middle overflow-hidden border border-black/10`}
      aria-label="Flag of India"
      role="img"
    >
      {/* Saffron Top Band */}
      <rect width="36" height="8" fill="#FF9933" />

      {/* White Middle Band */}
      <rect y="8" width="36" height="8" fill="#FFFFFF" />

      {/* India Green Bottom Band */}
      <rect y="16" width="36" height="8" fill="#138808" />

      {/* Ashoka Chakra (Navy Blue #000080) */}
      <g>
        {/* Outer Ring */}
        <circle cx="18" cy="12" r="3.2" fill="none" stroke="#000080" strokeWidth="0.55" />
        {/* Inner Hub */}
        <circle cx="18" cy="12" r="0.75" fill="#000080" />
        {/* 24 Spokes */}
        {spokes}
      </g>
    </svg>
  );
}
