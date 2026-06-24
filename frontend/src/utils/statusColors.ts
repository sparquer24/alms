export interface StatusStyle {
  bg: string;
  text: string;
  border: string;
}

export const STATUS_COLOR_MAP: Record<string, StatusStyle> = {
  approved: { bg: '#22C55E', text: '#FFFFFF', border: '#22C55E' },
  rejected: { bg: '#EF4444', text: '#FFFFFF', border: '#EF4444' },
  returned: { bg: '#F97316', text: '#FFFFFF', border: '#F97316' },
  forwarded: { bg: '#A855F7', text: '#FFFFFF', border: '#A855F7' },
  reenquiry: { bg: '#EAB308', text: '#000000', border: '#EAB308' },
  redflagged: { bg: '#DC2626', text: '#FFFFFF', border: '#DC2626' },
  closed: { bg: '#6B7280', text: '#FFFFFF', border: '#6B7280' },
  submitted: { bg: '#2563EB', text: '#FFFFFF', border: '#2563EB' },
  initiated: { bg: '#0EA5E9', text: '#FFFFFF', border: '#0EA5E9' },
  draft: { bg: '#94A3B8', text: '#FFFFFF', border: '#94A3B8' },
  pending: { bg: '#EAB308', text: '#000000', border: '#EAB308' }, // Pending defaults to re-enquiry/yellow color
  reverted: { bg: '#8B5CF6', text: '#FFFFFF', border: '#7C3AED' }, // Violet — revert status
  unknown: { bg: '#94A3B8', text: '#FFFFFF', border: '#94A3B8' },
};

export const getStatusStyle = (status: string | number | undefined | null): StatusStyle => {
  const normalized = String(status || '')
    .toLowerCase()
    .trim()
    .replace(/[-\s_]+/g, '');

  let key = 'unknown';

  if (normalized.includes('approved') || normalized === 'approve') {
    key = 'approved';
  } else if (normalized.includes('rejected') || normalized === 'reject') {
    key = 'rejected';
  } else if (normalized.includes('returned') || normalized === 'return') {
    key = 'returned';
  } else if (normalized.includes('forwarded') || normalized === 'forward') {
    key = 'forwarded';
  } else if (normalized.includes('reenquiry') || normalized.includes('enquiry')) {
    key = 'reenquiry';
  } else if (normalized.includes('redflag') || normalized.includes('flag')) {
    key = 'redflagged';
  } else if (normalized.includes('reverted') || normalized === 'revert') {
    key = 'reverted';
  } else if (normalized.includes('closed') || normalized === 'close') {
    key = 'closed';
  } else if (normalized.includes('submitted') || normalized === 'submit' || normalized.includes('sent')) {
    key = 'submitted';
  } else if (normalized.includes('initiated') || normalized.includes('initiate')) {
    key = 'initiated';
  } else if (normalized.includes('draft')) {
    key = 'draft';
  } else if (normalized.includes('pending')) {
    key = 'pending';
  }

  return STATUS_COLOR_MAP[key] || STATUS_COLOR_MAP.unknown;
};
