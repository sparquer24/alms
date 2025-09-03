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
  // Use canonical first element for outbound query. Keep legacy synonyms after it.
  forwarded: ['forward', 'forwarded', 'FORWARD', 'FORWARDED'],
  returned: ['returned'],       // Changed to lowercase to match API
  redFlagged: ['red_flagged'], // Using snake_case to match API
  disposed: ['disposed'],       // Changed to lowercase to match API
  freshform: ['initiated'],     // Changed to lowercase to match API
  sent: ['sent'],              // Changed to lowercase to match API
  closed: ['closed'],          // Changed to lowercase to match API
  finaldisposal: ['final_disposal'], // Using snake_case to match API
  myreports: ['forwarded', 'returned', 'red_flagged', 'disposed'], // All statuses for reports
};

// Helper to pick first canonical outbound status value
export const resolveStatusParam = (key: StatusKey | string): string | undefined => {
  const normalized = key as StatusKey;
  const arr = statusIdMap[normalized];
  if (!arr || arr.length === 0) return undefined;
  return String(arr[0]).toLowerCase();
};




