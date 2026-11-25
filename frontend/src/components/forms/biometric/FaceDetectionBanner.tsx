import React from 'react';
import { FaceDetectionResult } from '../../../utils/faceDetection';

interface FaceDetectionBannerProps {
  isDetecting: boolean;
  result: FaceDetectionResult | null;
  className?: string;
}

export const FaceDetectionBanner: React.FC<FaceDetectionBannerProps> = ({
  isDetecting,
  result,
  className = '',
}) => {
  if (isDetecting) {
    return (
      <div
        data-testid="face-detection-loading"
        className={`flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2.5 rounded-lg text-xs font-medium animate-pulse ${className}`}
      >
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Analyzing photograph for face detection...</span>
      </div>
    );
  }

  if (!result) return null;

  if (result.status === 'success') {
    return (
      <div
        data-testid="face-detection-success"
        className={`flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 px-3 py-2.5 rounded-lg text-xs font-medium ${className}`}
      >
        <span className="text-sm font-bold text-green-600">✓</span>
        <span>{result.message}</span>
      </div>
    );
  }

  if (result.status === 'warning') {
    return (
      <div
        data-testid="face-detection-warning"
        className={`flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2.5 rounded-lg text-xs font-medium ${className}`}
      >
        <span className="text-sm">⚠️</span>
        <span>{result.message}</span>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div
        data-testid="face-detection-error"
        className={`flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 px-3 py-2.5 rounded-lg text-xs font-medium ${className}`}
      >
        <span>{result.message}</span>
      </div>
    );
  }

  return null;
};
