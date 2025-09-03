// Utility to normalize route/status segments to canonical API status codes
// Canonical values are the first variant used for backend statusIds filtering.

const MAP: Record<string, string> = {
  forward: 'forward',
  forwarded: 'forward',
  FORWARD: 'forward',
  FORWARDED: 'forward',
  returned: 'returned',
  RETURNED: 'returned',
  redflagged: 'red_flagged',
  red_flagged: 'red_flagged',
  flagged: 'red_flagged',
  FLAGGED: 'red_flagged',
  disposed: 'disposed',
  DISPOSED: 'disposed',
  closed: 'closed',
  CLOSED: 'closed',
  sent: 'sent',
  SENT: 'sent',
  freshform: 'initiated',
  initiated: 'initiated',
  INITIATED: 'initiated',
  finaldisposal: 'final_disposal',
  final_disposal: 'final_disposal',
};

export function normalizeRouteStatus(routeSegment: string | undefined | null): string | undefined {
  if (!routeSegment) return undefined;
  const key = routeSegment.replace(/\s+/g, '').toLowerCase();
  return MAP[key] || key;
}

// Reverse mapping for display (optional)
const DISPLAY_MAP: Record<string, string> = {
  forward: 'Forwarded',
  returned: 'Returned',
  red_flagged: 'Red Flagged',
  disposed: 'Disposed',
  closed: 'Closed',
  sent: 'Sent',
  initiated: 'Fresh Form',
  final_disposal: 'Final Disposal'
};

export function toDisplayStatus(canonical: string | undefined): string {
  if (!canonical) return 'Applications';
  return DISPLAY_MAP[canonical] || canonical.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
