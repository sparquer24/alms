// ─── Validation Module — Public API ──────────────────────────────────────────
//
// Re-exports everything for convenient imports:
//   import { FieldRule, validateForm, filterText } from '@/utils/validation';

export type { FieldRule, FieldType, ProcessResult } from './types';

export {
  validateText,
  validateGeneralText,
  validateAddress,
  validatePan,
  validateAadhaar,
  validateMobileNumber,
  validatePhone,
  validateDate,
  validateSelect,
  validateArea,
  validateNumber,
  // Regex constants
  TEXT_FIELD_REGEX,
  MULTIPLE_SPACES_REGEX,
  ADDRESS_CHARS_REGEX,
  ONLY_DIGITS_REGEX,
  ONLY_SPECIAL_REGEX,
  PAN_REGEX,
  AADHAAR_REGEX,
  MOBILE_REGEX,
  PHONE_REGEX,
  AREA_REGEX,
} from './validators';

export {
  filterText,
  filterPan,
  filterDigits,
  filterArea,
  filterAlphaNumeric,
  filterNone,
} from './inputFilters';

export {
  validateField,
  validateForm,
  isFormValid,
  filterInput,
  getFilter,
  getActiveRules,
  processFieldChange,
  processFieldBlur,
} from './engine';
