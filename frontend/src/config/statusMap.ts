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
  forwarded: [],
  returned: [],
  redFlagged: [],
  disposed: [],
  freshform: [],
  sent: [],
  closed: [],
  finaldisposal: [],
  myreports: [],
};



