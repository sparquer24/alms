'use client';
import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  X,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  applicationId?: string;
  acknowledgementNo?: string;
  onNavigateHome?: () => void;
  autoRedirectSeconds?: number; // If set, auto-redirects after this many seconds
  hideCloseButton?: boolean; // If true, hides the close button
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Application Submitted Successfully!',
  message = 'Your fresh arms license application has been successfully submitted and forwarded to the licensing authority for verification.',
  applicationId,
  acknowledgementNo,
  onNavigateHome,
  autoRedirectSeconds = 6,
  hideCloseButton = false,
}) => {
  const [countdown, setCountdown] = useState(autoRedirectSeconds || 0);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-redirect countdown effect
  useEffect(() => {
    if (isOpen && autoRedirectSeconds && autoRedirectSeconds > 0) {
      setCountdown(autoRedirectSeconds);
      setShouldRedirect(false);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setShouldRedirect(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, autoRedirectSeconds]);

  // Handle redirect navigation
  useEffect(() => {
    if (shouldRedirect && onNavigateHome) {
      onNavigateHome();
      setShouldRedirect(false);
    }
  }, [shouldRedirect, onNavigateHome]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (hideCloseButton) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopyAck = async () => {
    const textToCopy = acknowledgementNo || applicationId;
    if (!textToCopy) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all duration-300'
      onClick={handleBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby='success-modal-title'
    >
      <div className='relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95'>
        {/* Navy & Gold ALMS Top Stripe */}
        <div className='h-2 w-full bg-gradient-to-r from-[#0B1F3A] via-[#1E3A8A] to-[#D4AF37]' />

        {/* Close button */}
        {!hideCloseButton && (
          <button
            onClick={onClose}
            className='absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full p-1.5 transition-all duration-150 z-10'
            aria-label='Close modal'
          >
            <X className='w-5 h-5' />
          </button>
        )}

        <div className='p-6 sm:p-8 space-y-6 text-center'>
          {/* Polished Checkmark Badge */}
          <div className='w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner'>
            <CheckCircle2 className='w-10 h-10 sm:w-12 sm:h-12 text-emerald-600' />
          </div>

          {/* Heading & Subtitle */}
          <div className='space-y-2'>
            <h2
              id='success-modal-title'
              className='text-2xl sm:text-3xl font-black text-[#0B1F3A] tracking-tight'
            >
              {title}
            </h2>
            <p className='text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto'>
              {message}
            </p>
          </div>

          {/* Acknowledgement & Application Details Card */}
          {(acknowledgementNo || applicationId) && (
            <div className='bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3 shadow-2xs'>
              {acknowledgementNo && (
                <div>
                  <div className='flex items-center justify-between mb-1.5'>
                    <span className='text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5'>
                      <FileText className='w-3.5 h-3.5 text-[#0B1F3A]' />
                      Acknowledgement Number
                    </span>
                    <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200'>
                      Submitted
                    </span>
                  </div>
                  <div className='flex items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-2xs'>
                    <span className='font-mono font-bold text-base sm:text-lg text-[#0B1F3A] tracking-wider select-all break-all'>
                      {acknowledgementNo}
                    </span>
                    <button
                      type='button'
                      onClick={handleCopyAck}
                      className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-md transition-all duration-150 flex-shrink-0'
                      title='Copy to clipboard'
                    >
                      {copied ? (
                        <>
                          <Check className='w-3.5 h-3.5 text-emerald-600' />
                          <span className='text-emerald-700 font-bold'>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className='w-3.5 h-3.5' />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {applicationId && (
                <div className='flex items-center justify-between pt-1 border-t border-slate-200/70 text-xs text-slate-500'>
                  <span>Application Reference ID:</span>
                  <span className='font-mono font-bold text-slate-800'>
                    #{applicationId}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Next Steps Guidance Panel */}
          <div className='bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-left text-xs text-slate-600 space-y-1.5'>
            <div className='font-bold text-[#0B1F3A] flex items-center gap-1.5 text-xs uppercase tracking-wide'>
              <ShieldCheck className='w-4 h-4 text-[#0B1F3A]' />
              <span>What Happens Next?</span>
            </div>
            <ul className='list-disc list-inside space-y-1 text-slate-600 pl-1'>
              <li>Your submission is recorded and queued for verification under the Arms Act, 1959.</li>
              <li>Local police and background checks will be initiated by the licensing office.</li>
              <li>Track real-time status anytime on your ALMS portal with your Acknowledgement No.</li>
            </ul>
          </div>

          {/* Actions & Redirect countdown */}
          <div className='space-y-3 pt-1'>
            {autoRedirectSeconds && countdown > 0 && (
              <div className='flex items-center justify-center gap-2 text-xs text-slate-500'>
                <Clock className='w-3.5 h-3.5 text-[#0B1F3A] animate-pulse' />
                <span>
                  Redirecting to dashboard in{' '}
                  <strong className='font-bold text-[#0B1F3A]'>{countdown}</strong>{' '}
                  second{countdown !== 1 ? 's' : ''}...
                </span>
              </div>
            )}

            <button
              type='button'
              onClick={onNavigateHome || onClose}
              className='w-full bg-[#0B1F3A] hover:bg-[#15325B] active:bg-[#071527] text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F3A] focus-visible:ring-offset-2'
            >
              <span>Go to Dashboard</span>
              <ArrowRight className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
