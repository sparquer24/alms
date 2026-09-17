// Central mapping of menu/submenu to status ID arrays for /application-form

export type StatusKey =
  | 'forwarded'
  | 'returned'
  | 'redflagged'
  | 'disposed'
  | 'freshform'
  | 'sent'
  | 'closed'
  | 'applications'
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'reEnquiry'
  | 'groundReport'
  | 'myreports'
  | 'drafts';

export type StatusIdMap = Partial<Record<StatusKey, (number | string)[]>>;

// Status mapping for numeric status_id or string status codes
// Synchronized with STATUS_MAP from sidebarApiCalls.ts
export const statusIdMap: StatusIdMap = {
  forwarded: ['FORWARD'],     // FORWARDED status only
  sent: [],      // RECOMMEND
  returned: ['REJECT', 'RETURN'],         // REJECT (treated as returned)
  redflagged: ['RED_FLAG'],       // RED_FLAG
  disposed: ['DISPOSE'],         // DISPOSE
  approved: ['APPROVED'],     // APPROVED
  applications: ['CLOSE', 'APPROVED'],  // Approved or closed applications
  freshform: ['INITIATED'],        // INITIATE / INITIATED (fresh form applications)
  // Numeric workflowStatusId, not the 'CLOSE' code string: sidebarApiCalls.ts sends
  // this straight through as the `statusIds` query param, which the backend expects
  // as numeric Statuses.id values (CLOSE = id 9 per prisma/seed.ts) — a string code
  // here never matches anything server-side, so the Closed tab always came back empty.
  closed: [9],          // CLOSE
  cancelled: ['CANCEL'],        // CANCEL
  reEnquiry: ['RE_ENQUIRY'],        // RE_ENQUIRY
  groundReport: ['GROUND_REPORT'],     // GROUND_REPORT
  drafts: ['DRAFT'],          // DRAFTS (alias for draft)

};