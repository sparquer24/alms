export interface DocumentTypeDefinition {
  key: string;
  label: string;
  aliases: string[];
  keywords: string[];
  requiredPatterns?: RegExp[];
  exclusivePatterns?: RegExp[];
  minConfidence: number;
}

export const DOCUMENT_TYPES: Record<string, DocumentTypeDefinition> = {
  AADHAAR: {
    key: 'AADHAAR',
    label: 'Aadhaar Card',
    aliases: ['AADHAAR', 'AADHAR', 'AADHAR_CARD', 'AADHAAR_CARD', 'UIDAI', 'Aadhar Card', 'Aadhaar Card'],
    keywords: [
      'government of india',
      'govt of india',
      'unique identification authority of india',
      'uidai',
      'aadhaar',
      'aadhar',
      'mera aadhaar',
      'meri pehchan',
      'enrolment no',
      'enrolment',
      'vid',
      'vid:',
      'help@uidai.gov.in',
      'www.uidai.gov.in',
      'male',
      'female',
      'dob',
      'year of birth',
      'date of birth',
    ],
    requiredPatterns: [
      /\b\d{4}\s\d{4}\s\d{4}\b/, // Standard 4 4 4 Aadhaar grouping
      /\b\d{12}\b/,             // 12 continuous digits
      /\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/, // 16 digit VID
    ],
    exclusivePatterns: [
      /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i, // PAN pattern
    ],
    minConfidence: 0.6,
  },
  PAN: {
    key: 'PAN',
    label: 'PAN Card',
    aliases: ['PAN', 'PAN_CARD', 'PAN Card', 'INCOME_TAX', 'INCOME TAX'],
    keywords: [
      'income tax department',
      'income tax',
      'govt. of india',
      'govt of india',
      'government of india',
      'permanent account number',
      'permanent account number card',
      'father',
      "father's name",
      'signature',
      'date of birth',
      'pan',
      'incometax',
    ],
    requiredPatterns: [
      /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i, // 5 letters, 4 numbers, 1 letter
    ],
    exclusivePatterns: [
      /\b\d{4}\s\d{4}\s\d{4}\b/, // Aadhaar 4 4 4 pattern
    ],
    minConfidence: 0.6,
  },
  TRAINING_CERTIFICATE: {
    key: 'TRAINING_CERTIFICATE',
    label: 'Training Certificate',
    aliases: ['TRAINING_CERTIFICATE', 'Training certificate', 'Training Certificate'],
    keywords: [
      'training certificate',
      'arms training',
      'firearms training',
      'shooting',
      'rifle club',
      'target shooting',
      'certificate of training',
      'successfully completed',
    ],
    minConfidence: 0.5,
  },
  MEDICAL_REPORT: {
    key: 'MEDICAL_REPORT',
    label: 'Medical Report',
    aliases: ['MEDICAL_REPORT', 'Medical Reports', 'Medical Certificate', 'MEDICAL_CERTIFICATE'],
    keywords: [
      'medical report',
      'medical certificate',
      'medical examination',
      'doctor',
      'registered medical practitioner',
      'fitness certificate',
      'sound mind',
      'physical fitness',
    ],
    minConfidence: 0.5,
  },
  EXISTING_LICENSE: {
    key: 'EXISTING_LICENSE',
    label: 'Existing Arms License',
    aliases: ['EXISTING_LICENSE', 'Existing Arms License', 'Existing Arms License (license being renewed)'],
    keywords: [
      'arms license',
      'arms act',
      'license no',
      'licence no',
      'weapon',
      'validity',
      'police station',
      'licensing authority',
    ],
    minConfidence: 0.5,
  },
  OTHER_STATE_LICENSE: {
    key: 'OTHER_STATE_LICENSE',
    label: 'Other State Arms License',
    aliases: ['OTHER_STATE_LICENSE', 'Other state Arms License', 'Other state Arms License (optional)'],
    keywords: [
      'arms license',
      'other state',
      'area of validity',
      'all india',
      'state license',
    ],
    minConfidence: 0.5,
  },
  SAFE_CUSTODY: {
    key: 'SAFE_CUSTODY',
    label: 'Safe Custody Document',
    aliases: ['SAFE_CUSTODY', 'Safe custody', 'Safe custody (optional)'],
    keywords: [
      'safe custody',
      'custody certificate',
      'armoury',
      'gunsmith',
      'deposited',
    ],
    minConfidence: 0.5,
  },
};

/**
 * Resolves an arbitrary string type or key to a canonical DocumentTypeDefinition key.
 */
export function normalizeDocumentTypeKey(rawType: string): string | null {
  if (!rawType) return null;
  const cleaned = rawType.trim().toUpperCase().replace(/[\s-]+/g, '_');

  for (const [key, def] of Object.entries(DOCUMENT_TYPES)) {
    if (key === cleaned) return key;
    if (def.aliases.some((a) => a.trim().toUpperCase().replace(/[\s-]+/g, '_') === cleaned)) {
      return key;
    }
  }

  // Common fallbacks
  if (cleaned.includes('AADHAAR') || cleaned.includes('AADHAR')) return 'AADHAAR';
  if (cleaned.includes('PAN')) return 'PAN';

  return null;
}

/**
 * Documents that are eligible for OCR and document classification.
 * Restricted strictly to Aadhaar Card and PAN Card.
 */
export const OCR_ENABLED_DOCUMENT_TYPES = ['AADHAAR', 'PAN'] as const;

export function isOcrClassificationEnabled(rawType: string): boolean {
  const canonical = normalizeDocumentTypeKey(rawType);
  return canonical === 'AADHAAR' || canonical === 'PAN';
}
