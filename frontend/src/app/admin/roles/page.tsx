"use client";

import { useState, useEffect } from "react";
import { useAuthSync } from "@/hooks/useAuthSync";
import { useRouter } from "next/navigation";
import { RoleApi } from "@/config/APIClient";
import { AdminRoleService } from '@/services/admin/roles';
import type { AdminRole } from '@/store/slices/adminRoleSlice';

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  "View Permissions": [
    { key: "canViewFreshForm", label: "View Fresh Forms" },
    { key: "canViewForwarded", label: "View Forwarded Applications" },
    { key: "canViewReturned", label: "View Returned Applications" },
    { key: "canViewRedFlagged", label: "View Red Flagged Applications" },
    { key: "canViewDisposed", label: "View Disposed Applications" },
    { key: "canViewSent", label: "View Sent Applications" },
    { key: "canViewFinalDisposal", label: "View Final Disposal" },
    { key: "canViewReports", label: "View Reports" },
    { key: "canAccessSettings", label: "Access Settings" }
  ],
  "Action Permissions": [
    { key: "canSubmitApplication", label: "Submit Applications" },
    { key: "canCaptureUIN", label: "Capture UIN" },
    { key: "canCaptureBiometrics", label: "Capture Biometrics" },
    { key: "canUploadDocuments", label: "Upload Documents" },
    { key: "canForwardToACP", label: "Forward to ACP" },
    { key: "canForwardToSHO", label: "Forward to SHO" },
    { key: "canForwardToDCP", label: "Forward to DCP" },
    { key: "canForwardToAS", label: "Forward to AS" },
    { key: "canForwardToCP", label: "Forward to CP" },
    { key: "canConductEnquiry", label: "Conduct Enquiry" },
    { key: "canAddRemarks", label: "Add Remarks" },
    { key: "canApproveTA", label: "Approve TA" },
    { key: "canApproveAI", label: "Approve AI" },
    { key: "canReject", label: "Reject Applications" },
    { key: "canRequestResubmission", label: "Request Resubmission" },
    { key: "canGeneratePDF", label: "Generate PDF" }
  ]
};

// Permission Editor Modal
const PermissionEditorModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  role 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: Record<string, boolean>) => void;
  role: AdminRole | null;
}) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setPermissions(role.permissions);
    }
  }, [role]);

  const handlePermissionChange = (permissionKey: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(permissions);
    setSaving(false);
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Edit Permissions</h2>
            <p className="text-gray-600">Role: {role.displayName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="space-y-6">
          {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
            <div key={category} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map(({ key, label }) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={permissions[key] || false}
                      onChange={(e) => handlePermissionChange(key, e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="text-sm text-gray-700 cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Role Management Component
export default function UserRolesMappingPage() {
  const { userRole, token } = useAuthSync();
  const router = useRouter();
  
  // State
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);

  // Check admin access
  useEffect(() => {
    if (!token || userRole !== 'ADMIN') {
      router.push('/login');
      return;
    }
  }, [userRole, token, router]);

  // Load roles
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await AdminRoleService.getRoles();

      // AdminRoleService.getRoles returns the raw API response; adapt to expected shape
      if (response && (response as any).success) {
        setRoles((response as any).body || []);
      } else if (response && (response as any).data) {
        // sometimes services return data directly
        setRoles((response as any).data || []);
      } else {
        setError("Failed to load roles");
      }

    } catch (err) {
      setError("An error occurred while loading roles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (role: AdminRole) => {
    setSelectedRole(role);
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = async (permissions: Record<string, boolean>) => {
    if (!selectedRole) return;

    try {
      const response = await AdminRoleService.updateRolePermissions(selectedRole.id, permissions);
      if (response && (response as any).success) {
        await loadRoles(); // Refresh the list
        setIsPermissionModalOpen(false);
        setSelectedRole(null);
      } else {
        setError((response as any)?.message || "Failed to update permissions");
      }
    } catch (err) {
      setError("An error occurred while updating permissions");
      console.error(err);
    }
  };

  // Count active permissions for each role
  const getActivePermissionsCount = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Roles & Permissions</h1>
              <p className="text-gray-600">Manage role-based permissions for the system</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search roles by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{role.displayName}</h3>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {getActivePermissionsCount(role.permissions)}
                    </div>
                    <div className="text-xs text-gray-500">Permissions</div>
                  </div>
                </div>

                {role.description && (
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                )}

                {/* Permission Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Permissions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(role.permissions)
                      .filter(([_, value]) => value)
                      .slice(0, 3)
                      .map(([key, _]) => (
                        <span key={key} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    {getActivePermissionsCount(role.permissions) > 3 && (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{getActivePermissionsCount(role.permissions) - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleEditPermissions(role)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Edit Permissions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No roles found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No roles available.'}
            </p>
          </div>
        )}
      </div>

      {/* Permission Editor Modal */}
      <PermissionEditorModal
        isOpen={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false);
          setSelectedRole(null);
        }}
        onSave={handleSavePermissions}
        role={selectedRole}
      />
    </div>
  );
}
