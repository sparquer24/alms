import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

export interface AdminPermission {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
  canManageWorkflows: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
  canManageSystemSettings: boolean;
}

export const useAdminPermissions = (): AdminPermission => {
  const user = useSelector(selectCurrentUser);
  
  // Default permissions for admin role
  const defaultAdminPermissions: AdminPermission = {
    canManageUsers: true,
    canManageRoles: true,
    canManagePermissions: true,
    canManageWorkflows: true,
    canViewAuditLogs: true,
    canExportData: true,
    canManageSystemSettings: true,
  };

  // If no user or not admin, return no permissions
  if (!user || user.role !== 'ADMIN') {
    return {
      canManageUsers: false,
      canManageRoles: false,
      canManagePermissions: false,
      canManageWorkflows: false,
      canViewAuditLogs: false,
      canExportData: false,
      canManageSystemSettings: false,
    };
  }

  // For now, return full admin permissions
  // In the future, this could be based on specific user permissions
  return defaultAdminPermissions;
};

// Helper function to check if user has specific permission
// This should be called within a component that has access to permissions
export const hasPermission = (permissions: AdminPermission, permission: keyof AdminPermission): boolean => {
  return permissions[permission];
};

// Helper function to check if user can access admin panel
// This should be called within a component that has access to user
export const canAccessAdminPanel = (userRole?: string | null): boolean => {
  return userRole === 'ADMIN';
}; 