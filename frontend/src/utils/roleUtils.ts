import { RoleTypes } from '../config/roles';

export const getRoleHierarchy = (): Record<string, string[]> => ({
  [RoleTypes.SHO]: [RoleTypes.ACP, RoleTypes.ZS],
  [RoleTypes.ACP]: [RoleTypes.DCP, RoleTypes.ZS, RoleTypes.SHO],
  [RoleTypes.ZS]: [RoleTypes.ACP, RoleTypes.DCP, RoleTypes.ARMS_SUPDT],
  [RoleTypes.DCP]: [RoleTypes.ZS, RoleTypes.ACP, RoleTypes.CP, RoleTypes.JTCP, RoleTypes.ARMS_SUPDT],
  [RoleTypes.JTCP]: [RoleTypes.CP, RoleTypes.CADO],
  [RoleTypes.CP]: [RoleTypes.JTCP],
  [RoleTypes.CADO]: [RoleTypes.JTCP, RoleTypes.CP],
  [RoleTypes.ACO]: [RoleTypes.CADO, RoleTypes.ACP],
  [RoleTypes.AS]: [RoleTypes.ADO, RoleTypes.DCP],
  [RoleTypes.ARMS_SUPDT]: [RoleTypes.ARMS_SEAT, RoleTypes.DCP],
  [RoleTypes.ARMS_SEAT]: [RoleTypes.ADO, RoleTypes.ARMS_SUPDT],
  [RoleTypes.ADO]: [RoleTypes.CADO, RoleTypes.ARMS_SUPDT],
  [RoleTypes.ADMIN]: [
    RoleTypes.ZS,
    RoleTypes.DCP,
    RoleTypes.ACP,
    RoleTypes.SHO,
    RoleTypes.AS,
    RoleTypes.ARMS_SUPDT,
    RoleTypes.ARMS_SEAT,
    RoleTypes.ADO,
    RoleTypes.CADO,
    RoleTypes.JTCP,
    RoleTypes.CP
  ]
});

export const getRoleDisplayNames = (): Record<string, string> => ({
  [RoleTypes.SHO]: 'Station House Officer (SHO)',
  [RoleTypes.ACP]: 'Assistant Commissioner of Police (ACP)',
  [RoleTypes.ZS]: 'Zonal Superintendent (ZS)',
  [RoleTypes.DCP]: 'Deputy Commissioner of Police (DCP)',
  [RoleTypes.JTCP]: 'Joint Commissioner of Police (JCP)',
  [RoleTypes.CP]: 'Commissioner of Police (CP)',
  [RoleTypes.ADO]: 'Administrative Officer (ADO)',
  [RoleTypes.CADO]: 'Chief Administrative Officer (CADO)',
  [RoleTypes.ARMS_SUPDT]: 'ARMS Superintendent',
  [RoleTypes.ARMS_SEAT]: 'ARMS Seat',
  [RoleTypes.AS]: 'Arms Superintendent (AS)',
  [RoleTypes.ACO]: 'Assistant Compliance Officer (ACO)',
  [RoleTypes.ADMIN]: 'System Administrator'
});

export const getRoleBasedActions = (role: string): { value: string; label: string }[] => {
  const common = [
    { value: 'return', label: 'Return Application' },
    { value: 'flag', label: 'Red Flag' },
    { value: 're-enquiry', label: 'Re-Enquiry' },
  ];

  const roleActions: Record<string, { value: string; label: string }[]> = {
    DCP: [
      { value: 'approve', label: 'Approve (TA)' },
      { value: 'reject', label: 'Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
      { value: 'dispose', label: 'Dispose Application' },
    ],
    JTCP: [
      { value: 'recommend', label: 'Recommend to CP' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    ACP: [
      { value: 'approve', label: 'Recommend Approve' },
      { value: 'reject', label: 'Recommend Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    ZS: [
      { value: 'approve', label: 'Preliminarily Verify' },
      { value: 'reject', label: 'Preliminarily Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    SHO: [
      { value: 'approve', label: 'Enquiry Complete (Favorable)' },
      { value: 'reject', label: 'Enquiry Complete (Unfavorable)' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
    ],
    ADMIN: [
      { value: 'approve', label: 'Approve' },
      { value: 'reject', label: 'Reject' },
      { value: 'recommend', label: 'Recommend' },
      { value: 'not-recommend', label: 'Not Recommend' },
      ...common,
      { value: 'dispose', label: 'Dispose Application' },
    ],
  };

  return roleActions[role] || common;
};
