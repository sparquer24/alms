// Central mapping of menu/submenu to status ID arrays for /application-form

export type StatusKey =
  | 'forwarded'
  | 'returned'
  | 'redFlagged'
  | 'disposed'
  | 'freshform'
  | 'sent'
  | 'closed'
  | 'finaldisposal'
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'reEnquiry'
  | 'groundReport'
  | 'myreports'
  | 'drafts';

export type StatusIdMap = Partial<Record<StatusKey, number[]>>;

// Status mapping for numeric status_id (based on actual API status codes)
// Synchronized with STATUS_MAP from sidebarApiCalls.ts
export const statusIdMap: StatusIdMap = {
  forwarded: [1, 9],     // FORWARD + INITIATE (keep all ids in forward including freshform)
  pending: [1, 9],       // Same as forward for now
  sent: [11, 1, 9],      // RECOMMEND
  returned: [2],         // REJECT (treated as returned)
  redFlagged: [8],       // RED_FLAG
  disposed: [7],         // DISPOSE
  approved: [11, 3],     // RECOMMEND + APPROVED
  freshform: [9],        // INITIATE (fresh form applications)
  finaldisposal: [7],    // FINAL DISPOSAL (same as disposed)
  closed: [10],          // CLOSE
  cancelled: [4],        // CANCEL
  reEnquiry: [5],        // RE_ENQUIRY
  groundReport: [6],     // GROUND_REPORT          // DRAFT
  drafts: [13],          // DRAFTS (alias for draft)
};




