import React, { useState, useMemo } from 'react';
import { ApplicationData } from '../config/mockData';
import { useAuth } from '../config/auth';
import { getRoleBasedActions } from '../utils/roleUtils';

interface ProcessApplicationModalProps {
  application: ApplicationData;
  isOpen: boolean;
  onClose: () => void;
  onProcess: (
    action: string,
    reason: string
  ) => void;
  initialAction?: string;
}

export default function ProcessApplicationModal({
  application,
  isOpen,
  onClose,
  onProcess,
  initialAction = 'approve',
}: ProcessApplicationModalProps) {
  const { userRole } = useAuth();
  const [selectedAction, setSelectedAction] = useState<string>(initialAction);
  const [reason, setReason] = useState('');

  const availableActions = useMemo(() => getRoleBasedActions(userRole), [userRole]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) {
      alert('Please select an action.');
      return;
    }
    onProcess(selectedAction, reason);
    onClose();
  };

  return (
    <div role="dialog" aria-labelledby="process-modal-title" aria-modal="true" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold" id="process-modal-title">Process Application</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application ID: {application.id}
          </label>
          <p className="text-sm text-gray-500">
            Applicant: {application.applicantName}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="action-select">
              Select Action
            </label>
            <select
              id="action-select"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
            >
              {availableActions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reason">
              Reason/Comments
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason or comments for this action"
              className="w-full border border-gray-300 rounded-md p-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5]"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}