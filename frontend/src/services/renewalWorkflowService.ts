import { RenewalService } from '../api/renewalService';
import toast from 'react-hot-toast';

/**
 * RenewalWorkflowService
 * Business logic layer for handling renewal workflow operations
 * Provides abstraction over the API layer with error handling and notifications
 */
export class RenewalWorkflowService {
  /**
   * Get action ID by action code (e.g., 'FORWARD' -> action ID)
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

  /**
   * Perform generic workflow action
   */
  static async performAction(payload: {
    applicationId: number;
    actionId: number;
    remarks: string;
    nextUserId?: number;
    attachments?: Array<{
      name: string;
      type: string;
      contentType: string;
      url: string;
    }>;
  }): Promise<any> {
    try {
      const result = await RenewalService.handleWorkflowAction(
        payload.applicationId,
        payload.actionId,
        payload.nextUserId,
        payload.remarks,
        payload.attachments
      );
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to perform action';
      console.error('Error performing workflow action:', err);
      throw new Error(errorMsg);
    }
  }

  /**
   * Submit renewal application for workflow
   */
  static async submitRenewalForWorkflow(applicationId: number): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('INITIATE');
      const result = await RenewalService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        'Application submitted for review'
      );
      
      toast.success('Application submitted successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit application';
      console.error('Error submitting renewal application:', err);
      toast.error(errorMsg);
      throw err;
    }
  }

  /**
   * Forward renewal application to next user
   */
  static async forwardRenewalApplication(
    applicationId: number,
    nextUserId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('FORWARD');
      const result = await RenewalService.handleWorkflowAction(
        applicationId,
        actionId,
        nextUserId,
        remarks
      );
      
      toast.success('Application forwarded successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to forward application';
      console.error('Error forwarding renewal application:', err);
      toast.error(errorMsg);
      throw err;
    }
  }

  /**
   * Approve renewal application
   */
  static async approveRenewalApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('APPROVE');
      const result = await RenewalService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );
      
      toast.success('Application approved successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve application';
      console.error('Error approving renewal application:', err);
      toast.error(errorMsg);
      throw err;
    }
  }

  /**
   * Reject renewal application
   */
  static async rejectRenewalApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('REJECT');
      const result = await RenewalService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );
      
      toast.success('Application rejected successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject application';
      console.error('Error rejecting renewal application:', err);
      toast.error(errorMsg);
      throw err;
    }
  }

  /**
   * Request additional information from applicant
   */
  static async requestInfoRenewalApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('REQUEST_MORE_INFO');
      const result = await RenewalService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );
      
      toast.success('Information request sent successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send information request';
      console.error('Error requesting info from renewal application:', err);
      toast.error(errorMsg);
      throw err;
    }
  }

  /**
   * Dispose renewal application
   */
  static async disposeRenewalApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('DISPOSE');
      const result = await RenewalService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );
      
      toast.success('Application disposed successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to dispose application';
      console.error('Error disposing renewal application:', err);
      toast.error(errorMsg);
      throw err;
    }
  }

  /**
   * Raise red flag on renewal application
   */
  static async raiseRedFlagRenewalApplication(
    applicationId: number,
    remarks: string
  ): Promise<any> {
    try {
      const actionId = await this.getActionIdByCode('RED_FLAG');
      const result = await RenewalService.handleWorkflowAction(
        applicationId,
        actionId,
        undefined,
        remarks
      );
      
      toast.success('Red flag raised successfully');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to raise red flag';
      console.error('Error raising red flag on renewal application:', err);
      toast.error(errorMsg);
      throw err;
    }
  }
}
