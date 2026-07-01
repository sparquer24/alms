import { Injectable, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { ForwardDto } from './dto/forward.dto';
import { TERMINAL_ACTIONS, FORWARD_ACTIONS, ACTION_CODES, isTerminalAction, isForwardAction, isApprovalAction, isRejectionAction,  isReEnquiryAction, isRecommendAction, isNotRecommendAction } from '../../constants/workflow-actions';

@Injectable()
export class WorkflowService {

  async getStatusesAndActions(id?: number) {
    if (id) {
      const status = await prisma.statuses.findUnique({ where: { id } });
      const action = await prisma.actiones.findUnique({ where: { id } });
      return { status, action };
    } else {
      const statuses = await prisma.statuses.findMany();
      const actions = await prisma.actiones.findMany();
    return { statuses, actions };
    }
  }

  async getApplicationsByType(applicationType: string) {
    if (applicationType === 'flawUpdate' || applicationType === 'FreshLicenseApplicationForm') {
      return await prisma.freshLicenseApplicationPersonalDetails.findMany({
        select: {
          id: true,
          workflowStatusId: true,
          currentUserId: true,
          previousUserId: true,
          isApproved: true,
          isRejected: true,
          isRecommended: true,
          isNotRecommended: true,
          isPending: true,
          isReEnquiry: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    } else if (applicationType === 'renewUpdate' || applicationType === 'RenewalApplicationForm') {
      return await prisma.renewalFormPersonalDetails.findMany({
        select: {
          id: true,
          workflowStatusId: true,
          currentUserId: true,
          previousUserId: true,
          isApproved: true,
          isRejected: true,
          isRecommended: true,
          isNotRecommended: true,
          isPending: true,
          isReEnquiry: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    } else if (
      applicationType === 'CancelFormRequest' ||
      applicationType === 'CancelApplication' ||
      applicationType === 'CancelForm' ||
      applicationType === 'cancel'
    ) {
      const cancelRequests = await prisma.cancelFormRequests.findMany({
        select: {
          id: true,
          freshLicenseId: true,
          applicationType: true,
          cancellationReason: true,
          remarks: true,
          status: true,
          workFlowStatusId: true,
          currentUserId: true,
          previousUserId: true,
          requestedBy: true,
          actionedBy: true,
          requestedDate: true,
          actionedDate: true,
          createdAt: true,
          updatedAt: true,
          freshLicense: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
            },
          },
        }
      });
      return cancelRequests.map(r => {
        const applicantName = r.freshLicense
          ? [r.freshLicense.firstName, r.freshLicense.middleName, r.freshLicense.lastName]
              .filter(Boolean)
              .join(' ') || 'Applicant'
          : 'Applicant';

        return {
          id: r.id,
          freshLicenseId: r.freshLicenseId,
          applicationType: r.applicationType,
          cancellationReason: r.cancellationReason,
          remarks: r.remarks,
          applicantName,
          requestedDate: r.requestedDate,
          actionedDate: r.actionedDate,
          workflowStatusId: r.workFlowStatusId,
          currentUserId: r.currentUserId || r.actionedBy || r.requestedBy,
          previousUserId: r.previousUserId || r.requestedBy,
          isApproved: r.status === 'APPROVED',
          isRejected: r.status === 'REJECTED',
          isRecommended: false,
          isNotRecommended: false,
          isPending: r.status === 'PENDING',
          isReEnquiry: false,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });
    } else {
      throw new Error(`Invalid applicationType: ${applicationType}`);
    }
  }

  async getWorkflowHistory(applicationId: number, applicationType: string = 'fresh') {
    if (applicationType.toLowerCase().includes('renew')) {
      return await prisma.renewalApplicationsFormWorkflowHistories.findMany({
        where: { applicationId },
        include: {
          actiones: true,
          previousUser: { select: { id: true, username: true } },
          nextUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'asc' }
      });
    } else if (applicationType.toLowerCase().includes('cancel')) {
      return await prisma.cancelWorkflowHistories.findMany({
        where: { applicationId },
        include: {
          actiones: true,
          previousUser: { select: { id: true, username: true } },
          nextUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'asc' }
      });
    } else {
      return await prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
        where: { applicationId },
        include: {
          actiones: true,
          previousUser: { select: { id: true, username: true } },
          nextUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'asc' }
      });
    }
  }

  /**
   * Check if a role is allowed to perform a specific action
   */
  async checkRoleActionPermission(roleId: number, actionId: number): Promise<boolean> {
    const mapping = await prisma.rolesActionsMapping.findUnique({
      where: {
        roleId_actionId: {
          roleId: roleId,
          actionId: actionId,
        },
      },
    });
    return mapping !== null && mapping.isActive === true;
  }
 async freshapplication(payload: {
    isApproved?: boolean;
    isFLAFGenerated?: boolean;
    isGroundReportGenerated?: boolean;
    isPending?: boolean;
    isReEnquiry?: boolean;
    isReEnquiryDone?: boolean;
    isRejected?: boolean;
    isRecommended?: boolean;
    isNotRecommended?: boolean;
    action: any;
    remarks: string;
    actionId: any;
    attachments?: any;
    applicationId: number;
    currentUserId: number;
  }, status: any, nextUserId: number, actionCode:string, nextUserRoleId: any, currentRoleId: number){
   // 1. Fetch Application Data
    const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: payload.applicationId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    
    let newStatusId = status ? status.id : application.workflowStatusId;
    // Preserve terminal statuses (APPROVED/REJECT/RECOMMEND/NOT_RECOMMEND) when forwarding
    // after a terminal action. e.g., CP approves → forwards back to JTCP should show APPROVED.
    // This checks the existing application state BEFORE this action runs.
    if (actionCode !== 'CLOSE') {
      if (application.isApproved) {
        const approvedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.APPROVED } });
        if (approvedStatus) newStatusId = approvedStatus.id;
      } else if (application.isRejected) {
        const rejectedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.REJECT } });
        if (rejectedStatus) newStatusId = rejectedStatus.id;
      } else if (application.isRecommended) {
        const recommendedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.RECOMMEND } });
        if (recommendedStatus) newStatusId = recommendedStatus.id;
      } else if (application.isNotRecommended) {
        const notRecommendedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.NOT_RECOMMEND } });
        if (notRecommendedStatus) newStatusId = notRecommendedStatus.id;
      }
    }

    // 5. Update Application Fields (removed 'remarks' as it doesn't exist in the schema)
    const updateData: any = {
      workflowStatusId: newStatusId,
      previousUserId: payload.currentUserId,
      currentUserId: nextUserId,
    };

    // Set approval/rejection/recommendation flags based on action code
    // Always reset conflicting flags to keep boolean fields in sync with workflow status
    if (isApprovalAction(actionCode)) {
      updateData.isApproved = true;
      updateData.isRejected = false;
      updateData.isRecommended = false;
      updateData.isNotRecommended = false;
      updateData.isPending = false;
    } else if (isRejectionAction(actionCode)) {
      updateData.isRejected = true;
      updateData.isApproved = false;
      updateData.isRecommended = false;
      updateData.isNotRecommended = false;
      updateData.isPending = false;
    } else if (isRecommendAction(actionCode)) {
      updateData.isRecommended = true;
      updateData.isApproved = false;
      updateData.isRejected = false;
      updateData.isNotRecommended = false;
      updateData.isPending = false;
    } else if (isNotRecommendAction(actionCode)) {
      updateData.isNotRecommended = true;
      updateData.isApproved = false;
      updateData.isRejected = false;
      updateData.isRecommended = false;
      updateData.isPending = false;
    }

    // Set flags based on specific action codes
     if (isReEnquiryAction(actionCode)) {
      updateData.isGroundReportGenerated = false;
      updateData.isReEnquiry = true;
    }

    // Add optional boolean fields if provided in payload (can override the above)
    if (payload.isApproved !== undefined) updateData.isApproved = payload.isApproved;
    if (payload.isFLAFGenerated !== undefined) updateData.isFLAFGenerated = payload.isFLAFGenerated;
    if (payload.isGroundReportGenerated !== undefined) updateData.isGroundReportGenerated = payload.isGroundReportGenerated;
    if (payload.isPending !== undefined) updateData.isPending = payload.isPending;
    if (payload.isReEnquiry !== undefined) updateData.isReEnquiry = payload.isReEnquiry;
    if (payload.isReEnquiryDone !== undefined) updateData.isReEnquiryDone = payload.isReEnquiryDone;
    if (payload.isRejected !== undefined) updateData.isRejected = payload.isRejected;
    if (payload.isRecommended !== undefined) updateData.isRecommended = payload.isRecommended;
    if (payload.isNotRecommended !== undefined) updateData.isNotRecommended = payload.isNotRecommended;

    const updatedApplication = await prisma.freshLicenseApplicationPersonalDetails.update({
      where: { id: payload.applicationId },
      data: updateData,
    });

    // 6. Add workflow history log
    const previousUserIdForHistory = application.currentUserId || payload.currentUserId; // Who had it before
    
    // Determine actionTaken: preserve terminal action states (approved, rejected, recommended, not recommended)
    let actionTaken = payload.action.code;
    if (actionCode !== 'CLOSE') {
      if (application.isApproved || updateData.isApproved) {
        actionTaken = ACTION_CODES.APPROVED;
      } else if (application.isRejected || updateData.isRejected) {
        actionTaken = ACTION_CODES.REJECT;
      } else if (application.isRecommended || updateData.isRecommended) {
        actionTaken = ACTION_CODES.RECOMMEND;
      } else if (application.isNotRecommended || updateData.isNotRecommended) {
        actionTaken = ACTION_CODES.NOT_RECOMMEND;
      }
    }
    
    const workflowHistoryData: any = {
      applicationId: payload.applicationId,
      previousUserId: previousUserIdForHistory, // Who had the application before this action
      nextUserId: nextUserId, // Who has it after (or who completed it)
      actionTaken: actionTaken,
      remarks: payload.remarks || '',
      previousRoleId: previousUserIdForHistory ? (await prisma.users.findUnique({ where: { id: previousUserIdForHistory }, select: { roleId: true } }))?.roleId || currentRoleId : currentRoleId,
      nextRoleId: nextUserRoleId?.roleId ,
      actionesId: payload.actionId,
      attachments: payload.attachments && payload.attachments.length > 0 ? payload.attachments : undefined,
    };

    await prisma.freshLicenseApplicationsFormWorkflowHistories.create({
      data: workflowHistoryData,
    });

    return updatedApplication;
 }

 async renewalapplication(payload: {
    isApproved?: boolean;
    isFLAFGenerated?: boolean;
    isGroundReportGenerated?: boolean;
    isPending?: boolean;
    isReEnquiry?: boolean;
    isReEnquiryDone?: boolean;
    isRejected?: boolean;
    isRecommended?: boolean;
    isNotRecommended?: boolean;
    action: any;
    remarks: string;
    actionId: any;
    attachments?: any;
    applicationId: number;
    currentUserId: number;
  }, status: any, nextUserId: number, actionCode:string, nextUserRoleId: any, currentRoleId: number){
   // 1. Fetch Application Data
    const application = await prisma.renewalFormPersonalDetails.findUnique({
      where: { id: payload.applicationId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    
    let newStatusId = status ? status.id : application.workflowStatusId;

    // Preserve terminal statuses (APPROVED/REJECT/RECOMMEND/NOT_RECOMMEND) when forwarding
    // after a terminal action. e.g., CP approves → forwards back to previous role should show APPROVED.
    if (actionCode !== 'CLOSE') {
      if (application.isApproved) {
        const approvedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.APPROVED } });
        if (approvedStatus) newStatusId = approvedStatus.id;
      } else if (application.isRejected) {
        const rejectedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.REJECT } });
        if (rejectedStatus) newStatusId = rejectedStatus.id;
      } else if (application.isRecommended) {
        const recommendedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.RECOMMEND } });
        if (recommendedStatus) newStatusId = recommendedStatus.id;
      } else if (application.isNotRecommended) {
        const notRecommendedStatus = await prisma.statuses.findFirst({ where: { code: ACTION_CODES.NOT_RECOMMEND } });
        if (notRecommendedStatus) newStatusId = notRecommendedStatus.id;
      }
    }

    // 5. Update Application Fields (removed 'remarks' as it doesn't exist in the schema)
    const updateData: any = {
      workflowStatusId: newStatusId,
      previousUserId: payload.currentUserId,
      currentUserId: nextUserId,
    };

    // Set approval/rejection/recommendation flags based on action code
    // Always reset conflicting flags to keep boolean fields in sync with workflow status
    if (isApprovalAction(actionCode)) {
      updateData.isApproved = true;
      updateData.isRejected = false;
      updateData.isRecommended = false;
      updateData.isNotRecommended = false;
      updateData.isPending = false;
    } else if (isRejectionAction(actionCode)) {
      updateData.isRejected = true;
      updateData.isApproved = false;
      updateData.isRecommended = false;
      updateData.isNotRecommended = false;
      updateData.isPending = false;
    } else if (isRecommendAction(actionCode)) {
      updateData.isRecommended = true;
      updateData.isApproved = false;
      updateData.isRejected = false;
      updateData.isNotRecommended = false;
      updateData.isPending = false;
    } else if (isNotRecommendAction(actionCode)) {
      updateData.isNotRecommended = true;
      updateData.isApproved = false;
      updateData.isRejected = false;
      updateData.isRecommended = false;
      updateData.isPending = false;
    }

    // Set flags based on specific action codes
     if (isReEnquiryAction(actionCode)) {
      updateData.isGroundReportGenerated = false;
      updateData.isReEnquiry = true;
    }

    // Add optional boolean fields if provided in payload (can override the above)
    if (payload.isApproved !== undefined) updateData.isApproved = payload.isApproved;
    if (payload.isFLAFGenerated !== undefined) updateData.isFLAFGenerated = payload.isFLAFGenerated;
    if (payload.isGroundReportGenerated !== undefined) updateData.isGroundReportGenerated = payload.isGroundReportGenerated;
    if (payload.isPending !== undefined) updateData.isPending = payload.isPending;
    if (payload.isReEnquiry !== undefined) updateData.isReEnquiry = payload.isReEnquiry;
    if (payload.isReEnquiryDone !== undefined) updateData.isReEnquiryDone = payload.isReEnquiryDone;
    if (payload.isRejected !== undefined) updateData.isRejected = payload.isRejected;
    if (payload.isRecommended !== undefined) updateData.isRecommended = payload.isRecommended;
    if (payload.isNotRecommended !== undefined) updateData.isNotRecommended = payload.isNotRecommended;

    const updatedApplication = await prisma.renewalFormPersonalDetails.update({
      where: { id: payload.applicationId },
      data: updateData,
    });

    // 6. Add workflow history log
    const previousUserIdForHistory = application.currentUserId || payload.currentUserId; // Who had it before
    
    // Determine actionTaken: preserve terminal action states (approved, rejected, recommended, not recommended)
    let actionTaken = payload.action.code;
    if (actionCode !== 'CLOSE') {
      if (application.isApproved || updateData.isApproved) {
        actionTaken = ACTION_CODES.APPROVED;
      } else if (application.isRejected || updateData.isRejected) {
        actionTaken = ACTION_CODES.REJECT;
      } else if (application.isRecommended || updateData.isRecommended) {
        actionTaken = ACTION_CODES.RECOMMEND;
      } else if (application.isNotRecommended || updateData.isNotRecommended) {
        actionTaken = ACTION_CODES.NOT_RECOMMEND;
      }
    }
    
    const workflowHistoryData: any = {
      applicationId: payload.applicationId,
      previousUserId: previousUserIdForHistory, // Who had the application before this action
      nextUserId: nextUserId, // Who has it after (or who completed it)
      actionTaken: actionTaken,
      remarks: payload.remarks || '',
      previousRoleId: previousUserIdForHistory ? (await prisma.users.findUnique({ where: { id: previousUserIdForHistory }, select: { roleId: true } }))?.roleId || currentRoleId : currentRoleId,
      nextRoleId: nextUserRoleId?.roleId ,
      actionesId: payload.actionId,
      attachments: payload.attachments && payload.attachments.length > 0 ? payload.attachments : undefined,
    };

    await prisma.renewalApplicationsFormWorkflowHistories.create({
      data: workflowHistoryData,
    });

    return updatedApplication;
 }

 async handleUserAction(payload: 
  {
    applicationId: number;
    actionId: number;
    action: any; // full action object from Actiones table
    nextUserId?: number;
    remarks: string;
    currentUserId: number;
    attachments?: Array<{ name: string; type: string; contentType: string; url: string }>;
    isApproved?: boolean;
    isFLAFGenerated?: boolean;
    isGroundReportGenerated?: boolean;
    isPending?: boolean;
    isReEnquiry?: boolean;
    isReEnquiryDone?: boolean;
    isRejected?: boolean;
    isRecommended?: boolean;
    isNotRecommended?: boolean;
  }, applicationType : string,)

   {
     // 1b. Fetch current user's roleId
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.currentUserId },
      select: { roleId: true },
    });
    if (!currentUser || !currentUser.roleId) {
      throw new InternalServerErrorException(`Role for current user '${payload.currentUserId}' not found.`);
    }
    const currentRoleId = currentUser.roleId;

    // 2. Validate User Permission using RolesActionsMapping
    const hasPermission = await this.checkRoleActionPermission(currentRoleId, payload.actionId);
    if (!hasPermission) {
      throw new ForbiddenException(`You are not authorized to perform this action. Your role does not have permission for action ID: ${payload.actionId}`);
    }
     // 3. Determine next user and validate based on action type
    let nextUserId: number | null 
     const nextUserRoleId = await prisma.users.findUnique({
      where: { id: payload.nextUserId },
      select: { roleId: true },
    });

    const actionCode = payload.action.code.toUpperCase();

    if(payload.nextUserId !== undefined && payload.nextUserId !== null) {
      nextUserId = payload.nextUserId;
    }else{
      throw new BadRequestException('nextUserId is required for this action.');
    }
    // 4. Find corresponding status for this action
    const status = await prisma.statuses.findFirst({
      where: {
        code: {
          equals: actionCode,
          mode: 'insensitive'
        }
      }
    });

      if (applicationType.toLowerCase() == 'renewalform' || applicationType.toLowerCase() == 'renewalapplicationform') {
        await this.renewalapplication(payload, status, nextUserId, actionCode, nextUserRoleId, currentRoleId)
      } else if (
        applicationType.toLowerCase() == 'cancelform' ||
        applicationType.toLowerCase() == 'cancelapplicationform' ||
        applicationType.toLowerCase() == 'cancelformrequest' ||
        applicationType.toLowerCase() == 'cancelapplication' ||
        applicationType.toLowerCase() == 'cancelrequest'
      ) {
        await this.cancelFormApplication(payload, status, nextUserId, actionCode, nextUserRoleId, currentRoleId)
      } else{
        await this.freshapplication(payload, status, nextUserId, actionCode, nextUserRoleId, currentRoleId)
      }
   
    return {
      success: true,
      message: `${payload.action.code.toLowerCase()} performed successfully.`,  
     }
    }


 async cancelFormApplication(payload: {
    isApproved?: boolean;
    isPending?: boolean;
    isRejected?: boolean;
    action: any;
    remarks: string;
    actionId: any;
    attachments?: any;
    applicationId: number;
    currentUserId: number;
  }, status: any, nextUserId: number, actionCode:string, nextUserRoleId: any, currentRoleId: number){
    // 1. Fetch the cancel request
    const cancelRequest = await prisma.cancelFormRequests.findUnique({
      where: { id: payload.applicationId },
    });
    if (!cancelRequest) {
      throw new NotFoundException('Cancel request not found');
    }

    // Only PENDING cancel requests can be processed via workflow
    if (cancelRequest.status !== 'PENDING') {
      throw new BadRequestException('Cancel request has already been processed.');
    }

    const isRenewal = cancelRequest.applicationType.toLowerCase().includes('renewal');

    // 2. Fetch the original application using freshLicenseId
    let application: any;
    if (!cancelRequest.freshLicenseId) {
      throw new BadRequestException('Cancel request has no associated fresh license application.');
    }
    if (isRenewal) {
      application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: cancelRequest.freshLicenseId },
      });
    } else {
      application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: cancelRequest.freshLicenseId },
      });
    }

    if (!application) {
      throw new NotFoundException('Original application not found');
    }

    const newStatusId = status ? status.id : cancelRequest.workFlowStatusId;

    // 3. Build cancel request update data - mirrors Fresh/Renewal currentUserId/previousUserId tracking
    const cancelUpdateData: any = {
      actionedBy: payload.currentUserId,
      actionedDate: new Date(),
      previousUserId: cancelRequest.actionedBy || cancelRequest.requestedBy,
      currentUserId: nextUserId,
    };

    // 4. Determine action outcome
    // CancelFormRequests uses 'status' field (PENDING/APPROVED/REJECTED) — no boolean flags
    if (isTerminalAction(actionCode)) {
      if (isApprovalAction(actionCode)) {
        // APPROVED: mark cancel request as APPROVED, cancel the original application
        cancelUpdateData.status = 'APPROVED';
        cancelUpdateData.workFlowStatusId = newStatusId;
      } else if (isRejectionAction(actionCode)) {
        // REJECTED: mark cancel request as REJECTED, do NOT modify original app
        cancelUpdateData.status = 'REJECTED';
        cancelUpdateData.workFlowStatusId = newStatusId;
      }
    } else {
      // Non-terminal action (FORWARD, etc.): just update workflow status
      cancelUpdateData.workFlowStatusId = newStatusId;
    }

    if (payload.remarks) {
      const originalRemarks = cancelRequest.remarks || '';
      cancelUpdateData.remarks = originalRemarks
        ? `${originalRemarks}\n[Action: ${actionCode}] ${payload.remarks}`
        : `[Action: ${actionCode}] ${payload.remarks}`;
    }

    // 5. Execute all updates in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Update the cancel request
      await tx.cancelFormRequests.update({
        where: { id: payload.applicationId },
        data: cancelUpdateData,
      });

      // Determine the type of workflow history entry to create on the original application
      let actionTaken = actionCode;
      const previousUserIdForHistory = application.currentUserId || payload.currentUserId;

      if (cancelUpdateData.status === 'APPROVED') {
        // Find the CANCEL status for final approval
        const cancelStatus = await tx.statuses.findFirst({ where: { code: ACTION_CODES.CANCEL } });

        // Update the original application to CANCELLED
        if (isRenewal) {
          await tx.renewalFormPersonalDetails.update({
            where: { id: cancelRequest.freshLicenseId },
            data: {
              workflowStatusId: cancelStatus?.id || newStatusId,
              isPending: false,
            },
          });
        } else {
          await tx.freshLicenseApplicationPersonalDetails.update({
            where: { id: cancelRequest.freshLicenseId },
            data: {
              workflowStatusId: cancelStatus?.id || newStatusId,
              isPending: false,
            },
          });
        }

        actionTaken = ACTION_CODES.CANCEL;
      } else if (cancelUpdateData.status === 'REJECTED') {
        // REJECTED: application unchanged, history entry records the rejection
        actionTaken = ACTION_CODES.REJECT;
      }

      // Create workflow history on the original application
      const remarks = cancelUpdateData.status === 'APPROVED'
        ? `Cancel request approved. Application cancelled. Reason: ${cancelRequest.cancellationReason}`
        : cancelUpdateData.status === 'REJECTED'
          ? `Cancel request rejected. ${payload.remarks || ''}`
          : `Cancel request forwarded. ${payload.remarks || ''}`;

      if (isRenewal) {
        await tx.renewalApplicationsFormWorkflowHistories.create({
          data: {
            applicationId: cancelRequest.freshLicenseId,
            previousUserId: previousUserIdForHistory,
            nextUserId: nextUserId || payload.currentUserId,
            actionTaken: actionTaken,
            remarks: remarks,
            previousRoleId: currentRoleId,
            nextRoleId: nextUserRoleId?.roleId || null,
            actionesId: payload.actionId,
          },
        });
      } else {
        await tx.freshLicenseApplicationsFormWorkflowHistories.create({
          data: {
            applicationId: cancelRequest.freshLicenseId,
            previousUserId: previousUserIdForHistory,
            nextUserId: nextUserId || payload.currentUserId,
            actionTaken: actionTaken,
            remarks: remarks,
            previousRoleId: currentRoleId,
            nextRoleId: nextUserRoleId?.roleId || null,
            actionesId: payload.actionId,
          },
        });
      }

      // Create CancelWorkflowHistories entry for the cancel request itself
      // This mirrors the workflow history pattern from Fresh/Renewal applications
      await tx.cancelWorkflowHistories.create({
        data: {
          applicationId: payload.applicationId,
          previousUserId: cancelRequest.actionedBy || payload.currentUserId,
          nextUserId: nextUserId || payload.currentUserId,
          actionTaken: actionTaken,
          remarks: remarks,
          previousRoleId: currentRoleId,
          nextRoleId: nextUserRoleId?.roleId || null,
          actionesId: payload.actionId,
        },
      });
    });

    return cancelRequest;
 }

}

