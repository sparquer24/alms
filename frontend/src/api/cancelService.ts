import { apiClient } from '../config/authenticatedApiClient';

export class CancelService {
  /**
   * Submit a new cancel request
   * @param payload { licenseId, applicationType, applicantName, cancellationReason, remarks }
   */
  static async createCancelRequest(payload: {
    licenseId: number;
    applicationType: string;
    cancellationReason: string;
    applicantName: string;
    remarks?: string;
  }): Promise<any> {
    return apiClient.post('/cancel-forms', payload);
  }

  /**
   * Attach a supporting document (sent as a data URL) to a cancel request
   */
  static async uploadFile(cancelRequestId: number, file: File): Promise<any> {
    const fileUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
      reader.readAsDataURL(file);
    });
    return apiClient.post(`/cancel-forms/${cancelRequestId}/upload-file`, {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  }

  static async deleteFile(fileId: number): Promise<any> {
    return apiClient.delete(`/cancel-forms/file/${fileId}`);
  }

  /**
   * Get all cancel requests with optional filters
   */
  static async getCancelRequests(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    requestedBy?: number;
    licenseId?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requestedBy) params.append('requestedBy', String(filters.requestedBy));
    if (filters?.licenseId) params.append('licenseId', String(filters.licenseId));

    return apiClient.get(`/cancel-forms?${params.toString()}`);
  }

  /**
   * Get a cancel request by ID
   */
  static async getCancelRequestById(id: number): Promise<any> {
    return apiClient.get(`/cancel-forms/${id}`);
  }

  /**
   * Handle generic workflow action on cancel form
   */
  static async handleWorkflowAction(
    applicationId: number,
    actionId: number,
    nextUserId: number | undefined,
    remarks: string,
    attachments?: Array<{ name: string; type: string; contentType: string; url: string }>,
  ): Promise<any> {
    const payload: Record<string, any> = {
      applicationId,
      actionId,
      remarks,
      applicationType: 'CancelFormRequest', // Hardcoded here for convenience
    };

    if (nextUserId !== undefined) {
      payload.nextUserId = nextUserId;
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    return apiClient.post('/workflow/action', payload);
  }
}

export default CancelService;
