import React from 'react';
import { DocumentValidationStatus } from '../../../services/documentValidationService';

interface DocumentValidationBadgeProps {
  status?: DocumentValidationStatus | null;
  isValidating?: boolean;
  confidence?: number;
  detectedType?: string;
  expectedType?: string;
  message?: string;
  className?: string;
}

export const DocumentValidationBadge: React.FC<DocumentValidationBadgeProps> = ({
  status,
  isValidating = false,
  confidence,
  detectedType,
  expectedType,
  message,
  className = '',
}) => {
  if (isValidating) {
    return (
      <div
        className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md text-xs bg-blue-50 border border-blue-200 text-blue-700 animate-pulse ${className}`}
      >
        <svg
          className="animate-spin h-3.5 w-3.5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Validating document content (OCR &amp; classification)...</span>
      </div>
    );
  }

  if (!status) return null;

  switch (status) {
    case 'DOCUMENT_ACCEPTED':
      return (
        <div
          className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md text-xs bg-green-50 border border-green-300 text-green-800 ${className}`}
        >
          <span className="text-green-600 font-bold">✓</span>
          <div>
            <span className="font-semibold">Document Accepted:</span>{' '}
            <span>{detectedType || expectedType || 'Verified'}</span>
            {confidence !== undefined && (
              <span className="text-green-600 ml-1">
                (Confidence: {Math.round(confidence * 100)}%)
              </span>
            )}
          </div>
        </div>
      );

    case 'DOCUMENT_MISMATCH':
      return (
        <div
          className={`flex items-start gap-2 mt-2 px-3 py-2 rounded-md text-xs bg-red-50 border border-red-300 text-red-800 ${className}`}
        >
          <span className="text-red-600 font-bold text-sm leading-none">⚠️</span>
          <div>
            <div className="font-semibold text-red-700">Document Mismatch</div>
            <div>{message || `Expected ${expectedType} but detected ${detectedType}. Please upload the correct document.`}</div>
          </div>
        </div>
      );

    case 'REVIEW_REQUIRED':
      return (
        <div
          className={`flex items-start gap-2 mt-2 px-3 py-2 rounded-md text-xs bg-amber-50 border border-amber-300 text-amber-800 ${className}`}
        >
          <span className="text-amber-600 font-bold text-sm leading-none">ℹ️</span>
          <div>
            <div className="font-semibold text-amber-700">Review Required</div>
            <div>{message || 'Document identification confidence is low. Please ensure scan is clear and legible.'}</div>
          </div>
        </div>
      );

    case 'UNREADABLE':
      return (
        <div
          className={`flex items-start gap-2 mt-2 px-3 py-2 rounded-md text-xs bg-amber-50 border border-amber-300 text-amber-800 ${className}`}
        >
          <span className="text-amber-600 font-bold text-sm leading-none">⚠️</span>
          <div>
            <div className="font-semibold text-amber-700">Unreadable Document</div>
            <div>{message || 'Unable to extract legible text from this file. Please upload a clearer scan.'}</div>
          </div>
        </div>
      );

    case 'INVALID_FILE':
      return (
        <div
          className={`flex items-start gap-2 mt-2 px-3 py-2 rounded-md text-xs bg-red-50 border border-red-300 text-red-800 ${className}`}
        >
          <span className="text-red-600 font-bold text-sm leading-none">❌</span>
          <div>
            <div className="font-semibold text-red-700">Invalid File</div>
            <div>{message || 'Unsupported format or corrupted file. Allowed: PDF, JPG, PNG.'}</div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
