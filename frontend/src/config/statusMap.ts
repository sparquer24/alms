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
  | 'myreports';

export type StatusIdMap = Partial<Record<StatusKey, Array<string | number>>>;

// Fill these arrays with the correct status IDs from your workflow tables
export const statusIdMap: StatusIdMap = {
  // Numeric status IDs based on authoritative ACTIONS list
  forwarded: [1],
  returned: [2],
  redFlagged: [8],
  disposed: [7],
  freshform: [9],
  sent: [11],
  closed: [10],
  finaldisposal: [7],
};




