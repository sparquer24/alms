import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  actionButtonText?: string;
  actionButtonColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  actionButtonText = 'Confirm',
  actionButtonColor = 'bg-blue-500 hover:bg-blue-600'
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${actionButtonColor}`}
          >
            {actionButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
