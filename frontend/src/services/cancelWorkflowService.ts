import { CancelService } from '../api/cancelService';
import toast from 'react-hot-toast';
import { RenewalService } from '../api/renewalService';

/**
 * CancelWorkflowService
 * Business logic layer for handling Cancel Form workflow operations
 */
export class CancelWorkflowService {
  /**
   * Get action ID by action code
   */
  private static async getActionIdByCode(actionCode: string): Promise<number> {
    try {
      const data = await RenewalService.getWorkflowStatusesAndActions();
      const actions = data?.actions || [];
      
      let action = actions.find(
        (a: any) => a.code?.toUpperCase() === actionCode.toUpperCase()
      );

      if (!action && actionCode?.toUpperCase() === 'INITIATE') {
        action = actions.find((a: any) => a.code?.toUpperCase() === 'INITIATED');
      }
      
      if (!action) {
        throw new Error(`Action '${actionCode}' not found in workflow system`);
      }
      
      return action.id;
    } catch (err) {
      console.error('Error getting action ID by code:', err);
      throw err;
    }
  }

  static async performAction(payload: {
    applicationId: number;
    actionId: number;
    remarks: string;
    nextUserId?: number;
    attachments?: Array<{ name: string; type: string; contentType: string; url: string }>;
  }): Promise<any> {
    try {
      const result = await CancelService.handleWorkflowAction(
        payload.applicationId,
        payload.actionId,
        payload.nextUserId,
        payload.remarks,
        payload.attachments
      );
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to perform action';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  static async forwardCancelApplication(
    applicationId: number,
    nextUserId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('FORWARD');
      const result = await CancelService.handleWorkflowAction(
        applicationId,
        actionId,
        nextUserId,
        remarks
      );
      toast.success('Cancel request forwarded successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to forward cancel request';
      toast.error(errorMsg);
      throw err;
    }
  }

  static async approveCancelApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('APPROVE');
      const result = await CancelService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );
      
      // We also might want to call the direct action API to ensure the backend logic triggers 
      // where the original application is marked as CANCELLED.
      // Wait, if /workflow/action handles it nicely, we don't need to.
      // But just in case the backend requires the specific endpoint:
      try {
        await CancelService.processCancelAction(applicationId, {
          action: 'APPROVED',
          remarks
        });
      } catch (e) {
        console.warn("Direct approve action failed/not needed, proceeding with workflow action", e);
      }

      toast.success('Cancel request approved');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve cancel request';
      toast.error(errorMsg);
      throw err;
    }
  }

  static async rejectCancelApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('REJECT');
      const result = await CancelService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );

      // Same as approve: hit direct action as fallback
      try {
        await CancelService.processCancelAction(applicationId, {
          action: 'REJECTED',
          remarks
        });
      } catch (e) {
        console.warn("Direct reject action failed/not needed, proceeding with workflow action", e);
      }
      
      toast.success('Cancel request rejected');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject cancel request';
      toast.error(errorMsg);
      throw err;
    }
  }

  static async requestInfoCancelApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('REQUEST_MORE_INFO');
      const result = await CancelService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );
      toast.success('Information request sent');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send information request';
      toast.error(errorMsg);
      throw err;
    }
  }
}
