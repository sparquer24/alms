'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeApi } from '../config/APIClient';

interface QRCodeDisplayProps {
  applicationId: number | string;
  userRole?: string;
  className?: string;
}

/**
 * QR Code Display Component
 * Shows QR code for an application - only visible to ZS role users
 * The QR code contains a public URL that can be scanned to view application details
 */
export default function QRCodeDisplay({
  applicationId,
  userRole,
  className = '',
}: QRCodeDisplayProps) {
  const [qrCodeData, setQrCodeData] = useState<{
    qrCodeDataUrl: string;
    publicUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canGenerate, setCanGenerate] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Check if user can generate QR code on mount
  useEffect(() => {
    const checkPermission = async () => {
      // Quick check: only ZS role should see the button
      if (userRole !== 'ZS') {
        setCanGenerate(false);
        return;
      }

      try {
        const response = await QRCodeApi.checkPermission(applicationId);
        if (response.success && (response as any).data?.canGenerate) {
          setCanGenerate(true);
        }
      } catch (err) {
        console.error('Error checking QR code permission:', err);
        setCanGenerate(false);
      }
    };

    checkPermission();
  }, [applicationId, userRole]);

  const handleGenerateQRCode = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await QRCodeApi.generate(applicationId);
      if (response.success && (response as any).data) {
        setQrCodeData({
          qrCodeDataUrl: (response as any).data.qrCodeDataUrl,
          publicUrl: (response as any).data.publicUrl,
        });
        setShowQRCode(true);
      } else {
        setError('Failed to generate QR code');
      }
    } catch (err: any) {
      console.error('Error generating QR code:', err);
      setError(err?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeData?.qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeData.qrCodeDataUrl;
    link.download = `application-${applicationId}-qrcode.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPublicUrl = async () => {
    if (!qrCodeData?.publicUrl) return;

    try {
      await navigator.clipboard.writeText(qrCodeData.publicUrl);
      // Show a brief success message
      const button = document.getElementById('copy-url-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Don't render anything if user doesn't have permission
  if (!canGenerate && !showQRCode) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
            />
          </svg>
          QR Code
        </h3>
        {!showQRCode && canGenerate && (
          <span className='text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded'>ZS Only</span>
        )}
      </div>

      {error && (
        <div className='mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm'>
          {error}
        </div>
      )}

      {!showQRCode ? (
        <button
          onClick={handleGenerateQRCode}
          disabled={loading || !canGenerate}
          className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium'
        >
          {loading ? (
            <>
              <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
                />
              </svg>
              Generate QR Code
            </>
          )}
        </button>
      ) : (
        <div className='space-y-3'>
          {/* QR Code Image */}
          <div className='flex justify-center p-4 bg-gray-50 rounded-lg'>
            {qrCodeData?.qrCodeDataUrl && (
              <img src={qrCodeData.qrCodeDataUrl} alt='Application QR Code' className='w-48 h-48' />
            )}
          </div>

          {/* Public URL Display */}
          <div className='p-2 bg-gray-50 rounded border text-xs text-gray-600 break-all'>
            {qrCodeData?.publicUrl}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2'>
            <button
              onClick={handleDownloadQRCode}
              className='flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                />
              </svg>
              Download
            </button>
            <button
              id='copy-url-btn'
              onClick={handleCopyPublicUrl}
              className='flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                />
              </svg>
              Copy URL
            </button>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={handleGenerateQRCode}
            disabled={loading}
            className='w-full text-sm text-blue-600 hover:text-blue-800 py-1'
          >
            {loading ? 'Regenerating...' : 'Regenerate QR Code'}
          </button>
        </div>
      )}

      {/* Help Text */}
      <p className='mt-3 text-xs text-gray-500'>
        Scan this QR code to view public application details. The link does not require
        authentication.
      </p>
    </div>
  );
}
