import axiosInstance from '../api/axiosConfig';
import { getAuthTokenFromCookie } from '../utils/authCookies';

export type DocumentValidationStatus =
  | 'DOCUMENT_ACCEPTED'
  | 'DOCUMENT_MISMATCH'
  | 'REVIEW_REQUIRED'
  | 'UNREADABLE'
  | 'INVALID_FILE';

export interface DocumentValidationResult {
  success: boolean;
  status: DocumentValidationStatus;
  expectedType: string;
  detectedType: string;
  confidence: number;
  message: string;
  filePath?: string;
}

export const OCR_ENABLED_DOCUMENT_TYPES = ['AADHAAR', 'PAN'] as const;

export class DocumentValidationService {
  /**
   * Check if a document type is eligible for OCR and document classification.
   * Strictly restricted to Aadhaar Card and PAN Card only.
   */
  static isOcrEligible(docTypeOrKey: string): boolean {
    const canonical = this.mapFormDocTypeToExpectedType(docTypeOrKey);
    return canonical === 'AADHAAR' || canonical === 'PAN';
  }

  /**
   * Alias for checking whether content-based OCR validation should be executed.
   */
  static shouldValidateDocumentContent(docTypeOrKey: string): boolean {
    return this.isOcrEligible(docTypeOrKey);
  }

  /**
   * Map UI display name or field key to expected document type code
   */
  static mapFormDocTypeToExpectedType(docType: string): string {
    const normalized = (docType || '').trim().toLowerCase();

    if (normalized.includes('aadhar') || normalized.includes('aadhaar') || normalized.includes('idproof')) {
      return 'AADHAAR';
    }
    if (normalized.includes('pan')) {
      return 'PAN';
    }
    if (normalized.includes('training')) {
      return 'TRAINING_CERTIFICATE';
    }
    if (normalized.includes('medical')) {
      return 'MEDICAL_REPORT';
    }
    if (normalized.includes('other state') || normalized.includes('otherstate')) {
      return 'OTHER_STATE_LICENSE';
    }
    if (normalized.includes('existing') || normalized.includes('existingarms')) {
      return 'EXISTING_LICENSE';
    }
    if (normalized.includes('safe custody') || normalized.includes('safecustody')) {
      return 'SAFE_CUSTODY';
    }

    return 'OTHER';
  }

  /**
   * Validate uploaded file content against expected document type
   */
  static async validateDocument(
    file: File,
    expectedDocType: string,
  ): Promise<DocumentValidationResult> {
    const canonicalType = this.mapFormDocTypeToExpectedType(expectedDocType);

    // Completely bypass OCR processing and classification for excluded documents
    if (!this.isOcrEligible(expectedDocType)) {
      return {
        success: true,
        status: 'DOCUMENT_ACCEPTED',
        expectedType: canonicalType,
        detectedType: canonicalType,
        confidence: 1.0,
        message: 'Document accepted without OCR validation.',
      };
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('expectedDocumentType', canonicalType);

    const token = getAuthTokenFromCookie();
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await axiosInstance.post('/documents/validate', formData, {
        headers,
      });

      const data = response?.data || response;
      return {
        success: data?.success ?? true,
        status: data?.status || 'DOCUMENT_ACCEPTED',
        expectedType: data?.expectedType || canonicalType,
        detectedType: data?.detectedType || canonicalType,
        confidence: data?.confidence ?? 1.0,
        message: data?.message || 'Document accepted',
      };
    } catch (error: any) {
      const respData = error?.response?.data;
      if (respData && respData.status) {
        return {
          success: respData.success ?? false,
          status: respData.status as DocumentValidationStatus,
          expectedType: respData.expectedType || canonicalType,
          detectedType: respData.detectedType || 'UNKNOWN',
          confidence: respData.confidence ?? 0,
          message: respData.message || error.message || 'Validation failed',
        };
      }

      // Fallback error result
      return {
        success: false,
        status: 'UNREADABLE',
        expectedType: canonicalType,
        detectedType: 'UNKNOWN',
        confidence: 0,
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to validate document with server.',
      };
    }
  }

  /**
   * Validate and permanently upload an accepted document
   */
  static async uploadDocument(
    file: File,
    expectedDocType: string,
  ): Promise<DocumentValidationResult> {
    const canonicalType = this.mapFormDocTypeToExpectedType(expectedDocType);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('expectedDocumentType', canonicalType);

    const token = getAuthTokenFromCookie();
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await axiosInstance.post('/documents/upload', formData, {
        headers,
      });

      const data = response?.data || response;
      return {
        success: data?.success ?? true,
        status: data?.status || 'DOCUMENT_ACCEPTED',
        expectedType: data?.expectedType || canonicalType,
        detectedType: data?.detectedType || canonicalType,
        confidence: data?.confidence ?? 1.0,
        message: data?.message || 'Document validated and saved',
        filePath: data?.filePath,
      };
    } catch (error: any) {
      const respData = error?.response?.data;
      if (respData && respData.status) {
        return {
          success: respData.success ?? false,
          status: respData.status as DocumentValidationStatus,
          expectedType: respData.expectedType || canonicalType,
          detectedType: respData.detectedType || 'UNKNOWN',
          confidence: respData.confidence ?? 0,
          message: respData.message || error.message,
        };
      }

      return {
        success: false,
        status: 'INVALID_FILE',
        expectedType: canonicalType,
        detectedType: 'UNKNOWN',
        confidence: 0,
        message: error?.response?.data?.message || error?.message || 'Upload failed',
      };
    }
  }
}
