/**
 * Workflow Actions & Status Constants
 * 
 * Contains all workflow-related constant values used across the application.
 */

// ============================================
// ROLE CODES
// ============================================

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

// ============================================
// LEGACY CANCELLATION HISTORY ROWS
// ============================================

/**
 * Cancellation actions used to also be logged on the cancelled license's
 * fresh/renewal application, with system remarks starting "Cancel request ...".
 * They belong only to the cancel request's own history (CancelWorkflowHistories).
 * Spread this into a fresh/renewal history `where` to leave those rows out.
 */
export const EXCLUDE_CANCEL_MIRROR_HISTORY = {
  OR: [{ remarks: null }, { NOT: { remarks: { startsWith: 'Cancel request ' } } }],
};

/**
 * Older cancellation history rows prefixed the officer's remarks with a system
 * sentence ("Cancel request forwarded. <remarks>"). Split such a row into the
 * officer's own remarks and that system note so the two can be shown apart.
 */
export function splitCancelHistoryRemarks<T extends { remarks?: string | null }>(
  row: T,
): T & { systemNote: string | null } {
  const remarks = row.remarks ?? '';
  if (/^Cancel request (?:approved|initiated)\. [\s\S]*Reason: /.test(remarks)) {
    return { ...row, remarks: '', systemNote: remarks };
  }
  const other = remarks.match(/^(Cancel request (?:forwarded|rejected)\.)\s*([\s\S]*)$/);
  if (other) return { ...row, remarks: other[2], systemNote: other[1] };
  return { ...row, systemNote: null };
}
