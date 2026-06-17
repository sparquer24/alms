// ─── Pure Validation Functions ────────────────────────────────────────────────
//
// Each function takes a value (+ optional config) and returns an error string.
// Empty string = valid. These are stateless, pure functions.

// ─── Regex Constants (single source of truth) ────────────────────────────────

/** Alphabets + spaces, must start with a letter */
export const TEXT_FIELD_REGEX = /^[A-Za-z][A-Za-z\s]*$/;

/** Multiple consecutive spaces */
export const MULTIPLE_SPACES_REGEX = /\s{2,}/;

/** Address: alphabets, digits, spaces, comma, slash, hyphen, period */
export const ADDRESS_CHARS_REGEX = /^[A-Za-z0-9\s,/\-.]+$/;

/** Only digits (reject addresses that are digits-only) */
export const ONLY_DIGITS_REGEX = /^\d+$/;

/** Only special characters (no alphanumeric) */
export const ONLY_SPECIAL_REGEX = /^[^A-Za-z0-9]+$/;

/** PAN: 5 uppercase letters + 4 digits + 1 uppercase letter */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/** Aadhaar: exactly 12 digits */
export const AADHAAR_REGEX = /^\d{12}$/;

/** Mobile: 10 digits starting with 6-9 */
export const MOBILE_REGEX = /^[6-9]\d{9}$/;

/** Phone/landline: 10 to 15 digits */
export const PHONE_REGEX = /^\d{10,15}$/;

/** Area: positive number with optional decimal places */
export const AREA_REGEX = /^\d+(\.\d{1,2})?$/;

// ─── Validator Functions ──────────────────────────────────────────────────────

/**
 * Validate a text field (names, occupation).
 * Rules: required check, no leading space/number/special char,
 *        no multiple spaces, only alphabets and spaces.
 */
export function validateText(
  value: string,
  required: boolean,
  overrides?: Record<string, string>,
): string {
  const v = value;

  if (required && !v.trim()) {
    return overrides?.required || 'This field is required.';
  }
  if (!v.trim()) return '';

  if (v.startsWith(' ')) {
    return overrides?.startSpace || 'Input cannot start with a space.';
  }
  if (/^[^A-Za-z]/.test(v)) {
    return overrides?.startSpecial || 'Input cannot start with a special character.';
  }
  if (MULTIPLE_SPACES_REGEX.test(v)) {
    return overrides?.multipleSpaces || 'Multiple consecutive spaces are not allowed.';
  }

  return '';
}

/**
 * Validate a general text field (allows alphabets, numbers, and spaces).
 * Rules: required check, no leading space/special char,
 *        no multiple spaces, only alphanumeric and spaces.
 * Use for fields like FIR Number, Under Section, Police Station, Unit, etc.
 */
export function validateGeneralText(
  value: string,
  required: boolean,
  overrides?: Record<string, string>,
): string {
  const v = value;

  if (required && !v.trim()) {
    return overrides?.required || 'This field is required.';
  }
  if (!v.trim()) return '';

  if (v.startsWith(' ')) {
    return overrides?.startSpace || 'Input cannot start with a space.';
  }
  if (/^[^A-Za-z0-9]/.test(v)) {
    return overrides?.startSpecial || 'Input cannot start with a special character.';
  }
  if (MULTIPLE_SPACES_REGEX.test(v)) {
    return overrides?.multipleSpaces || 'Multiple consecutive spaces are not allowed.';
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9\s]*$/.test(v)) {
    return overrides?.alphaOnly || 'Only alphabets, numbers, and spaces are allowed.';
  }

  return '';
}

/**
 * Validate an address field.
 * Rules: required, no leading space/special, min/max length,
 *        allowed chars, not digits-only, not special-only.
 */
export function validateAddress(
  value: string,
  required: boolean,
  minLength: number = 10,
  maxLength: number = 250,
  overrides?: Record<string, string>,
): string {
  const trimmed = value.trim();

  if (required && !trimmed) {
    return overrides?.required || 'This field is required.';
  }
  if (!trimmed) return '';

  if (value.startsWith(' ')) {
    return overrides?.startSpace || 'Address cannot start with a space.';
  }
  if (/^[^A-Za-z0-9]/.test(value)) {
    return overrides?.startSpecial || 'Address cannot start with a special character.';
  }
  if (trimmed.length < minLength) {
    return overrides?.minLength || `Address must contain at least ${minLength} characters.`;
  }
  if (trimmed.length > maxLength) {
    return overrides?.maxLength || `Address cannot exceed ${maxLength} characters.`;
  }
  if (ONLY_DIGITS_REGEX.test(trimmed)) {
    return overrides?.format || 'Please enter a valid address.';
  }
  if (ONLY_SPECIAL_REGEX.test(trimmed)) {
    return overrides?.format || 'Please enter a valid address.';
  }
  if (!ADDRESS_CHARS_REGEX.test(trimmed)) {
    return overrides?.format || 'Please enter a valid address.';
  }

  return '';
}

/**
 * Validate a PAN number.
 * Format: ABCDE1234F
 */
export function validatePan(
  value: string,
  required: boolean,
  overrides?: Record<string, string>,
): string {
  const v = value.trim();

  if (required && !v) {
    return overrides?.required || 'This field is required.';
  }
  if (!v) return '';

  if (!PAN_REGEX.test(v.toUpperCase())) {
    return overrides?.format || 'Enter a valid PAN number.';
  }

  return '';
}

/**
 * Validate an Aadhaar number.
 * Must be exactly 12 digits.
 */
export function validateAadhaar(
  value: string,
  required: boolean,
  overrides?: Record<string, string>,
): string {
  const v = value.trim();

  if (required && !v) {
    return overrides?.required || 'This field is required.';
  }
  if (!v) return '';

  if (!AADHAAR_REGEX.test(v)) {
    return overrides?.format || 'Aadhaar Number must contain exactly 12 digits.';
  }

  return '';
}

/**
 * Validate a mobile number.
 * Must be exactly 10 digits, starting with 6-9.
 */
export function validateMobileNumber(
  value: string,
  required: boolean,
  overrides?: Record<string, string>,
): string {
  const v = value.trim();

  if (required && !v) {
    return overrides?.required || 'Mobile Number is required.';
  }
  if (!v) return '';

  if (!/^\d+$/.test(v)) {
    return overrides?.format || 'Mobile Number must contain exactly 10 digits.';
  }
  if (v.length !== 10) {
    return overrides?.format || 'Mobile Number must contain exactly 10 digits.';
  }
  if (!MOBILE_REGEX.test(v)) {
    return overrides?.format || 'Mobile Number must start with 6, 7, 8, or 9.';
  }

  return '';
}

/**
 * Validate a phone/landline number.
 * Must be 10 to 15 digits.
 */
export function validatePhone(
  value: string,
  overrides?: Record<string, string>,
): string {
  const v = value.trim();
  if (!v) return '';

  if (!PHONE_REGEX.test(v)) {
    return overrides?.format || 'Phone number must contain 10 to 15 digits.';
  }

  return '';
}

/**
 * Validate a date field.
 * Options: noFuture (block future dates), minAge (minimum age in years).
 */
export function validateDate(
  value: string,
  required: boolean,
  opts?: { noFuture?: boolean; minAge?: number; maxAge?: number },
  overrides?: Record<string, string>,
): string {
  const v = value.trim();

  if (required && !v) {
    return overrides?.required || 'This field is required.';
  }
  if (!v) return '';

  const date = new Date(v + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return overrides?.format || 'Please enter a valid date.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (opts?.noFuture && date > today) {
    return overrides?.noFuture || 'Date cannot be a future date.';
  }

  if (opts?.minAge) {
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    const meetsAge =
      age > opts.minAge ||
      (age === opts.minAge && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
    if (!meetsAge) {
      return overrides?.minAge || `Applicant must be at least ${opts.minAge} years old.`;
    }
  }

  if (opts?.maxAge) {
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    const exactAge =
      age > 0 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0))
        ? age - 1
        : age;
    if (exactAge > opts.maxAge) {
      return overrides?.maxAge || `Applicant must not be older than ${opts.maxAge} years.`;
    }
  }

  return '';
}

/**
 * Validate a select/dropdown field.
 */
export function validateSelect(
  value: string,
  required: boolean,
  overrides?: Record<string, string>,
): string {
  if (required && !value?.trim()) {
    return overrides?.required || 'This field is required.';
  }
  return '';
}

/**
 * Validate an area/decimal field.
 * Options: maxDecimals, minValue.
 */
export function validateArea(
  value: string,
  required: boolean,
  opts?: { maxDecimals?: number; minValue?: number },
  overrides?: Record<string, string>,
): string {
  const v = value.trim();

  if (required && !v) {
    return overrides?.required || 'This field is required.';
  }
  if (!v) return '';

  if (!/^\d/.test(v)) {
    return overrides?.format || 'Enter a valid positive value.';
  }

  const maxDec = opts?.maxDecimals ?? 2;
  const decimalCheck = new RegExp(`\\.\\d{${maxDec + 1},}`);
  if (decimalCheck.test(v)) {
    return overrides?.maxLength || `Value can contain up to ${maxDec} decimal places only.`;
  }

  const areaRegex = new RegExp(`^\\d+(\\.\\d{1,${maxDec}})?$`);
  if (!areaRegex.test(v)) {
    return overrides?.format || 'Enter a valid positive value.';
  }

  const minVal = opts?.minValue ?? 0;
  if (parseFloat(v) <= minVal) {
    return overrides?.format || `Value must be greater than ${minVal}.`;
  }

  return '';
}

/**
 * Validate a generic number field.
 */
export function validateNumber(
  value: string,
  required: boolean,
  overrides?: Record<string, string>,
): string {
  const v = value.trim();

  if (required && !v) {
    return overrides?.required || 'This field is required.';
  }
  if (!v) return '';

  if (isNaN(Number(v))) {
    return overrides?.format || 'Please enter a valid number.';
  }

  return '';
}
