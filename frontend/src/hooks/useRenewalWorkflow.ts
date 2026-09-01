import { useState, useEffect, useCallback } from 'react';
import { RenewalService } from '../api/renewalService';
import { RenewalWorkflowService } from '../services/renewalWorkflowService';
import toast from 'react-hot-toast';

export interface WorkflowStatus {
  id: number;
  code: string;
  name: string;
}

export interface WorkflowAction {
  id: number;
  code: string;
  name: string;
}

export interface WorkflowActionPayload {
  applicationId: number;
  actionId: number;
  remarks: string;
  nextUserId?: number;
  applicationType?: string;
  attachments?: Array<{
    name: string;
    type: string;
    contentType: string;
    url: string;
  }>;
  isGroundReportGenerated?: boolean;
}

export interface UseRenewalWorkflowReturn {
  statuses: WorkflowStatus[];
  actions: WorkflowAction[];
  loading: boolean;
  error: string | null;
  performAction: (payload: WorkflowActionPayload) => Promise<any>;
  submitApplication: (applicationId: number) => Promise<any>;
  forwardApplication: (applicationId: number, nextUserId: number, remarks: string) => Promise<any>;
  approveApplication: (applicationId: number, remarks: string) => Promise<any>;
  rejectApplication: (applicationId: number, remarks: string) => Promise<any>;
  requestAdditionalInfo: (applicationId: number, remarks: string) => Promise<any>;
  refresh: () => Promise<void>;
}

export const useRenewalWorkflow = (): UseRenewalWorkflowReturn => {
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load workflow statuses and actions on mount
  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await RenewalService.getWorkflowStatusesAndActions();

      if (data.statuses) {
        setStatuses(data.statuses);
      }
      if (data.actions) {
        setActions(data.actions);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load workflow data';
      setError(errorMsg);
      console.error('Error loading workflow data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic action performer - uses unified workflow API
  const performAction = useCallback(
    async (payload: WorkflowActionPayload) => {
      try {
        setError(null);

        // Call the unified workflow API (works for both fresh and renewal)
        const result = await RenewalService.handleWorkflowAction(
          payload.applicationId,
          payload.actionId,
          payload.nextUserId,
          payload.remarks,
          payload.attachments,
          payload.applicationType
        );

        toast.success('Action completed successfully');
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Action failed';
        setError(errorMsg);
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  // Submit application for workflow
  const submitApplication = useCallback(
    async (applicationId: number) => {
      try {
        const result = await RenewalWorkflowService.submitRenewalForWorkflow(applicationId);
        toast.success('Application submitted successfully');
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Submission failed';
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  // Forward application
  const forwardApplication = useCallback(
    async (applicationId: number, nextUserId: number, remarks: string) => {
      try {
        const result = await RenewalWorkflowService.forwardRenewalApplication(
          applicationId,
          nextUserId,
          remarks
        );
        toast.success('Application forwarded successfully');
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Forward failed';
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  // Approve application
  const approveApplication = useCallback(
    async (applicationId: number, remarks: string) => {
      try {
        const result = await RenewalWorkflowService.approveRenewalApplication(applicationId, remarks);
        toast.success('Application approved successfully');
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Approval failed';
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  // Reject application
  const rejectApplication = useCallback(
    async (applicationId: number, remarks: string) => {
      try {
        const result = await RenewalWorkflowService.rejectRenewalApplication(applicationId, remarks);
        toast.success('Application rejected successfully');
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Rejection failed';
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  // Request additional information
  const requestAdditionalInfo = useCallback(
    async (applicationId: number, remarks: string) => {
      try {
        const result = await RenewalWorkflowService.requestInfoRenewalApplication(
          applicationId,
          remarks
        );
        toast.success('Information request sent successfully');
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Request failed';
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  // Refresh workflow data
  const refresh = useCallback(async () => {
    await loadWorkflowData();
  }, [loadWorkflowData]);

  return {
    statuses,
    actions,
    loading,
    error,
    performAction,
    submitApplication,
    forwardApplication,
    approveApplication,
    rejectApplication,
    requestAdditionalInfo,
    refresh,
  };
};
