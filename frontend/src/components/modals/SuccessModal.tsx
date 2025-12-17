'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle, X, Sparkles, Award } from 'lucide-react';

// Type assertions for lucide-react icons to fix React 18 compatibility
const CheckCircleFixed = CheckCircle as any;
const XFixed = X as any;
const SparklesFixed = Sparkles as any;
const AwardFixed = Award as any;

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  applicationId?: string;
  onNavigateHome?: () => void;
  autoRedirectSeconds?: number; // If set, auto-redirects after this many seconds
  hideCloseButton?: boolean; // If true, hides the close button
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Success!',
  message = 'Your application has been submitted successfully.',
  applicationId,
  onNavigateHome,
  autoRedirectSeconds,
  hideCloseButton = false,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(autoRedirectSeconds || 0);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay content animation slightly after modal opens
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  // Auto-redirect countdown effect
  useEffect(() => {
    if (isOpen && autoRedirectSeconds && autoRedirectSeconds > 0) {
      setCountdown(autoRedirectSeconds);
      setShouldRedirect(false);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Set flag to trigger redirect in separate effect
            setShouldRedirect(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, autoRedirectSeconds]);

  // Separate effect to handle redirect - avoids setState during render
  useEffect(() => {
    if (shouldRedirect && onNavigateHome) {
      onNavigateHome();
      setShouldRedirect(false);
    }
  }, [shouldRedirect, onNavigateHome]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't allow closing by clicking backdrop if hideCloseButton is true
    if (hideCloseButton) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black transition-opacity duration-300 flex items-center justify-center z-50 ${
        isOpen ? 'bg-opacity-60' : 'bg-opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-gradient-to-br from-white via-green-50 to-emerald-50 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative transform transition-all duration-500 ${
          showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Decorative elements */}
        <div className='absolute top-4 left-4 text-green-200 opacity-50'>
          <SparklesFixed className='w-6 h-6 animate-pulse' />
        </div>
        <div className='absolute top-8 right-8 text-emerald-200 opacity-30'>
          <AwardFixed className='w-5 h-5 animate-pulse' style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Close button - hidden if hideCloseButton is true */}
        {!hideCloseButton && (
          <button
            onClick={onClose}
            className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200 z-10'
            aria-label='Close modal'
          >
            <XFixed className='w-5 h-5' />
          </button>
        )}

        {/* Success icon with animation */}
        <div className='flex justify-center mb-6'>
          <div
            className={`relative transform transition-all duration-700 ${
              showContent ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}
          >
            <div className='w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg'>
              <CheckCircleFixed className='w-12 h-12 text-white drop-shadow-sm' />
            </div>
            {/* Animated ring */}
            <div className='absolute inset-0 w-20 h-20 border-4 border-green-300 rounded-full animate-ping opacity-20'></div>
            <div className='absolute inset-0 w-20 h-20 border-2 border-green-400 rounded-full animate-pulse'></div>
          </div>
        </div>

        {/* Title with gradient text */}
        <h2
          className={`text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3 transform transition-all duration-500 delay-200 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          className={`text-gray-600 text-center mb-6 leading-relaxed transform transition-all duration-500 delay-300 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {message}
        </p>

        {/* Application ID display with enhanced styling */}
        {applicationId && (
          <div
            className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-6 relative overflow-hidden transform transition-all duration-500 delay-400 ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {/* Subtle background pattern */}
            <div className='absolute inset-0 bg-blue-100 opacity-20 transform -skew-y-3'></div>
            <div className='relative z-10'>
              <p className='text-sm font-semibold text-blue-700 text-center mb-2 flex items-center justify-center gap-2'>
                <AwardFixed className='w-4 h-4' />
                Application ID
              </p>
              <p className='text-xl font-mono font-bold text-center text-blue-900 bg-white bg-opacity-50 rounded-lg py-2 px-3 backdrop-blur-sm'>
                {applicationId}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons with enhanced styling */}
        <div
          className={`flex flex-col gap-3 transform transition-all duration-500 delay-500 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {/* Auto-redirect countdown message */}
          {autoRedirectSeconds && countdown > 0 && (
            <div className='text-center text-gray-600 text-sm mb-2'>
              <div className='flex items-center justify-center gap-2'>
                <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                <span>
                  Redirecting to dashboard in <strong>{countdown}</strong> second
                  {countdown !== 1 ? 's' : ''}...
                </span>
              </div>
            </div>
          )}
          {onNavigateHome && !autoRedirectSeconds && (
            <button
              onClick={onNavigateHome}
              className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2'
            >
              <AwardFixed className='w-5 h-5' />
              Go to Back
            </button>
          )}
        </div>

        {/* Confetti effect (optional - can be styled with CSS) */}
        <div className='absolute inset-0 pointer-events-none'>
          <div
            className='absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-bounce opacity-60'
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className='absolute top-16 right-12 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-60'
            style={{ animationDelay: '0.3s' }}
          ></div>
          <div
            className='absolute bottom-20 left-8 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60'
            style={{ animationDelay: '0.5s' }}
          ></div>
          <div
            className='absolute bottom-24 right-6 w-2 h-2 bg-green-400 rounded-full animate-bounce opacity-60'
            style={{ animationDelay: '0.7s' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
