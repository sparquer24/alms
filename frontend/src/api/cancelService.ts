import { apiClient } from '../config/authenticatedApiClient';
import { patchData } from './axiosConfig';

export interface CancelFormData {
  id?: number;
  freshLicenseId: number;
  applicationType: string;
  cancellationReason: string;
  remarks?: string;
  status?: string;
  requestedDate?: string;
  actionedDate?: string;
  requester?: any;
  actioner?: any;
  workflowStatus?: any;
}

export class CancelService {
  /**
   * Submit a new cancel request
   * @param payload { applicationId, applicationType, cancellationReason, remarks }
   */
  static async createCancelRequest(payload: {
    freshLicenseId: number;
    applicationType: string;
    cancellationReason: string;
    remarks?: string;
  }): Promise<any> {
    return apiClient.post('/cancel-forms', payload);
  }

  /**
   * Get all cancel requests with optional filters
   */
  static async getCancelRequests(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    requestedBy?: number;
    freshLicenseId?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requestedBy) params.append('requestedBy', String(filters.requestedBy));
    if (filters?.freshLicenseId) params.append('freshLicenseId', String(filters.freshLicenseId));
    
    return apiClient.get(`/cancel-forms?${params.toString()}`);
  }

  /**
   * Get a cancel request by ID
   */
  static async getCancelRequestById(id: number): Promise<any> {
    return apiClient.get(`/cancel-forms/${id}`);
  }

  /**
   * Update a cancel request (only when pending)
   */
  static async updateCancelRequest(
    id: number,
    payload: {
      cancellationReason?: string;
      remarks?: string;
    }
  ): Promise<any> {
    return patchData(`/cancel-forms/${id}`, payload);
  }

  /**
   * Action a cancel request (APPROVE/REJECT) - direct endpoint if needed
   */
  static async processCancelAction(
    id: number,
    payload: {
      action: 'APPROVED' | 'REJECTED';
      remarks?: string;
    }
  ): Promise<any> {
    return apiClient.post(`/cancel-forms/${id}/action`, payload);
  }

  /**
   * Get all Cancel Form applications via Workflow API (for standard listing)
   */
  static async getCancelWorkflowApplications(filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any> {
    const params = new URLSearchParams({
      applicationType: 'CancelFormRequest',
      ...(filters?.page && { page: String(filters.page) }),
      ...(filters?.limit && { limit: String(filters.limit) }),
      ...(filters?.status && { status: filters.status }),
    });
    
    return apiClient.get(`/workflow/applications?${params.toString()}`);
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
