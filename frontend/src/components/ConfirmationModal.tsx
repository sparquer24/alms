import React, { useEffect, useRef, useState } from 'react';

type Tone = 'default' | 'danger';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** May return a promise; the modal stays open with a spinner until it settles. */
  onConfirm: () => void | Promise<unknown>;
  title: string;
  message: React.ReactNode;
  actionButtonText?: string;
  /** Tailwind classes for the confirm button; overrides the tone colour when given. */
  actionButtonColor?: string;
  cancelButtonText?: string;
  /** 'danger' uses red styling and focuses Cancel first, for irreversible actions. */
  tone?: Tone;
  /** Short line under the title, e.g. the application being actioned. */
  subtitle?: React.ReactNode;
}

const TONE_STYLES: Record<Tone, { iconBg: string; iconText: string; button: string }> = {
  default: {
    iconBg: 'bg-[#0B1F3A]/10',
    iconText: 'text-[#0B1F3A]',
    button: 'bg-[#0B1F3A] hover:bg-[#15325B] focus-visible:ring-[#0B1F3A]',
  },
  danger: {
    iconBg: 'bg-red-50',
    iconText: 'text-red-700',
    button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
  },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  actionButtonText = 'Confirm',
  actionButtonColor,
  cancelButtonText = 'Cancel',
  tone = 'default',
  subtitle,
}) => {
  const [isBusy, setIsBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const toneStyle = TONE_STYLES[tone];

  // Escape closes, initial focus, and no background scrolling while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (tone === 'danger' ? cancelRef : confirmRef).current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isBusy, onClose, tone]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    try {
      await onConfirm();
    } finally {
      setIsBusy(false);
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirmation-modal-title'
    >
      <div
        className='fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]'
        onClick={isBusy ? undefined : onClose}
      />

      <div className='relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200'>
        <div className='flex items-start gap-4 px-6 pt-6'>
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${toneStyle.iconBg}`}
          >
            <svg
              className={`h-5 w-5 ${toneStyle.iconText}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              {tone === 'danger' ? (
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
                />
              ) : (
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              )}
            </svg>
          </div>
          <div className='min-w-0 flex-1'>
            <h3 id='confirmation-modal-title' className='text-lg font-semibold text-slate-900'>
              {title}
            </h3>
            {subtitle && <p className='mt-0.5 text-xs text-slate-500'>{subtitle}</p>}
          </div>
          <button
            type='button'
            onClick={onClose}
            disabled={isBusy}
            className='-mr-2 -mt-2 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors'
            aria-label='Close'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='max-h-[60vh] overflow-y-auto px-6 py-4 text-slate-700 text-sm'>{message}</div>

        <div className='flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3.5 sm:flex-row sm:justify-end'>
          <button
            ref={cancelRef}
            type='button'
            onClick={onClose}
            disabled={isBusy}
            className='rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 transition-colors'
          >
            {cancelButtonText}
          </button>
          <button
            ref={confirmRef}
            type='button'
            onClick={handleConfirm}
            disabled={isBusy}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm transition-colors ${
              actionButtonColor || toneStyle.button
            }`}
          >
            {isBusy && (
              <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white' />
            )}
            {isBusy ? 'Please wait…' : actionButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
