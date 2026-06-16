/**
 * Validates if a string is a valid mobile number (10 digits starting with 6-9).
 * @param mobile Mobile number to validate
 * @returns boolean
 */
export const validateMobile = (mobile: string): boolean => {
  if (!mobile) return false;
  const regex = /^[6-9]\d{9}$/;
  return regex.test(mobile);
};

/**
 * Validates if a string is a valid email address.
 * @param email Email to validate
 * @returns boolean
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validates if a string is a valid PAN card number (10 characters: 5 letters, 4 digits, 1 letter).
 * @param pan PAN to validate
 * @returns boolean
 */
export const validatePan = (pan: string): boolean => {
  if (!pan) return false;
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan.toUpperCase());
};

/**
 * Validates if a string is a valid Aadhaar number (12 digits).
 * @param aadhar Aadhaar to validate
 * @returns boolean
 */
export const validateAadhar = (aadhar: string): boolean => {
  if (!aadhar) return false;
  const regex = /^\d{12}$/;
  return regex.test(aadhar);
};
