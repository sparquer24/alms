/**
 * Area of validity ("Areas within which applicant wishes to carry arms").
 * Mirrors backend/src/constants/area-of-validity.ts: an application carries
 * exactly one area, and it decides which actions officers get (a
 * Throughout-India license can only be recommended, not approved locally).
 */

export const AREA_OF_VALIDITY = {
  DISTRICT: 'District-wide',
  STATE: 'State-wide',
  INDIA: 'Throughout India',
} as const;

export type AreaOfValidity = (typeof AREA_OF_VALIDITY)[keyof typeof AREA_OF_VALIDITY];

export const AREA_OF_VALIDITY_OPTIONS: { value: AreaOfValidity; label: string }[] = [
  { value: AREA_OF_VALIDITY.DISTRICT, label: 'District' },
  { value: AREA_OF_VALIDITY.STATE, label: 'State' },
  { value: AREA_OF_VALIDITY.INDIA, label: 'Throughout India' },
];

/**
 * Normalize any stored form (canonical label, `DISTRICT`/`STATE`/`INDIA` code,
 * or the legacy multi-select `DISTRICT, STATE`) to one canonical value — the
 * widest area ticked. Returns '' when empty or unrecognized.
 */
export function normalizeAreaOfValidity(raw?: string | null): AreaOfValidity | '' {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return '';
  if (value.includes('india')) return AREA_OF_VALIDITY.INDIA;
  if (/\bstate\b/.test(value)) return AREA_OF_VALIDITY.STATE;
  if (/\bdistrict\b/.test(value)) return AREA_OF_VALIDITY.DISTRICT;
  return '';
}

export const areaOfValidityLabel = (raw?: string | null): string =>
  AREA_OF_VALIDITY_OPTIONS.find(o => o.value === normalizeAreaOfValidity(raw))?.label ?? '';
