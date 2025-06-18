// This file contains all the role-based configurations for the Arms License Management System Dashboard
// Roles include Applicant, Zonal Superintendent, DCP, ACP, SHO, etc.

export interface RoleConfig {
  roleName: string;
  displayName: string;
  permissions: {
    // View permissions
    canViewFreshForm: boolean;
    canViewForwarded: boolean;
    canViewReturned: boolean;
    canViewRedFlagged: boolean;
    canViewDisposed: boolean;
    canViewSent: boolean;
    canViewFinalDisposal: boolean;
    canViewReports: boolean;
    canAccessSettings: boolean;
    
    // Action permissions
    canSubmitApplication: boolean; // For applicants
    canCaptureUIN: boolean; // For ZS
    canCaptureBiometrics: boolean; // For ZS
    canUploadDocuments: boolean; // For ZS, SHO
    canForwardToACP: boolean; // For DCP, ZS
    canForwardToSHO: boolean; // For ACP
    canForwardToDCP: boolean; // For ACP, ZS, SHO
    canForwardToAS: boolean; // For DCP
    canForwardToCP: boolean; // For DCP, JTCP, CADO
    canConductEnquiry: boolean; // For SHO
    canAddRemarks: boolean; // For all officers
    canApproveTA: boolean; // For DCP
    canApproveAI: boolean; // For CP
    canReject: boolean; // For DCP, CP
    canRequestResubmission: boolean; // For DCP, CP
    canGeneratePDF: boolean; // For ZS
  };
  dashboardTitle: string;
  menuItems: string[];
  // Additional role-specific configurations can be added here
}

export const RoleTypes = {
  APPLICANT: 'APPLICANT', // Citizen who applies for license
  ZS: 'ZS', // Zonal Superintendent
  DCP: 'DCP', // Deputy Commissioner of Police
  ACP: 'ACP', // Assistant Commissioner of Police
  SHO: 'SHO', // Station House Officer
  AS: 'AS', // Arms Superintendent
  ARMS_SUPDT: 'ARMS_SUPDT', // ARMS Superintendent
  ARMS_SEAT: 'ARMS_SEAT', // ARMS Seat
  ADO: 'ADO', // Administrative Officer
  CADO: 'CADO', // Chief Administrative Officer
  JTCP: 'JTCP', // Joint Commissioner of Police (JtCP)
  CP: 'CP', // Commissioner of Police
  ACO: 'ACO', // Assistant Compliance Officer 
  ADMIN: 'ADMIN', // Super Admin
} as const;

export type RoleType = (typeof RoleTypes)[keyof typeof RoleTypes];

// Role-based configurations
export const roleConfigurations: Record<RoleType, RoleConfig> = {  [RoleTypes.APPLICANT]: {
    roleName: 'APPLICANT',
    displayName: 'Citizen Applicant',
    permissions: {
      // View permissions
      canViewFreshForm: false,
      canViewForwarded: false,
      canViewReturned: true,
      canViewRedFlagged: false,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: true,
      canViewReports: false,
      canAccessSettings: false,
      
      // Action permissions
      canSubmitApplication: true,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: true,
      canForwardToACP: false,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: false,
      canForwardToCP: false,
      canConductEnquiry: false,
      canAddRemarks: false,
      canApproveTA: false,
      canApproveAI: false,
      canReject: false,
      canRequestResubmission: false,
      canGeneratePDF: false,
    },    dashboardTitle: 'Applicant Dashboard',
    menuItems: ['returned', 'sent', 'final'],
  },  [RoleTypes.SHO]: {
    roleName: 'SHO',
    displayName: 'Station House Officer',
    permissions: {
      // View permissions
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,
      
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: true,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: false,
      canForwardToCP: false,
      canConductEnquiry: true,
      canAddRemarks: true,
      canApproveTA: false,
      canApproveAI: false,
      canReject: false,
      canRequestResubmission: false,
      canGeneratePDF: false,
    },    dashboardTitle: 'SHO Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'sent', 'reports'],
  },  [RoleTypes.DCP]: {
    roleName: 'DCP',
    displayName: 'Deputy Commissioner of Police',
    permissions: {
      // View permissions
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: true,
      canViewSent: true,
      canViewFinalDisposal: true,
      canViewReports: true,
      canAccessSettings: true,
      
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },    dashboardTitle: 'DCP Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'disposed', 'sent', 'final', 'reports'],
  },  [RoleTypes.ACP]: {
    roleName: 'ACP',
    displayName: 'Assistant Commissioner of Police',
    permissions: {
      // View permissions
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: true,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,
        
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },    dashboardTitle: 'ACP Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'disposed', 'sent', 'reports'],
  },  [RoleTypes.CADO]: {
    roleName: 'CADO',
    displayName: 'Chief Administrative Officer',
    permissions: {
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,
        
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },    dashboardTitle: 'CADO Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'sent', 'reports'],
  },  [RoleTypes.CP]: {
    roleName: 'CP',
    displayName: 'Commissioner of Police',
    permissions: {
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: true,
      canViewSent: true,
      canViewFinalDisposal: true,
      canViewReports: true,
      canAccessSettings: true,
        
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },    dashboardTitle: 'CP Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'disposed', 'sent', 'final', 'reports'],
  },  [RoleTypes.JTCP]: {
    roleName: 'JTCP',
    displayName: 'Joint Commissioner of Police',
    permissions: {
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: true,
      canViewSent: true,
      canViewFinalDisposal: true,
      canViewReports: true,
      canAccessSettings: true,
        
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },    dashboardTitle: 'Joint CP Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'disposed', 'sent', 'final', 'reports'],
  },
  [RoleTypes.ZS]: {
    roleName: 'ZS',
    displayName: 'Zonal Superintendent',
    permissions: {
      canViewFreshForm: true,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: true,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,
        
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },
    dashboardTitle: 'Zonal Superintendent Dashboard',
    menuItems: ['freshform', 'forwarded', 'returned', 'flagged', 'disposed', 'sent', 'reports'],
  },  [RoleTypes.ACO]: {
    roleName: 'ACO',
    displayName: 'Assistant Compliance Officer',
    permissions: {
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,
        
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },    dashboardTitle: 'ACO Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'sent', 'reports'],
  },  [RoleTypes.ADMIN]: {
    roleName: 'ADMIN',
    displayName: 'System Administrator',
    permissions: {
      canViewFreshForm: false, // Only ZS can view fresh forms
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: true,
      canViewSent: true,
      canViewFinalDisposal: true,
      canViewReports: true,
      canAccessSettings: true,
        
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: true,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: true,
      canForwardToCP: true,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: true,
      canApproveAI: false,
      canReject: true,
      canRequestResubmission: true,
      canGeneratePDF: false,
    },    dashboardTitle: 'Admin Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'disposed', 'sent', 'final', 'reports'],
  },  [RoleTypes.AS]: {
    roleName: 'AS',
    displayName: 'Arms Superintendent',
    permissions: {
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,

      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: false,
      canForwardToSHO: false,
      canForwardToDCP: true,
      canForwardToAS: false,
      canForwardToCP: false,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: false,
      canApproveAI: false,
      canReject: false,
      canRequestResubmission: false,
      canGeneratePDF: false,
    },    dashboardTitle: 'Arms Superintendent Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'sent', 'reports'],
  },  [RoleTypes.ADO]: {
    roleName: 'ADO',
    displayName: 'Administrative Officer',
    permissions: {
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,

      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: false,
      canForwardToSHO: false,
      canForwardToDCP: true,
      canForwardToAS: false,
      canForwardToCP: false,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: false,
      canApproveAI: false,
      canReject: false,
      canRequestResubmission: false,
      canGeneratePDF: false,
    },    
    dashboardTitle: 'Administrative Officer Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'sent', 'reports'],
  },
  [RoleTypes.ARMS_SUPDT]: {
    roleName: 'ARMS_SUPDT',
    displayName: 'ARMS Superintendent',
    permissions: {
      // View permissions
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: true,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: true,
      
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: false,
      canForwardToSHO: false,
      canForwardToDCP: true, // Can forward back to DCP
      canForwardToAS: false,
      canForwardToCP: false,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: false,
      canApproveAI: false,
      canReject: false,
      canRequestResubmission: false,
      canGeneratePDF: false,
    },
    dashboardTitle: 'ARMS Superintendent Dashboard',
    menuItems: ['forwarded', 'returned', 'flagged', 'sent', 'reports'],
  },
  
  [RoleTypes.ARMS_SEAT]: {
    roleName: 'ARMS_SEAT',
    displayName: 'ARMS Seat',
    permissions: {
      // View permissions
      canViewFreshForm: false,
      canViewForwarded: true,
      canViewReturned: true,
      canViewRedFlagged: false,
      canViewDisposed: false,
      canViewSent: true,
      canViewFinalDisposal: false,
      canViewReports: true,
      canAccessSettings: false,
      
      // Action permissions
      canSubmitApplication: false,
      canCaptureUIN: false,
      canCaptureBiometrics: false,
      canUploadDocuments: false,
      canForwardToACP: false,
      canForwardToSHO: false,
      canForwardToDCP: false,
      canForwardToAS: false,
      canForwardToCP: false,
      canConductEnquiry: false,
      canAddRemarks: true,
      canApproveTA: false,
      canApproveAI: false,
      canReject: false,
      canRequestResubmission: false,
      canGeneratePDF: true, // Can generate PDF for memo
    },
    dashboardTitle: 'ARMS Seat Dashboard',
    menuItems: ['forwarded', 'returned', 'sent', 'reports'],
  },
};

// A utility function to get the role configuration
export const getRoleConfig = (role: RoleType): RoleConfig => {
  return roleConfigurations[role] || roleConfigurations[RoleTypes.ADMIN]; // Default to CLERK if role not found
};

// Export the current role (this would normally be set based on user authentication)
// This is just a placeholder and should be replaced with actual authentication logic
export const getCurrentRole = (): RoleType => {
  // This would normally come from an auth context or similar
  return RoleTypes.DCP; // Default to DCP for now
};
