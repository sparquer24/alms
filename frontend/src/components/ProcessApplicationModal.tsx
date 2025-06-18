import { useState } from 'react';
import { ApplicationData } from '../config/mockData';
import { useAuth } from '../config/auth';
import { RoleTypes } from '../config/roles';

interface ProcessApplicationModalProps {
  application: ApplicationData;
  isOpen: boolean;
  onClose: () => void;
  onProcess: (
    action: 'approve' | 'reject' | 'return' | 'flag' | 'dispose' | 'recommend' | 'not-recommend' | 're-enquiry',
    reason: string
  ) => void;
  initialAction?: 'approve' | 'reject' | 'return' | 'flag' | 'dispose' | 'recommend' | 'not-recommend' | 're-enquiry';
}

export default function ProcessApplicationModal({
  application,
  isOpen,
  onClose,
  onProcess,
  initialAction = 'approve'
}: ProcessApplicationModalProps) {
  const { userRole } = useAuth();
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'return' | 'flag' | 'dispose' | 'recommend' | 'not-recommend' | 're-enquiry'>(initialAction);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  // Role-based available actions
  const availableActions = () => {
    // Common actions for all roles
    const common = [
      { value: 'return', label: 'Return Application' },
      { value: 'flag', label: 'Red Flag' },
      { value: 're-enquiry', label: 'Re-Enquiry' },
    ];

    // Role-specific actions based on the arms license workflow
    switch (userRole) {
      case RoleTypes.CP:
        // Commissioner of Police - final authority for AI and complex TA requests
        return [
          { value: 'approve', label: 'Final Approve (AI)' },
          { value: 'reject', label: 'Final Reject' },
          { value: 'recommend', label: 'Forward to Government' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
          { value: 'dispose', label: 'Dispose Application' },
        ];
      case RoleTypes.DCP:
        // Deputy Commissioner of Police - approves TA Fresh and Renewals
        return [
          { value: 'approve', label: 'Approve (TA)' },
          { value: 'reject', label: 'Reject' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
          { value: 'dispose', label: 'Dispose Application' },
        ];
      case RoleTypes.JTCP:
        // Joint Commissioner reviews and forwards to CP
        return [
          { value: 'recommend', label: 'Recommend to CP' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
        ];
      case RoleTypes.ACP:
        // Assistant Commissioner of Police - sends for enquiry or forwards to DCP
        return [
          { value: 'approve', label: 'Recommend Approve' },
          { value: 'reject', label: 'Recommend Reject' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
        ];
      case RoleTypes.ZS:
        // Zonal Superintendent - initial processing and biometrics
        return [
          { value: 'approve', label: 'Preliminarily Verify' },
          { value: 'reject', label: 'Preliminarily Reject' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
        ];
      case RoleTypes.SHO:
        // Station House Officer - conducts enquiry
        return [
          { value: 'approve', label: 'Enquiry Complete (Favorable)' },
          { value: 'reject', label: 'Enquiry Complete (Unfavorable)' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
        ];
      case RoleTypes.AS:
        // Arms Superintendent - administrative processing
        return [
          { value: 'approve', label: 'Verify Documents' },
          { value: 'reject', label: 'Document Issues' },
          { value: 'recommend', label: 'Forward for Processing' },
          { value: 'not-recommend', label: 'Return for Correction' },
          ...common,
        ];
      case RoleTypes.ADO:
        // Administrative Officer - processes documentation
        return [
          { value: 'approve', label: 'Documentation Complete' },
          { value: 'reject', label: 'Documentation Incomplete' },
          { value: 'recommend', label: 'Forward to CADO' },
          { value: 'not-recommend', label: 'Return for Correction' },
          ...common,
        ];
      case RoleTypes.CADO:
        // Chief Administrative Officer - final administrative check
        return [
          { value: 'approve', label: 'Administration Complete' },
          { value: 'reject', label: 'Administrative Issues' },
          { value: 'recommend', label: 'Forward to JTCP' },
          { value: 'not-recommend', label: 'Return for Correction' },
          ...common,
        ];
      case RoleTypes.ADMIN:
        // System Administrator - full access to all options
        return [
          { value: 'approve', label: 'Approve' },
          { value: 'reject', label: 'Reject' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
          { value: 'dispose', label: 'Dispose Application' },
        ];
      case RoleTypes.ARMS_SUPDT:
        // ARMS Superintendent - handles forwarding to ARMS Seat
        return [
          { value: 'approve', label: 'Verify Application' },
          { value: 'reject', label: 'Reject Application' },
          { value: 'recommend', label: 'Forward to ARMS Seat' },
          { value: 'not-recommend', label: 'Return to DCP' },
          ...common,
        ];
      case RoleTypes.ARMS_SEAT:
        // ARMS Seat - processes application before forwarding to ADO
        return [
          { value: 'approve', label: 'Process Application' },
          { value: 'reject', label: 'Processing Issues' },
          { value: 'recommend', label: 'Forward to ADO' },
          { value: 'not-recommend', label: 'Return to ARMS Superintendent' },
          ...common,
        ];
      default:
        // Default case for any other roles or applicant
        return [
          { value: 'approve', label: 'Verify' },
          { value: 'reject', label: 'Not Recommend' },
          { value: 'recommend', label: 'Recommend' },
          { value: 'not-recommend', label: 'Not Recommend' },
          ...common,
        ];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Process Application</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Action
          </label>          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value as 'approve' | 'reject' | 'return' | 'flag' | 'dispose' | 'recommend' | 'not-recommend' | 're-enquiry')}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
          >
            {availableActions().map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason/Comments
          </label>
          <textarea
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
            onClick={() => {
              if (reason.trim().length > 0 || selectedAction === 'approve') {
                onProcess(selectedAction, reason);
              } else {
                alert('Please provide a reason for this action');
              }
            }}
            className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5]"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};