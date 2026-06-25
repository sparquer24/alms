// ─── Validation Field Types ──────────────────────────────────────────────────
//
// Schema-driven validation system. Each form step defines a FieldRule[] config
// and the engine handles validation, input filtering, and error messages.

/**
 * Supported field validation types.
 * Each type maps to a specific validator + input filter.
 */
export type FieldType =
  | 'text'      // Alphabets + spaces only (names, occupation)
  | 'address'   // Alphanumeric + spaces + , / - . (addresses)
  | 'pan'       // PAN format: ABCDE1234F
  | 'aadhaar'   // 12-digit number
  | 'mobile'    // 10-digit number starting with 6-9
  | 'phone'     // 10-15 digit number (landline/residence)
  | 'date'      // Date with optional future-block, min-age, and max-age
  | 'select'    // Dropdown / radio selection
  | 'area'      // Positive number with optional decimal places
  | 'number'    // Generic numeric input
  | 'custom';   // Escape hatch — uses customValidator only

/**
 * Defines validation rules for a single form field.
 */
export interface FieldRule {
  /** The field name (must match form state key) */
  name: string;

  /** The validation type — determines which validator + filter to use */
  type: FieldType;

  /** Whether the field is mandatory */
  required?: boolean;

  /** Human-readable label (used in generic error messages) */
  label?: string;

  /** Override default error messages for specific validation checks */
  errorMessages?: Partial<{
    required: string;
    format: string;
    minLength: string;
    maxLength: string;
    startSpace: string;
    startSpecial: string;
    startNumber: string;
    multipleSpaces: string;
    alphaOnly: string;
    minAge: string;
    maxAge: string;
    noFuture: string;
    matchField: string;
  }>;

  // ─── Type-specific options ──────────────────────────────────────────────

  /** Minimum character length (for 'address' type) */
  minLength?: number;

  /** Maximum character length (for 'address' type) */
  maxLength?: number;

  /** Minimum age in years (for 'date' type) */
  minAge?: number;

  /** Maximum age in years (for 'date' type) */
  maxAge?: number;

  /** Disallow future dates (for 'date' type) */
  noFuture?: boolean;

  /** Maximum decimal places (for 'area' type) */
  maxDecimals?: number;

  /** Minimum value (for 'area' / 'number' type) */
  minValue?: number;

  /** Field name whose value this field must NOT equal (e.g. alt mobile ≠ mobile) */
  notEqualField?: string;

  /** Field name that must have a value before this field can be validated (e.g. district requires state) */
  dependsOn?: string;

  /** Error message when the dependsOn field is empty */
  dependsOnMessage?: string;

  /**
   * Conditional predicate — if provided, the rule is only active when
   * this function returns true. Receives the entire form state.
   */
  condition?: (form: any) => boolean;

  /**
   * Custom validator — escape hatch for complex/unique validation logic.
   * Receives the field value and entire form state.
   * Return an error message string, or empty string if valid.
   */
  customValidator?: (value: any, form: any) => string;
}

/**
 * Result of processing a field change or blur event.
 */
export interface ProcessResult {
  /** The filtered/processed value to store in form state */
  value: string;
  /** The validation error message (empty string if valid) */
  error: string;
}
