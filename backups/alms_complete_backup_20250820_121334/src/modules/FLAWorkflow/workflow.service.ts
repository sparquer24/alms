import { Injectable, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ForwardDto } from './dto/forward.dto';

@Injectable()
export class WorkflowService {
  private prisma = new PrismaClient();

  async handleUserAction(payload: {
    applicationId: number;
    actionId: number;
    action: any; // full action object from Actiones table
    nextUserId?: number;
    remarks: string;
    currentUserId: number;
    attachments?: Array<{ name: string; type: string; contentType: string; url: string }>;
  }) {
    // 1. Fetch Application Data
    const application = await this.prisma.freshLicenseApplicationsForms.findUnique({
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

    // 2. Validate User Permission (replace with your actual logic)
    // You should fetch current status and role, and check allowed transitions
    // Example permission check (replace with your own logic)
    // if (!isUserAllowed(application.status_id, payload.currentRoleId, payload.actionType)) {
    //   throw new ForbiddenException('You are not authorized to perform this action.');
    // }

    // 3. Update Application Fields
    let newStatusId = application.statusId;
    let newCurrentUserId = application.currentUserId;
    let newCurrentRoleId = application.currentRoleId;

    // Use action from payload
    if (payload.action) {
      newStatusId = payload.action.id;
    }

    if (payload.action && payload.action.code.toLowerCase() === 'forward') {
      newCurrentUserId = payload.nextUserId ?? null;
      // Fetch next user's roleId
      if (payload.nextUserId !== undefined && payload.nextUserId !== null) {
        const nextUser = await this.prisma.users.findUnique({ where: { id: payload.nextUserId } });
        if (!nextUser || !nextUser.roleId) {
          throw new InternalServerErrorException(`Role for next user '${payload.nextUserId}' not found.`);
        }
        newCurrentRoleId = nextUser.roleId;
      } else {
        newCurrentRoleId = null;
      }
    } else if (payload.action && payload.action.code.toLowerCase() === 'reject') {
      newCurrentUserId = null;
      newCurrentRoleId = null;
    }

    // 4. Save Changes
    const updatedApplication = await this.prisma.freshLicenseApplicationsForms.update({
      where: { id: payload.applicationId },
      data: {
        statusId: newStatusId,
        previousUserId: payload.currentUserId, // Use userId from JWT/payload
        currentUserId: newCurrentUserId,
        previousRoleId: currentRoleId, // Use roleId fetched from DB
        currentRoleId: newCurrentRoleId,
        remarks: payload.remarks,
      },
    });

    // 5. Add workflow history log
    const workflowHistoryData: any = {
      applicationId: payload.applicationId,
      previousUserId: payload.currentUserId ?? null, // Use userId from JWT/payload
      previousRoleId: currentRoleId ?? null, // Use roleId fetched from DB
      nextRoleId: newCurrentRoleId ?? null,
      actionTaken: payload.action.code,
      remarks: payload.remarks,
      attachments: payload.attachments && payload.attachments.length > 0 ? payload.attachments : undefined,
    };
    if (newCurrentUserId !== null && newCurrentUserId !== undefined) {
      workflowHistoryData.nextUserId = newCurrentUserId;
    }
    await this.prisma.freshLicenseApplicationsFormWorkflowHistories.create({
      data: workflowHistoryData,
    });

    return updatedApplication;
  }
}
