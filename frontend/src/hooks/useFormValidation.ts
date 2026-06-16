// ─── useFormValidation Hook ──────────────────────────────────────────────────
//
// React hook that wraps the validation engine for use in form components.
// Provides: processChange, processBlur, validateAll, isValid, getRule.

import { useMemo, useCallback } from 'react';
import { FieldRule, ProcessResult } from '../utils/validation/types';
import {
  processFieldChange,
  processFieldBlur,
  validateForm,
  isFormValid as checkIsFormValid,
  getActiveRules,
} from '../utils/validation/engine';

/**
 * Hook that provides validation methods for a form step.
 *
 * Usage:
 * ```tsx
 * const rules: FieldRule[] = [
 *   { name: 'firstName', type: 'text', required: true },
 *   { name: 'panNumber', type: 'pan', required: true },
 * ];
 * const validation = useFormValidation(rules);
 * ```
 */
export function useFormValidation(rules: FieldRule[]) {
  /**
   * Process a field change event (real-time validation + input filtering).
   * Returns the filtered value and error message.
   */
  const processChange = useCallback(
    (name: string, value: string, form: any): ProcessResult => {
      return processFieldChange(rules, name, value, form);
    },
    [rules],
  );

  /**
   * Process a field blur event (trim + re-validate).
   * Returns the trimmed value and error message.
   */
  const processBlur = useCallback(
    (name: string, value: string, form: any): ProcessResult => {
      return processFieldBlur(rules, name, value, form);
    },
    [rules],
  );

  /**
   * Validate the entire form (for submit-time validation).
   * Returns a Record<fieldName, errorMessage>.
   */
  const validateAll = useCallback(
    (form: any): Record<string, string> => {
      return validateForm(rules, form);
    },
    [rules],
  );

  /**
   * Check if the form is valid (for disabling buttons).
   */
  const isValid = useCallback(
    (form: any): boolean => {
      return checkIsFormValid(rules, form);
    },
    [rules],
  );

  /**
   * Get the rule definition for a specific field.
   * Useful for checking if a field is required in JSX.
   */
  const getRule = useCallback(
    (name: string): FieldRule | undefined => {
      return rules.find((r) => r.name === name);
    },
    [rules],
  );

  /**
   * Check if a specific field is required (considering conditions).
   */
  const isRequired = useCallback(
    (name: string, form: any): boolean => {
      const rule = rules.find((r) => r.name === name);
      if (!rule) return false;
      if (rule.condition && !rule.condition(form)) return false;
      return rule.required ?? false;
    },
    [rules],
  );

  return {
    processChange,
    processBlur,
    validateAll,
    isValid,
    getRule,
    isRequired,
  };
}
