// ─── Input Filters ───────────────────────────────────────────────────────────
//
// These functions strip invalid characters on every keystroke (onChange).
// They do NOT validate — they only sanitize input to prevent invalid chars.

/**
 * Text fields (names, occupation): allow only alphabets and spaces.
 * Collapses multiple consecutive spaces into one.
 */
export function filterText(value: string): string {
  let filtered = value.replace(/[^A-Za-z\s]/g, '');
  filtered = filtered.replace(/\s{2,}/g, ' ');
  return filtered;
}

/**
 * PAN field: uppercase, allow only A-Z and 0-9.
 */
export function filterPan(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Digit-only fields (Aadhaar, mobile, phone): strip non-digits.
 */
export function filterDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Area/decimal fields: allow digits and a single decimal point.
 * Prevents multiple decimal points.
 */
export function filterArea(value: string): string {
  let filtered = value.replace(/[^\d.]/g, '');
  const parts = filtered.split('.');
  if (parts.length > 2) {
    filtered = parts[0] + '.' + parts.slice(1).join('');
  }
  return filtered;
}

/**
 * Alphanumeric fields (FIR Number, Under Section, etc.): allow alphabets, numbers, spaces.
 * Collapses multiple consecutive spaces into one.
 */
export function filterAlphaNumeric(value: string): string {
  let filtered = value.replace(/[^A-Za-z0-9\s]/g, '');
  filtered = filtered.replace(/\s{2,}/g, ' ');
  return filtered;
}

/**
 * No filtering — passthrough (for address, date, select, custom).
 */
export function filterNone(value: string): string {
  return value;
}
