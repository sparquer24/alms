import React from 'react';

interface SkeletonSectionProps {
  height?: string | number;
  width?: string | number;
  lines?: number;
  style?: React.CSSProperties;
}

export const SkeletonSection: React.FC<SkeletonSectionProps> = ({
  height = 40,
  width = '100%',
  lines = 1,
  style,
}) => {
  return (
    <div style={{ width, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: typeof height === 'number' ? `${height}px` : height,
            width: '100%',
            background: 'linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%)',
            borderRadius: 6,
            marginBottom: 8,
            animation: 'skeleton-loading 1.2s infinite linear',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes skeleton-loading {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SkeletonSection;
