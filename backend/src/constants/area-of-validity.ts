/**
 * Area of validity ("Areas within which applicant wishes to carry arms").
 * An application carries exactly one area. Together with the district and
 * need for license it selects the approval rule that decides who approves or
 * recommends (see src/modules/approvalRules/approval-rules.resolver.ts).
 */

export const AREA_OF_VALIDITY = {
  DISTRICT: 'District-wide',
  STATE: 'State-wide',
  INDIA: 'Throughout India',
} as const;

export type AreaOfValidity = (typeof AREA_OF_VALIDITY)[keyof typeof AREA_OF_VALIDITY];

/**
 * Normalize any stored or submitted form to one canonical value. Accepts the
 * canonical labels, codes (`DISTRICT`, `STATE`, `INDIA`) and the legacy
 * multi-select renewal format (`DISTRICT, STATE`), which resolves to the
 * widest area ticked. Returns null when empty or unrecognized.
 */
export function normalizeAreaOfValidity(raw?: string | null): AreaOfValidity | null {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return null;
  if (value.includes('india')) return AREA_OF_VALIDITY.INDIA;
  if (/\bstate\b/.test(value)) return AREA_OF_VALIDITY.STATE;
  if (/\bdistrict\b/.test(value)) return AREA_OF_VALIDITY.DISTRICT;
  return null;
}
