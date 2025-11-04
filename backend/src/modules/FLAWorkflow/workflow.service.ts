import { Injectable, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ForwardDto } from './dto/forward.dto';
import { TERMINAL_ACTIONS, FORWARD_ACTIONS, isTerminalAction, isForwardAction, isApprovalAction, isRejectionAction } from '../../constants/workflow-actions';

@Injectable()
export class WorkflowService {
  private prisma = new PrismaClient();

  async getStatusesAndActions(id?: number) {
    if (id) {
      const status = await this.prisma.statuses.findUnique({ where: { id } });
      const action = await this.prisma.actiones.findUnique({ where: { id } });
      return { status, action };
    } else {
      const statuses = await this.prisma.statuses.findMany();
      const actions = await this.prisma.actiones.findMany();
    return { statuses, actions };
    }
  }

  /**
   * Check if a role is allowed to perform a specific action
   */
  async checkRoleActionPermission(roleId: number, actionId: number): Promise<boolean> {
    const mapping = await this.prisma.rolesActionsMapping.findUnique({
      where: {
        roleId_actionId: {
          roleId: roleId,
          actionId: actionId,
        },
      },
    });
    return mapping !== null && mapping.isActive === true;
  }


 async handleUserAction(payload: {
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
  }) {
    // 1. Fetch Application Data
    const application = await this.prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: payload.applicationId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // 1b. Fetch current user's roleId
    const currentUser = await this.prisma.users.findUnique({
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
     const nextUserRoleId = await this.prisma.users.findUnique({
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
    const status = await this.prisma.statuses.findFirst({
      where: { code: payload.action.code }
    });
    const newStatusId = status ? status.id : application.workflowStatusId;

    // 5. Update Application Fields (removed 'remarks' as it doesn't exist in the schema)
    const updateData: any = {
      workflowStatusId: newStatusId,
      previousUserId: payload.currentUserId,
      currentUserId: nextUserId,
    };

    // Set approval/rejection flags based on action code
    if (isApprovalAction(actionCode)) {
      updateData.isApproved = true;
    } else if (isRejectionAction(actionCode)) {
      updateData.isRejected = true;
    }

    // Add optional boolean fields if provided in payload (can override the above)
    if (payload.isApproved !== undefined) updateData.isApproved = payload.isApproved;
    if (payload.isFLAFGenerated !== undefined) updateData.isFLAFGenerated = payload.isFLAFGenerated;
    if (payload.isGroundReportGenerated !== undefined) updateData.isGroundReportGenerated = payload.isGroundReportGenerated;
    if (payload.isPending !== undefined) updateData.isPending = payload.isPending;
    if (payload.isReEnquiry !== undefined) updateData.isReEnquiry = payload.isReEnquiry;
    if (payload.isReEnquiryDone !== undefined) updateData.isReEnquiryDone = payload.isReEnquiryDone;
    if (payload.isRejected !== undefined) updateData.isRejected = payload.isRejected;

    const updatedApplication = await this.prisma.freshLicenseApplicationPersonalDetails.update({
      where: { id: payload.applicationId },
      data: updateData,
    });

    // 6. Add workflow history log
    const previousUserIdForHistory = application.currentUserId || payload.currentUserId; // Who had it before
    
    const workflowHistoryData: any = {
      applicationId: payload.applicationId,
      previousUserId: previousUserIdForHistory, // Who had the application before this action
      nextUserId: nextUserId, // Who has it after (or who completed it)
      actionTaken: payload.action.code,
      remarks: payload.remarks || '',
      previousRoleId: previousUserIdForHistory ? (await this.prisma.users.findUnique({ where: { id: previousUserIdForHistory }, select: { roleId: true } }))?.roleId || currentRoleId : currentRoleId,
      nextRoleId: nextUserRoleId?.roleId ,
      actionesId: payload.actionId,
      attachments: payload.attachments && payload.attachments.length > 0 ? payload.attachments : undefined,
    };

    await this.prisma.freshLicenseApplicationsFormWorkflowHistories.create({
      data: workflowHistoryData,
    });

    return updatedApplication;
  }

}

