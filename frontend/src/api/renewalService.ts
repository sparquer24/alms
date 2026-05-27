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

  /**
   * Get all statuses and available actions for workflow
   */
  static async getWorkflowStatusesAndActions(): Promise<any> {
    return apiClient.get('/workflow/statuses-actions');
  }

  /**
   * Get renewal applications - fetch applications by type
   */
  static async getRenewalApplications(filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any> {
    const params = new URLSearchParams({
      applicationType: 'RenewalApplicationForm',
      ...(filters?.page && { page: String(filters.page) }),
      ...(filters?.limit && { limit: String(filters.limit) }),
      ...(filters?.status && { status: filters.status }),
    });
    
    return apiClient.get(`/workflow/applications?${params.toString()}`);
  }

  /**
   * Handle workflow action (forward, approve, reject, etc.) on renewal application
   * @param applicationId - Application ID to perform action on
   * @param actionId - Action ID from Actiones table
   * @param nextUserId - User ID to forward/assign to (required for forward action)
   * @param remarks - Remarks/comments for the action
   * @param attachments - Optional attachments array
   * @param applicationType - Application type (FreshLicenseApplicationForm or RenewalApplicationForm)
   */
  static async handleWorkflowAction(
    applicationId: number,
    actionId: number,
    nextUserId: number | undefined,
    remarks: string,
    attachments?: Array<{ name: string; type: string; contentType: string; url: string }>,
    applicationType?: string,
  ): Promise<any> {
    const payload: Record<string, any> = {
      applicationId,
      actionId,
      remarks,
    };

    if (nextUserId !== undefined) {
      payload.nextUserId = nextUserId;
    }

    if (applicationType) {
      payload.applicationType = applicationType;
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    return apiClient.post('/workflow/action', payload);
  }

  /**
   * Submit renewal application for workflow (change status to INITIATED)
   * Equivalent to submitting the form
   */
  static async submitRenewalForWorkflow(
    applicationId: number,
    actionId: number,
  ): Promise<any> {
    return this.handleWorkflowAction(applicationId, actionId, undefined, 'Application submitted for review');
  }

  /**
   * Forward renewal application to next user/role
   */
  static async forwardRenewalApplication(
    applicationId: number,
    actionId: number,
    nextUserId: number,
    remarks: string,
  ): Promise<any> {
    return this.handleWorkflowAction(applicationId, actionId, nextUserId, remarks);
  }

  /**
   * Approve renewal application
   */
  static async approveRenewalApplication(
    applicationId: number,
    actionId: number,
    remarks: string,
  ): Promise<any> {
    return this.handleWorkflowAction(applicationId, actionId, undefined, remarks);
  }

  /**
   * Reject renewal application
   */
  static async rejectRenewalApplication(
    applicationId: number,
    actionId: number,
    remarks: string,
  ): Promise<any> {
    return this.handleWorkflowAction(applicationId, actionId, undefined, remarks);
  }

  /**
   * Request additional info from applicant
   */
  static async requestInfoRenewalApplication(
    applicationId: number,
    actionId: number,
    remarks: string,
  ): Promise<any> {
    return this.handleWorkflowAction(applicationId, actionId, undefined, remarks);
  }
}

export default RenewalService;