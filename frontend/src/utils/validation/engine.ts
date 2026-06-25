// ─── Validation Engine ───────────────────────────────────────────────────────
//
// Core engine that processes FieldRule[] schemas. This is the bridge between
// the declarative rule configs and the pure validator/filter functions.

import { FieldRule, FieldType, ProcessResult } from './types';
import {
  validateText,
  validateAddress,
  validatePan,
  validateAadhaar,
  validateMobileNumber,
  validatePhone,
  validateDate,
  validateSelect,
  validateArea,
  validateNumber,
} from './validators';
import {
  filterText,
  filterPan,
  filterDigits,
  filterArea,
  filterNone,
} from './inputFilters';

// ─── Input Filter Mapping ─────────────────────────────────────────────────────

const FILTER_MAP: Record<FieldType, (value: string) => string> = {
  text: filterText,
  address: filterNone,
  pan: filterPan,
  aadhaar: filterDigits,
  mobile: filterDigits,
  phone: filterDigits,
  date: filterNone,
  select: filterNone,
  area: filterArea,
  number: filterNone,
  custom: filterNone,
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Get the input filter function for a field type.
 */
export function getFilter(type: FieldType): (value: string) => string {
  return FILTER_MAP[type] || filterNone;
}

/**
 * Filter an input value based on the field's rule.
 */
export function filterInput(rule: FieldRule, value: string): string {
  return getFilter(rule.type)(value);
}

/**
 * Validate a single field value against its rule.
 * Returns an error message string (empty = valid).
 */
export function validateField(rule: FieldRule, value: any, form: any): string {
  const required = rule.required ?? false;
  const overrides = rule.errorMessages as Record<string, string> | undefined;

  // Dependency check (e.g. district depends on state)
  if (rule.dependsOn && !form[rule.dependsOn]?.trim?.()) {
    if (required) {
      return rule.dependsOnMessage || `Please select ${rule.dependsOn} first.`;
    }
    return '';
  }

  // Not-equal cross-field check (e.g. alt mobile ≠ primary mobile)
  if (rule.notEqualField && value?.trim?.() && form[rule.notEqualField]?.trim?.()) {
    if (value.trim() === form[rule.notEqualField].trim()) {
      return overrides?.matchField || `${rule.label || 'This field'} cannot be the same as ${rule.notEqualField}.`;
    }
  }

  // Custom validator (escape hatch)
  if (rule.customValidator) {
    const customErr = rule.customValidator(value, form);
    if (customErr) return customErr;
    // If custom validator passes and type is 'custom', we're done
    if (rule.type === 'custom') return '';
  }

  // Type-specific validation
  const strValue = typeof value === 'string' ? value : String(value ?? '');

  switch (rule.type) {
    case 'text':
      return validateText(strValue, required, overrides);

    case 'address':
      return validateAddress(
        strValue,
        required,
        rule.minLength ?? 10,
        rule.maxLength ?? 250,
        overrides,
      );

    case 'pan':
      return validatePan(strValue, required, overrides);

    case 'aadhaar':
      return validateAadhaar(strValue, required, overrides);

    case 'mobile':
      return validateMobileNumber(strValue, required, overrides);

    case 'phone':
      return validatePhone(strValue, overrides);

    case 'date':
      return validateDate(
        strValue,
        required,
        { noFuture: rule.noFuture, minAge: rule.minAge, maxAge: rule.maxAge },
        overrides,
      );

    case 'select':
      return validateSelect(strValue, required, overrides);

    case 'area':
      return validateArea(
        strValue,
        required,
        { maxDecimals: rule.maxDecimals, minValue: rule.minValue },
        overrides,
      );

    case 'number':
      return validateNumber(strValue, required, overrides);

    case 'custom':
      // Already handled above — required check only
      if (required && !strValue.trim()) {
        return overrides?.required || 'This field is required.';
      }
      return '';

    default:
      return '';
  }
}

/**
 * Get only the active rules (those whose conditions are met).
 */
export function getActiveRules(rules: FieldRule[], form: any): FieldRule[] {
  return rules.filter((rule) => {
    if (rule.condition) {
      return rule.condition(form);
    }
    return true;
  });
}

/**
 * Validate the entire form against all active rules.
 * Returns a Record<fieldName, errorMessage> (only fields with errors).
 */
export function validateForm(
  rules: FieldRule[],
  form: any,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const activeRules = getActiveRules(rules, form);

  for (const rule of activeRules) {
    const value = form[rule.name];
    const error = validateField(rule, value, form);
    if (error) {
      errors[rule.name] = error;
    }
  }

  return errors;
}

/**
 * Check if the entire form is valid against all active rules.
 */
export function isFormValid(rules: FieldRule[], form: any): boolean {
  return Object.keys(validateForm(rules, form)).length === 0;
}

/**
 * Process a field change: filter input + validate in real time.
 */
export function processFieldChange(
  rules: FieldRule[],
  name: string,
  value: string,
  form: any,
): ProcessResult {
  const rule = rules.find((r) => r.name === name);
  if (!rule) {
    return { value, error: '' };
  }

  // Check if rule is active
  if (rule.condition && !rule.condition(form)) {
    return { value, error: '' };
  }

  const filteredValue = filterInput(rule, value);
  const error = validateField(rule, filteredValue, form);
  return { value: filteredValue, error };
}

/**
 * Process a field blur: trim + re-validate.
 */
export function processFieldBlur(
  rules: FieldRule[],
  name: string,
  value: string,
  form: any,
): ProcessResult {
  const rule = rules.find((r) => r.name === name);
  if (!rule) {
    return { value: value.trim(), error: '' };
  }

  // Check if rule is active
  if (rule.condition && !rule.condition(form)) {
    return { value: value.trim(), error: '' };
  }

  const trimmedValue = value.trim();
  const error = validateField(rule, trimmedValue, form);
  return { value: trimmedValue, error };
}
