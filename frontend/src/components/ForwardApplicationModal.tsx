import { useState, useEffect, useCallback } from 'react';
import { ApplicationData } from '../config/mockData';
import { useAuth } from '../config/auth';
import { RoleTypes } from '../config/roles';

interface ForwardApplicationModalProps {
  application: ApplicationData;
  isOpen: boolean;
  onClose: () => void;
  onForward: (recipient: string, comments: string) => void;
}

export default function ForwardApplicationModal({
  application,
  isOpen,
  onClose,
  onForward,
}: ForwardApplicationModalProps) {
  const { userRole } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [comments, setComments] = useState('');  // Get available recipients based on user role hierarchy
  const getAvailableRecipients = useCallback(() => {
    // Define role hierarchy for forwarding purposes based on the new workflow
    const roleHierarchy: Partial<Record<keyof typeof RoleTypes, Array<keyof typeof RoleTypes>>> = {
      // Applicant can't forward to anyone
      // Zonal Superintendent can forward to DCP or ACP
      [RoleTypes.ZS]: [RoleTypes.DCP, RoleTypes.ACP],
      // SHO can forward back to ACP after conducting enquiry
      [RoleTypes.SHO]: [RoleTypes.ACP],
      // ACP can forward to SHO for enquiry or back to DCP with remarks
      [RoleTypes.ACP]: [RoleTypes.DCP, RoleTypes.SHO],
      // DCP can forward to ACP for enquiry or to AS for administrative chain
      [RoleTypes.DCP]: [RoleTypes.ACP, RoleTypes.AS, RoleTypes.CP],
      // Arms Superintendent forwards to administrative chain
      [RoleTypes.AS]: [RoleTypes.ADO, RoleTypes.DCP],
      // Administrative Officer forwards to CADO with remarks
      [RoleTypes.ADO]: [RoleTypes.CADO],
      // Chief Administrative Officer forwards to JTCP
      [RoleTypes.CADO]: [RoleTypes.JTCP],
      // Joint Commissioner forwards to CP with or without remarks
      [RoleTypes.JTCP]: [RoleTypes.CP],
      // Commissioner of Police is the final authority
      [RoleTypes.CP]: [RoleTypes.DCP],
      // Admin can forward to anyone
      [RoleTypes.ADMIN]: [
        RoleTypes.ZS,
        RoleTypes.DCP, 
        RoleTypes.ACP, 
        RoleTypes.SHO,
        RoleTypes.AS,
        RoleTypes.ADO,
        RoleTypes.CADO,
        RoleTypes.JTCP,
        RoleTypes.CP
      ],
    };

    const roleDisplayNames = {
      [RoleTypes.ZS]: 'Zonal Superintendent (ZS)',
      [RoleTypes.DCP]: 'Deputy Commissioner of Police (DCP)',
      [RoleTypes.ACP]: 'Assistant Commissioner of Police (ACP)',
      [RoleTypes.SHO]: 'Station House Officer (SHO)',
      [RoleTypes.AS]: 'Arms Superintendent (AS)',
      [RoleTypes.ADO]: 'Administrative Officer (ADO)',
      [RoleTypes.CADO]: 'Chief Administrative Officer (CADO)',
      [RoleTypes.JTCP]: 'Joint Commissioner of Police (JTCP)',
      [RoleTypes.CP]: 'Commissioner of Police (CP)',
      [RoleTypes.ADMIN]: 'System Administrator',
    };

    const availableRoles = roleHierarchy[userRole] || [];
    // Filter to only roles that have display names
    const filteredRoles = availableRoles.filter(
      (role): role is keyof typeof roleDisplayNames => role in roleDisplayNames
    );
    return filteredRoles.map((role) => ({
      value: role,
      label: roleDisplayNames[role] || role
    }));
  }, [userRole]);
  
  // Set default recipient and reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Get available recipients
      const availableRecipients = getAvailableRecipients();
      // Set first recipient as default if available
      if (availableRecipients.length > 0) {
        setRecipient(availableRecipients[0].value);
      } else {
        setRecipient('');
      }
      setComments('');
    }
  }, [isOpen, userRole, getAvailableRecipients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Forward Application</h3>
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
            Forward To
          </label>          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
            required
          >
            {getAvailableRecipients().length === 0 ? (
              <option value="">No recipients available</option>
            ) : (
              getAvailableRecipients().map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments (Optional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any comments or notes for the recipient"
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
              if (recipient) {
                onForward(recipient, comments);
              } else {
                alert('Please select a recipient');
              }
            }}
            className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5]"
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
