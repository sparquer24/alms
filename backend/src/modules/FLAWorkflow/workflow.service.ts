import { Injectable, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ForwardDto } from './dto/forward.dto';

@Injectable()
export class WorkflowService {
  private prisma = new PrismaClient();

  async handleUserAction(payload: {
    applicationId: string;
    actionType: 'forward' | 'reject' | 'ground_report';
    nextUserId?: string;
    remarks: string;
    currentUserId: string;
    currentRoleId: string;
  }) {
    // 1. Fetch Application Data
    const application = await this.prisma.freshLicenseApplicationsForms.findUnique({
      where: { id: payload.applicationId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // 2. Validate User Permission (replace with your actual logic)
    // Example: Only certain roles can perform certain actions based on status
    // You should fetch current status and role, and check allowed transitions
    const allowedActions = ['forward', 'reject', 'ground_report'];
    if (!allowedActions.includes(payload.actionType)) {
      throw new BadRequestException('Invalid action type');
    }
    // Example permission check (replace with your own logic)
    // if (!isUserAllowed(application.status_id, payload.currentRoleId, payload.actionType)) {
    //   throw new ForbiddenException('You are not authorized to perform this action.');
    // }

    // 3. Update Application Fields
    let newStatusId = application.statusId;
    let newCurrentUserId = application.currentUserId;
    let newCurrentRoleId = application.currentRoleId;

    // Map actionType to status code
    const statusCodeMap: Record<string, string> = {
      forward: 'FORWARDED',
      reject: 'REJECTED',
      ground_report: 'GROUND_REPORT',
    };
    const statusCode = statusCodeMap[payload.actionType];
    if (statusCode) {
      const status = await this.prisma.statuses.findUnique({ where: { code: statusCode } });
      if (!status) throw new InternalServerErrorException(`Status code '${statusCode}' not found.`);
      newStatusId = status.id;
    }

    if (payload.actionType === 'forward') {
      newCurrentUserId = payload.nextUserId ?? null;
      // Fetch next user's roleId
      if (payload.nextUserId) {
        const nextUser = await this.prisma.users.findUnique({ where: { id: payload.nextUserId } });
        if (!nextUser || !nextUser.roleId) {
          throw new InternalServerErrorException(`Role for next user '${payload.nextUserId}' not found.`);
        }
        newCurrentRoleId = nextUser.roleId;
      } else {
        newCurrentRoleId = null;
      }
    } else if (payload.actionType === 'reject') {
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
        previousRoleId: Number(payload.currentRoleId), // Use roleId from JWT/payload, ensure number
        currentRoleId: newCurrentRoleId,
        remarks: payload.remarks,
      },
    });

    // 5. Add workflow history log
    await this.prisma.freshLicenseApplicationsFormWorkflowHistories.create({
      data: {
        applicationId: payload.applicationId,
        previousUserId: payload.currentUserId ?? '', // Use userId from JWT/payload
        nextUserId: newCurrentUserId ?? '',
        previousRoleId: payload.currentRoleId ? String(Number(payload.currentRoleId)) : '', // Use roleId from JWT/payload, ensure number
        nextRoleId: newCurrentRoleId ? String(newCurrentRoleId) : '',
        actionTaken: payload.actionType,
        remarks: payload.remarks,
      },
    });

    return updatedApplication;
  }
}
