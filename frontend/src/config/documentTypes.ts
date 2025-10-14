/**
 * Document Type Mapping
 * Maps frontend document type display names to backend FileType enum values
 */

export interface DocumentTypeMapping {
  displayName: string;
  fileType: string;
  acceptedTypes: string;
  maxSize: number; // in MB
  description: string;
}

export const DOCUMENT_TYPE_MAPPING: Record<string, DocumentTypeMapping> = {
  'Aadhar Card': {
    displayName: 'Aadhar Card',
    fileType: 'AADHAR_CARD',
    acceptedTypes: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10,
    description: 'Upload your Aadhar Card (front and back)'
  },
  'PAN Card': {
    displayName: 'PAN Card',
    fileType: 'PAN_CARD',
    acceptedTypes: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10,
    description: 'Upload your PAN Card'
  },
  'Training certificate': {
    displayName: 'Training Certificate',
    fileType: 'TRAINING_CERTIFICATE',
    acceptedTypes: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10,
    description: 'Upload your training certificate'
  },
  'Other state Arms License': {
    displayName: 'Other State Arms License',
    fileType: 'OTHER_STATE_LICENSE',
    acceptedTypes: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10,
    description: 'Upload other state arms license'
  },
  'Existing Arms License': {
    displayName: 'Existing Arms License',
    fileType: 'EXISTING_LICENSE',
    acceptedTypes: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10,
    description: 'Upload existing arms license'
  },
  'Safe custody': {
    displayName: 'Safe Custody',
    fileType: 'SAFE_CUSTODY',
    acceptedTypes: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10,
    description: 'Upload safe custody documents'
  },
  'Medical Reports': {
    displayName: 'Medical Reports',
    fileType: 'MEDICAL_REPORT',
    acceptedTypes: '.jpg,.jpeg,.png,.pdf',
    maxSize: 10,
    description: 'Upload medical reports'
  }
};

/**
 * Get FileType enum value from display name
 * @param displayName - The display name shown in UI
 * @returns The corresponding FileType enum value
 */
export const getFileTypeFromDisplayName = (displayName: string): string => {
  const mapping = DOCUMENT_TYPE_MAPPING[displayName];
  if (!mapping) {
    console.warn(`Unknown document type: ${displayName}`);
    return 'OTHER';
  }
  return mapping.fileType;
};

/**
 * Get document type configuration from display name
 * @param displayName - The display name shown in UI
 * @returns The document type configuration
 */
export const getDocumentTypeConfig = (displayName: string): DocumentTypeMapping | null => {
  return DOCUMENT_TYPE_MAPPING[displayName] || null;
};

/**
 * Get all document types as array
 * @returns Array of all document type configurations
 */
export const getAllDocumentTypes = (): DocumentTypeMapping[] => {
  return Object.values(DOCUMENT_TYPE_MAPPING);
};

/**
 * Validate file against document type constraints
 * @param file - The file to validate
 * @param displayName - The document type display name
 * @returns Validation result with error message if invalid
 */
export const validateFileForDocumentType = (
  file: File,
  displayName: string
): { isValid: boolean; error?: string } => {
  const config = getDocumentTypeConfig(displayName);
  
  if (!config) {
    return { isValid: false, error: 'Unknown document type' };
  }

  // Check file size (convert MB to bytes)
  const maxSizeBytes = config.maxSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size must be less than ${config.maxSize}MB` 
    };
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const acceptedTypes = config.acceptedTypes.split(',');
  
  if (!acceptedTypes.includes(fileExtension)) {
    return { 
      isValid: false, 
      error: `File type not supported. Accepted types: ${config.acceptedTypes}` 
    };
  }

  return { isValid: true };
};