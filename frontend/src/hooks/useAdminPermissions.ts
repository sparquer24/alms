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
export const hasPermission = (permission: keyof AdminPermission): boolean => {
  const permissions = useAdminPermissions();
  return permissions[permission];
};

// Helper function to check if user can access admin panel
export const canAccessAdminPanel = (): boolean => {
  const user = useSelector(selectCurrentUser);
  return user?.role === 'ADMIN';
}; 