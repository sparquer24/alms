import { apiClient } from '../config/authenticatedApiClient';
import { patchData } from './axiosConfig';

export interface RenewalFileUploadRequest {
  fileType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  description?: string;
}

export interface RenewalFileUploadResponse {
  id: number;
  applicationId: number;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt?: string;
}

const RENEWAL_FILE_TYPE_MAP: Record<string, string> = {
  idProofUploaded: 'AADHAR_CARD',
  panCardUploaded: 'PAN_CARD',
  trainingCertificateUploaded: 'TRAINING_CERTIFICATE',
  medicalCertificateUploaded: 'MEDICAL_REPORT',
  otherStateLicenseUploaded: 'OTHER_STATE_LICENSE',
  existingArmsLicenseUploaded: 'EXISTING_LICENSE',
  safeCustodyUploaded: 'SAFE_CUSTODY',
  photographUploaded: 'PHOTOGRAPH',
  selectedFingerprint: 'SIGNATURE_THUMB',
  signature: 'SIGNATURE_THUMB',
  irisScan: 'IRIS_SCAN',
  claimDocsUploaded: 'CLAIM_DOCS',
  rejectedLicenseUploaded: 'REJECTED_LICENSE',
  otherUploaded: 'OTHER',
  addressProofUploaded: 'OTHER',
  characterCertificateUploaded: 'OTHER',
};

export class RenewalService {
  private static normalizeFileType(fileType: string): string {
    const trimmed = fileType?.trim();
    if (!trimmed) return 'OTHER';

    if (Object.values(RENEWAL_FILE_TYPE_MAP).includes(trimmed)) {
      return trimmed;
    }

    return RENEWAL_FILE_TYPE_MAP[trimmed] || 'OTHER';
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        resolve('');
      };
      reader.onerror = () => reject(new Error('Failed to read file for upload'));
      reader.readAsDataURL(file);
    });
  }

  static async findRenewalByLicenseNumber(
    licenseNumber: string,
  ): Promise<{ licenseNumber?: string; [key: string]: unknown } | null> {
    if (!licenseNumber?.trim()) return null;

    const response = await apiClient.get<{ data?: Array<{ licenseNumber?: string; [key: string]: unknown }> }>(
      '/renewal-forms',
      {
      search: licenseNumber.trim(),
      limit: 25,
      page: 1,
      },
    );

    const items = response?.data ?? response ?? [];
    const list = Array.isArray(items) ? items : [];

    const normalizedLicense = licenseNumber.trim().toLowerCase();
    return (
      list.find((item) => String(item?.licenseNumber || '').toLowerCase() === normalizedLicense) ||
      list.find((item) => String(item?.licenseNumber || '').toLowerCase().includes(normalizedLicense)) ||
      null
    );
  }

  static async createRenewalForm(payload: Record<string, any>): Promise<any> {
    return apiClient.post('/renewal-forms', payload);
  }

  static async getRenewalForm(applicationId: string | number): Promise<any> {
    return apiClient.get(`/renewal-forms/${applicationId}`);
  }

  static async updateRenewalForm(
    applicationId: string | number,
    payload: Record<string, any>,
    options?: { isSubmit?: boolean },
  ): Promise<any> {
    const query = typeof options?.isSubmit === 'boolean' ? `?isSubmit=${options.isSubmit}` : '';
    return patchData(`/renewal-forms/${applicationId}${query}`, payload);
  }

  static async uploadDocument(
    applicationId: string | number,
    fileType: string,
    file: File,
  ): Promise<RenewalFileUploadResponse> {
    const fileUrl = await this.fileToBase64(file);
    return this.uploadDocumentPayload(applicationId, fileType, {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  }

  static async uploadDocumentPayload(
    applicationId: string | number,
    fileType: string,
    payload: Omit<RenewalFileUploadRequest, 'fileType'> | RenewalFileUploadRequest,
  ): Promise<RenewalFileUploadResponse> {
    const payloadFileType = 'fileType' in payload && payload.fileType ? payload.fileType : fileType;

    return apiClient.post(`/renewal-forms/${applicationId}/upload-file`, {
      ...payload,
      fileType: this.normalizeFileType(payloadFileType),
    });
  }

  static async deleteRenewalFile(fileId: string | number): Promise<any> {
    return apiClient.delete(`/renewal-forms/file/${fileId}`);
  }
}

export default RenewalService;