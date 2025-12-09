/**
 * Workflow Actions & Status Constants
 * 
 * Contains all workflow-related constant values used across the application.
 */

// ============================================
// ROLE CODES
// ============================================

/**
 * Role codes used in the application
 */
export const ROLE_CODES = {
  ZS: 'ZS',                    // Zonal Superintendent
  SHO: 'SHO',                  // Station House Officer
  ACP: 'ACP',                  // Assistant Commissioner of Police
  DCP: 'DCP',                  // Deputy Commissioner of Police
  AS: 'AS',                    // Arms Superintendent
  ADO: 'ADO',                  // Administrative Officer
  CADO: 'CADO',                // Chief Administrative Officer
  JTCP: 'JTCP',                // Joint Commissioner of Police
  CP: 'CP',                    // Commissioner of Police
  APPLICANT: 'APPLICANT',      // Citizen Applicant
  ADMIN: 'ADMIN'               // System Administrator
} as const;

// ============================================
// ACTION CATEGORIES
// ============================================

/**
 * Terminal Actions - End the workflow
 */
export const TERMINAL_ACTIONS = [
  'REJECT',
  'APPROVED',
  'CLOSE',
  'DISPOSE',
  'CANCEL'
];

/**
 * Forward Actions - Transfer to another user
 */
export const FORWARD_ACTIONS = [
  'FORWARD'
];

/**
 * In-Place Actions - Keep with current user
 */
export const IN_PLACE_ACTIONS = [
  'RE_ENQUIRY',
  'GROUND_REPORT',
  'RECOMMEND',
  'INITIATE',
  'RED_FLAG'
];

// ============================================
// WORKFLOW STATUS CODES
// ============================================

/**
 * Status codes used in the workflow
 */
export const STATUS_CODES = {
  DRAFT: 'DRAFT',
  INITIATE: 'INITIATE',
  FORWARD: 'FORWARD',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RE_ENQUIRY: 'RE_ENQUIRY',
  GROUND_REPORT: 'GROUND_REPORT',
  APPROVED: 'APPROVED',
  REJECT: 'REJECT',
  CLOSE: 'CLOSE',
  DISPOSE: 'DISPOSE',
  CANCEL: 'CANCEL'
} as const;

// ============================================
// WORKFLOW ACTION CODES
// ============================================

/**
 * Action codes used in the workflow
 */
export const ACTION_CODES = {
  INITIATE: 'INITIATE',
  FORWARD: 'FORWARD',
  RE_ENQUIRY: 'RE_ENQUIRY',
  GROUND_REPORT: 'GROUND_REPORT',
  RECOMMEND: 'RECOMMEND',
  NOT_RECOMMEND: 'NOT_RECOMMEND',
  APPROVED: 'APPROVED',
  REJECT: 'REJECT',
  CLOSE: 'CLOSE',
  DISPOSE: 'DISPOSE',
  CANCEL: 'CANCEL',
  RED_FLAG: 'RED_FLAG'
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if action ends the workflow
 */
export function isTerminalAction(actionCode: string): boolean {
  return TERMINAL_ACTIONS.includes(actionCode.toUpperCase());
}

/**
 * Check if action requires nextUserId
 */
export function isForwardAction(actionCode: string): boolean {
  return FORWARD_ACTIONS.includes(actionCode.toUpperCase());
}

/**
 * Check if action keeps current user
 */
export function isInPlaceAction(actionCode: string): boolean {
  return IN_PLACE_ACTIONS.includes(actionCode.toUpperCase());
}

/**
 * Check if action is approval
 */
export function isApprovalAction(actionCode: string): boolean {
  return actionCode.toUpperCase() === ACTION_CODES.APPROVED;
}

/**
 * Check if action is rejection
 */
export function isRejectionAction(actionCode: string): boolean {
  return actionCode.toUpperCase() === ACTION_CODES.REJECT;
}

/**
 * Check if action is ground report
 */
export function isGroundReportAction(actionCode: string): boolean {
  return actionCode.toUpperCase() === ACTION_CODES.GROUND_REPORT;
}

/**
 * Check if action is re-enquiry
 */
export function isReEnquiryAction(actionCode: string): boolean {
  return actionCode.toUpperCase() === ACTION_CODES.RE_ENQUIRY;
}

/**
 * Check if action is recommend
 */
export function isRecommendAction(actionCode: string): boolean {
  return actionCode.toUpperCase() === ACTION_CODES.RECOMMEND;
}

/**
 * check if action is not recommend
*/
export function isNotRecommendAction(actionCode: string): boolean {
  return actionCode.toUpperCase() === ACTION_CODES.NOT_RECOMMEND;
}
