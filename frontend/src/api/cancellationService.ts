import { Application, WorkflowHistory } from '../types';
import { fetchData, postData, patchData } from './axiosConfig';

export const CANCELLATION_APPLICATION_TYPE = 'CancellationApplicationForm';
export const CANCELLATION_WORKFLOW_STATUS = 'Cancellation';

export interface CancelFormRequest {
  applicationId: number;
  applicationType: string;
  cancellationReason: string;
  remarks?: string;
}

export interface CancelFormSummary {
  id: number;
  applicationId: number;
  applicationType: string;
  status: string;
  createdAt: string;
  cancellationReason?: string;
  remarks?: string;
}

export interface CancellationWorkflowAction {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CancellationWorkflowActionPayload {
  applicationId: number;
  actionId: number;
  remarks: string;
  applicationType?: string;
  nextUserId?: number;
  attachments?: Array<{
    name: string;
    type: string;
    contentType: string;
    url: string;
  }>;
  isGroundReportGenerated?: boolean;
}

export const getCancellationApplication = async (
  applicationType: string,
  applicationId: string
): Promise<Application> => {
  try {
    const normalizedType = applicationType.toLowerCase();
    let response: any;
    if (normalizedType === 'renewalapplicationform' || normalizedType === 'renewal') {
      response = await fetchData(`/renewal-forms/application/${encodeURIComponent(applicationId)}`);
    } else {
      response = await fetchData(`/application-form/?applicationId=${encodeURIComponent(applicationId)}`);
    }
    const data = (response?.data ?? response) as Application;
    if (!data) throw new Error('Application not found');
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCancellationWorkflowStatusesAndActions = async () => {
  try {
    const response = await fetchData(
      `/workflow/statuses-actions?applicationType=${encodeURIComponent(CANCELLATION_APPLICATION_TYPE)}`
    );
    return (response as any)?.data ?? response;
  } catch (error) {
    throw error;
  }
};

export const getCancellationUsersInHierarchy = async (applicationId: string | number) => {
  try {
    const response = await fetchData(
      `/users-in-hierarchy/${encodeURIComponent(String(applicationId))}?applicationType=${encodeURIComponent(CANCELLATION_APPLICATION_TYPE)}`
    );
    const data = (response as any)?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
};

export const getCancellationWorkflowHistory = async (
  applicationId: string | number
): Promise<WorkflowHistory[]> => {
  try {
    const response = await fetchData(
      `/workflow/history?applicationId=${encodeURIComponent(String(applicationId))}&applicationType=${encodeURIComponent(CANCELLATION_APPLICATION_TYPE)}`
    );
    const data = (response as any)?.data ?? response;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.workflowHistories)) return data.workflowHistories;
    if (Array.isArray(data?.histories)) return data.histories;
    return [];
  } catch (error) {
    throw error;
  }
};

export const performCancellationWorkflowAction = async (
  payload: CancellationWorkflowActionPayload
) => {
  try {
    const response = await postData('/workflow/action', {
      ...payload,
      applicationType: payload.applicationType || CANCELLATION_APPLICATION_TYPE,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const createCancellationRequest = async (payload: CancelFormRequest) => {
  try {
    const response = await postData('/api/cancel-forms', payload);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllCancellationRequests = async (): Promise<CancelFormSummary[]> => {
  try {
    const response = await fetchData('/cancel-forms');
    const data = (response as any)?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
};

export const getCancellationRequestById = async (id: number | string) => {
  try {
    const response = await fetchData(`/cancel-forms/${id}`);
    return (response as any)?.data ?? response;
  } catch (error) {
    throw error;
  }
};

export const updateCancellationRequest = async (id: number | string, updates: { cancellationReason?: string; remarks?: string }) => {
  try {
    const response = await patchData(`/cancel-forms/${id}`, updates);
    return response;
  } catch (error) {
    throw error;
  }
};

export const processCancellationRequest = async (id: number | string, action: 'APPROVE' | 'REJECT') => {
  try {
    if (!['APPROVE', 'REJECT'].includes(action)) {
      throw new Error('Invalid action. Use APPROVE or REJECT.');
    }
    const response = await postData(`/cancel-forms/${id}/action`, { action });
    return response;
  } catch (error) {
    throw error;
  }
};
