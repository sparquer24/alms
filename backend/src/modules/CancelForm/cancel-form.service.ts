import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { CreateCancelRequestDto } from './dto/create-cancel-request.dto';
import { UpdateCancelRequestDto } from './dto/update-cancel-request.dto';
import { CancelRequestActionDto } from './dto/cancel-request-action.dto';
import { ACTION_CODES, STATUS_CODES } from '../../constants/workflow-actions';

@Injectable()
export class CancelFormService {
  /**
   * Submit a new cancel request for an application.
   * Creates the cancel request record, sets the initial workflow status (INITIATE),
   * and records a workflow history entry on the original application
   * following the same pattern as Fresh/Renewal application submission.
   */
  async createCancelRequest(
    dto: CreateCancelRequestDto,
    currentUserId: number,
  ): Promise<any> {
    try {
      console.log('--- createCancelRequest Start ---');
      console.log('DTO:', JSON.stringify(dto, null, 2));
      console.log('currentUserId:', currentUserId);

      // Look up the fresh license application by its ID
      const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: dto.freshLicenseId },
        select: {
          id: true,
          isApproved: true,
          isRejected: true,
          currentUserId: true,
          workflowStatus: {
            select: { code: true },
          },
        },
      });
      console.log('Fresh license application check result:', application);

      if (!application) {
        console.log('Application NOT found for ID:', dto.freshLicenseId);
        throw new NotFoundException('Application not found. Please verify the application ID.');
      }

      // Validate application is in a cancellable state
      // Use workflow status code as the sole source of truth.
      // The isRejected/isApproved boolean flags are not reliable because they can
      // become stale if not reset when workflow status changes.
      const statusCode = application.workflowStatus?.code;
      if (statusCode === 'REJECT') {
        throw new BadRequestException('Cannot cancel a rejected application.');
      }
      if (statusCode === 'CANCEL') {
        throw new BadRequestException('Application is already cancelled.');
      }

      // NOTE: The duplicate check is intentionally performed INSIDE the $transaction below.
      // Performing it here (outside the transaction) would create a TOCTOU race condition:
      // two concurrent requests could both read "no existing record" and both proceed to create one.
      // Moving the check inside the transaction ensures atomicity.

      // Validate that the current user exists in the database (avoids P2003 on requestedBy FK)
      const userExists = await prisma.users.findUnique({
        where: { id: currentUserId },
        select: { id: true },
      });
      if (!userExists) {
        throw new BadRequestException(
          `Authenticated user (id: ${currentUserId}) not found in the system. Please re-login.`,
        );
      }

      // Determine the effectiveUserId for workflow history (must be a valid user)
      const effectiveUserId = currentUserId || application.currentUserId;

      // Find the initial workflow status (INITIATE/INITIATED) — same pattern as Fresh/Renewal submission
      const initiateStatus = await prisma.statuses.findFirst({
        where: {
          code: { in: [STATUS_CODES.INITIATE, 'INITIATED'] },
          isActive: true,
        },
        orderBy: { id: 'asc' },
      });

      // Wrap creation and workflow history in a transaction for atomicity.
      // The duplicate check runs INSIDE the transaction so it is atomic with the INSERT.
      const cancelRequest = await prisma.$transaction(async (tx: any) => {
        // Atomic duplicate check — must be inside the transaction to prevent race conditions
        const existingPending = await tx.cancelFormRequests.findFirst({
          where: {
            freshLicenseId: dto.freshLicenseId,
            status: 'PENDING',
          },
        });
        if (existingPending) {
          throw new BadRequestException('A pending cancel request already exists for this application.');
        }

        // Create the cancel request
        const created = await tx.cancelFormRequests.create({
          data: {
            freshLicenseId: dto.freshLicenseId,
            applicationType: dto.applicationType,
            cancellationReason: dto.cancellationReason,
            remarks: dto.remarks || null,
            status: 'PENDING',
            requestedBy: currentUserId,
            currentUserId: currentUserId,
            requestedDate: new Date(),
            workFlowStatusId: initiateStatus?.id || null,
          },
          include: {
            requester: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        });

        // Create a workflow history entry on the original application
        // Follows the same pattern as Fresh/Renewal application submission
        if (initiateStatus && effectiveUserId) {
          // Fetch user's role (same as fresh app pattern)
          const currentUser = await tx.users.findUnique({
            where: { id: effectiveUserId },
            select: { roleId: true },
          });
          const currentUserRoleId = currentUser?.roleId || null;

          // Also create the INITIATED entry in CancelWorkflowHistories
          // so the cancel request's own workflow history starts from submission
          const initiateAction = await tx.actiones.findFirst({
            where: { code: 'INITIATED' },
          });

          await tx.cancelWorkflowHistories.create({
            data: {
              applicationId: created.id,
              previousUserId: effectiveUserId,
              nextUserId: effectiveUserId,
              previousRoleId: currentUserRoleId,
              nextRoleId: currentUserRoleId,
              actionTaken: 'INITIATED',
              remarks: `Cancel request initiated. Reason: ${dto.cancellationReason}`,
              actionesId: initiateAction?.id || null,
            },
          });
        }

        return created;
      });

      return cancelRequest;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2003') {
        // Log the exact field causing the foreign key violation for debugging
        const field = error.meta?.field_name || error.meta?.modelName || 'unknown field';
        console.error(`[CancelFormService] P2003 FK violation on field: ${field}`, {
          freshLicenseId: dto.freshLicenseId,
          currentUserId,
          errorMeta: error.meta,
        });
        throw new BadRequestException(
          `Invalid reference: foreign key constraint failed on field "${field}". Ensure freshLicenseId and user are valid.`,
        );
      }
      console.error('[CancelFormService] createCancelRequest error:', error);
      throw new InternalServerErrorException(
        `Failed to create cancel request: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get a cancel request by ID
   */
  async getCancelRequestById(id: number): Promise<any> {
    try {
      const cancelRequest = await prisma.cancelFormRequests.findUnique({
        where: { id },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          workflowStatus: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          actioner: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          currentUser: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          previousUser: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          freshLicense: {
            include: {
              workflowStatus: true,
              presentAddress: {
                include: {
                  state: true,
                  district: true,
                  RangeOffices: true,
                  zone: true,
                  division: true,
                  policeStation: true,
                },
              },
              permanentAddress: {
                include: {
                  state: true,
                  district: true,
                  RangeOffices: true,
                  zone: true,
                  division: true,
                  policeStation: true,
                },
              },
              occupationAndBusiness: {
                include: {
                  state: true,
                  district: true,
                },
              },
              licenseDetails: {
                include: { requestedWeapons: true },
              },
              criminalHistories: true,
              licenseHistories: true,
              fileUploads: true,
              biometricData: true,
            },
          },
          cancelWorkflowHistories: {
            orderBy: { createdAt: 'desc' },
            include: {
              nextUser: {
                include: { role: true },
              },
              previousUser: {
                include: { role: true },
              },
              nextRole: true,
              previousRole: true,
              actiones: true,
            },
          },
        },
      });

      if (!cancelRequest) {
        throw new NotFoundException('Cancel request not found.');
      }

      return cancelRequest;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve cancel request: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get all cancel requests with optional filtering
   */
  async getCancelRequests(filters: {
    page?: number;
    limit?: number;
    status?: string;
    requestedBy?: number;
    freshLicenseId?: number;
  }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const page = Math.max(Number(filters.page ?? 1), 1);
      const limit = Math.max(Number(filters.limit ?? 10), 1);
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.requestedBy) {
        where.requestedBy = filters.requestedBy;
      }
      if (filters.freshLicenseId) {
        where.freshLicenseId = filters.freshLicenseId;
      }

      const [cancelRequests, total] = await Promise.all([
        prisma.cancelFormRequests.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            requester: {
              select: {
                id: true,
                username: true,
                email: true,
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
            workflowStatus: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            actioner: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        }),
        prisma.cancelFormRequests.count({ where }),
      ]);

      return {
        data: cancelRequests,
        total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to retrieve cancel requests: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Update a cancel request (e.g., change reason/remarks)
   */
  async updateCancelRequest(
    id: number,
    dto: UpdateCancelRequestDto,
    currentUserId: number,
  ): Promise<any> {
    try {
      const cancelRequest = await prisma.cancelFormRequests.findUnique({
        where: { id },
      });

      if (!cancelRequest) {
        throw new NotFoundException('Cancel request not found.');
      }

      // Only allow updates to PENDING requests
      if (cancelRequest.status !== 'PENDING') {
        throw new BadRequestException('Cannot update a cancel request that has already been processed.');
      }

      // Only the requester can update the request
      if (cancelRequest.requestedBy !== currentUserId) {
        throw new ForbiddenException('You can only update your own cancel requests.');
      }

      const updateData: any = {};
      if (dto.cancellationReason !== undefined) {
        updateData.cancellationReason = dto.cancellationReason;
      }
      if (dto.remarks !== undefined) {
        updateData.remarks = dto.remarks;
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException('No data provided for update.');
      }

      const updated = await prisma.cancelFormRequests.update({
        where: { id },
        data: updateData,
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update cancel request: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Process a cancel request action (APPROVED/REJECTED)
   * When approved, updates the original application status to CANCELLED
   * and creates workflow history entries
   */
  async processCancelRequestAction(
    id: number,
    dto: CancelRequestActionDto,
    currentUserId: number,
  ): Promise<any> {
    try {
      // Fetch the cancel request
      const cancelRequest = await prisma.cancelFormRequests.findUnique({
        where: { id },
      });

      if (!cancelRequest) {
        throw new NotFoundException('Cancel request not found.');
      }

      if (cancelRequest.status !== 'PENDING') {
        throw new BadRequestException('Cancel request has already been processed.');
      }

      if (dto.action === 'REJECTED' && !dto.remarks) {
        throw new BadRequestException('Remarks are required when rejecting a cancel request.');
      }

      // The cancel request references the fresh license application via freshLicenseId
      if (!cancelRequest.freshLicenseId) {
        throw new BadRequestException('Cancel request has no associated fresh license application.');
      }

      // Fetch the application for validation
      const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: cancelRequest.freshLicenseId },
      });

      if (!application) {
        throw new NotFoundException('Original application not found.');
      }

      // Pre-fetch the CANCEL status and action if action is APPROVED
      let cancelStatus: any = null;
      let cancelAction: any = null;
      if (dto.action === 'APPROVED') {
        [cancelStatus, cancelAction] = await Promise.all([
          prisma.statuses.findFirst({ where: { code: ACTION_CODES.CANCEL } }),
          prisma.actiones.findFirst({ where: { code: 'CANCEL' } }),
        ]);
        if (!cancelStatus) {
          throw new InternalServerErrorException('CANCEL status not found in the system.');
        }
      }

      // Build the cancel request update payload
      const cancelUpdateData: any = {
        status: dto.action,
        actionedBy: currentUserId,
        actionedDate: new Date(),
      };

      if (dto.action === 'APPROVED' && cancelStatus) {
        cancelUpdateData.workFlowStatusId = cancelStatus.id;
      }

      if (dto.remarks) {
        const originalRemarks = cancelRequest.remarks || '';
        cancelUpdateData.remarks = originalRemarks
          ? `${originalRemarks}\n[Action: ${dto.action}] ${dto.remarks}`
          : `[Action: ${dto.action}] ${dto.remarks}`;
      }

      let updatedCancelRequest: any;
      let cancelActionResult: any = { success: true, message: 'Cancel request updated.' };

      if (dto.action === 'APPROVED') {
        // Wrap all APPROVE operations in a transaction for atomicity
        const txResult = await prisma.$transaction(async (tx: any) => {
          // 1. Update the cancel request status
          const updated = await tx.cancelFormRequests.update({
            where: { id },
            data: cancelUpdateData,
          });

          // 2. Update the original application to CANCELLED status
          await tx.freshLicenseApplicationPersonalDetails.update({
            where: { id: cancelRequest.freshLicenseId },
            data: {
              workflowStatusId: cancelStatus.id,
              isPending: false,
            },
          });

          // 3. Create workflow history entry for fresh license
          if (cancelAction) {
            await tx.freshLicenseApplicationsFormWorkflowHistories.create({
              data: {
                applicationId: cancelRequest.freshLicenseId,
                previousUserId: application.currentUserId || currentUserId,
                nextUserId: currentUserId,
                actionTaken: ACTION_CODES.CANCEL,
                remarks: `Application cancelled. Reason: ${cancelRequest.cancellationReason}`,
                actionesId: cancelAction.id,
              },
            });
          }

          // 4. Create CancelWorkflowHistories record
          await tx.cancelWorkflowHistories.create({
            data: {
              applicationId: cancelRequest.id,
              previousUserId: currentUserId,
              nextUserId: currentUserId,
              actionTaken: ACTION_CODES.CANCEL,
              remarks: cancelRequest.remarks,
            },
          });

          cancelActionResult = {
            success: true,
            message: 'cancel performed successfully.',
          };

          return updated;
        });

        updatedCancelRequest = txResult;
      } else {
        // REJECTED path: single operation, no transaction needed
        updatedCancelRequest = await prisma.cancelFormRequests.update({
          where: { id },
          data: cancelUpdateData,
        });
      }

      return {
        success: true,
        message: `Cancel request ${dto.action.toLowerCase()}.`,
        data: {
          cancelRequest: updatedCancelRequest,
          cancelAction: cancelActionResult,
        },
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to process cancel request: ${error?.message || 'Unknown error'}`,
      );
    }
  }
}
