import React from 'react';
import { createPortal } from 'react-dom';

interface WarningAlertModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  alertMessage: React.ReactNode;
  description?: React.ReactNode;
  onBackdropClick?: () => void;
  actions: React.ReactNode;
}

export const WarningAlertModal: React.FC<WarningAlertModalProps> = ({
  isOpen,
  title,
  subtitle,
  alertMessage,
  description,
  onBackdropClick,
  actions,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4'
      onClick={onBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby='warning-alert-modal-title'
    >
      <div
        className='bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5'>
          <div className='flex items-center gap-4'>
            <div className='bg-white/20 rounded-full p-3'>
              <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <div>
              <h2 id='warning-alert-modal-title' className='text-xl font-bold text-white'>
                {title}
              </h2>
              {subtitle && <p className='text-amber-100 text-sm mt-1'>{subtitle}</p>}
            </div>
          </div>
        </div>
        <div className='px-6 py-6'>
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4'>
            <div className='whitespace-pre-line text-amber-800 text-sm'>{alertMessage}</div>
          </div>
          {description && <p className='text-gray-600 text-sm'>{description}</p>}
        </div>
        <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3'>
          {actions}
        </div>
      </div>
    </div>,
    document.body,
  );
};
