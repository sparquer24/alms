import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { CreateCancelRequestDto } from './dto/create-cancel-request.dto';
import { UpdateCancelRequestDto } from './dto/update-cancel-request.dto';
import { CancelRequestActionDto } from './dto/cancel-request-action.dto';
import { ACTION_CODES, STATUS_CODES } from '../../constants/workflow-actions';
import { LicenseStatus } from '@prisma/client';

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
    currentUserRoleId: number | null = null,
  ): Promise<any> {
    try {
      console.log('--- createCancelRequest Start ---');
      console.log('DTO:', JSON.stringify(dto, null, 2));
      
      const initiateStatus = await prisma.statuses.findFirst({
        where: {
          isStarted: true,
          isActive: true,
        },
        orderBy: { id: 'asc' },
      });
      
      console.log('currentUserId:', currentUserId);

      // Wrap creation and workflow history in a transaction for atomicity.
      // The CANCELLED status check runs INSIDE the transaction so it is atomic with the INSERT.
      const cancelRequest = await prisma.$transaction(async (tx: any) => {
        // Check if the license has been CANCELLED (inside transaction for atomicity)
        const targetLicense = await tx.licenses.findUnique({
          where: { id: dto.licenseId },
          select: { status: true, presentStateId: true, permanentStateId: true },
        });

        if (targetLicense && targetLicense.status === 'CANCELLED') {
          throw new BadRequestException(
            'Cannot create a cancellation request for a cancelled license. This license has been permanently cancelled and no further actions are allowed.',
          );
        }

        // Check if a PENDING cancellation request already exists for this license
        const existingPending = await tx.cancelFormRequests.findFirst({
          where: {
            licenseId: dto.licenseId,
            actionedDate: null,
          },
          select: { id: true },
        });

        if (existingPending) {
          throw new BadRequestException(
            'A cancellation request for this license already exists and is pending approval.',
          );
        }

        const resolvedStateId = targetLicense?.presentStateId || targetLicense?.permanentStateId || null;

        // generate a unique acknowledgement number for the cancel request
        const acknowledgementNo = `CAF${Date.now()}${Math.floor(Math.random() * 1000)}`;
        console.log('Generated acknowledgementNo:', acknowledgementNo);
        console.log("create data:", {
          licenseId: dto.licenseId,
          applicationType: dto.applicationType,
          cancellationReason: dto.cancellationReason,
          remarks: dto.remarks || null,
          requestedBy: currentUserId,
          currentUserId: currentUserId,
          stateId: resolvedStateId,
          requestedDate: new Date(),
          workFlowStatusId: initiateStatus?.id || null,
          acknowledgementNo,
          applicantName: dto.applicantName,
        });
        const created = await tx.cancelFormRequests.create({
          data: {
            licenseId: dto.licenseId,
            applicationType: dto.applicationType,
            cancellationReason: dto.cancellationReason,
            remarks: dto.remarks || null,
            requestedBy: currentUserId,
            currentUserId: currentUserId,
            stateId: resolvedStateId,
            requestedDate: new Date(),
            workFlowStatusId: initiateStatus?.id || null,
            acknowledgementNo,
            applicantName :dto.applicantName,
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
        if (initiateStatus) {
        
          // Also create the INITIATED entry in CancelWorkflowHistories
          // so the cancel request's own workflow history starts from submission
          const initiateAction = await tx.actiones.findFirst({
            where: { code: 'INITIATED' },
          });

          await tx.cancelWorkflowHistories.create({
            data: {
              applicationId: created.id,
              previousUserId: null,
              nextUserId: null,
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
          licenseId: dto.licenseId,
          currentUserId,
          errorMeta: error.meta,
        });
        throw new BadRequestException(
          `Invalid reference: foreign key constraint failed on field "${field}". Ensure licenseQId and user are valid.`,
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
        select: {
          id: true,
          licenseId: true,
          acknowledgementNo: true,
          cancellationReason: true,
          remarks: true,
          requestedBy: true,
          actionedBy: true,
          currentUserId: true,
          previousUserId: true,
          workFlowStatusId: true,
          requestedDate: true,
          actionedDate: true,
          createdAt: true,
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
          Licenses: {
            select: {
              id: true,
              licenseNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              issueDate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          cancelWorkflowHistories: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              applicationId: true,
              previousUserId: true,
              nextUserId: true,
              actionTaken: true,
              remarks: true,
              createdAt: true,
              previousRoleId: true,
              nextRoleId: true,
              actionesId: true,
              nextUser: {
                select: { role: true },
              },
              previousUser: {
                select: { role: true },
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
   //  console.log('--- getCancelRequestById ---');
    // console.log(cancelRequest);
      const computedApplicantName = cancelRequest.Licenses
      return {
        ...cancelRequest,
        applicantName: computedApplicantName || cancelRequest.requester?.username || `Cancel Request #${cancelRequest.id}`,
      };
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
    requestedBy?: number;
    licenseId?: number;
    status?: string;
    stateId?: number;
    roleCode?: string;
  }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const page = Math.max(Number(filters.page ?? 1), 1);
      const limit = Math.max(Number(filters.limit ?? 10), 1);
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.roleCode !== 'SUPER_ADMIN' && filters.stateId) {
        where.OR = [
          { stateId: filters.stateId },
          { Licenses: { presentStateId: filters.stateId } },
          { requester: { stateId: filters.stateId } },
        ];
      }

      if (filters.requestedBy) {
        where.requestedBy = filters.requestedBy;
      }
      if (filters.licenseId) {
        where.licenseId = filters.licenseId;
      }
      if (filters.status) {
        if (filters.status === 'PENDING') {
          where.actionedDate = null;
        } else if (filters.status === 'APPROVED') {
          where.actionedDate = { not: null };
        }
      }

      const [cancelRequests, total] = await Promise.all([
        prisma.cancelFormRequests.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            licenseId: true,
            acknowledgementNo: true,
            cancellationReason: true,
            remarks: true,
            requestedBy: true,
            actionedBy: true,
            currentUserId: true,
            previousUserId: true,
            workFlowStatusId: true,
            requestedDate: true,
            actionedDate: true,
            createdAt: true,
            updatedAt: true,
            applicationType: true,
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
            Licenses: {
              select: {
                firstName: true,
                middleName: true,
                lastName: true,
              },
            },
          },
        }),
        prisma.cancelFormRequests.count({ where }),
      ]);

      const transformedCancelRequests = cancelRequests.map((row: any) => {
        const applicantName = row.Licenses
          ? [row.Licenses.firstName, row.Licenses.middleName, row.Licenses.lastName]
              .filter((part: any) => part && String(part).trim())
              .join(' ')
          : '';

        return {
          ...row,
          applicantName: applicantName || row.requester?.username || `Cancel Request #${row.id}`,
        };
      });

      return {
        data: transformedCancelRequests,
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
        select: {
          id: true,
          requestedBy: true,
          actionedBy: true,
          currentUserId: true,
          previousUserId: true,
          licenseId: true,
          applicationType: true,
          workFlowStatusId: true,
          cancellationReason: true,
        },
      });

      if (!cancelRequest) {
        throw new NotFoundException('Cancel request not found.');
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

      const updated:any = await prisma.cancelFormRequests.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          licenseId: true,
          acknowledgementNo: true,
          cancellationReason: true,
          remarks: true,
          requestedBy: true,
          actionedBy: true,
          currentUserId: true,
          previousUserId: true,
          workFlowStatusId: true,
          requestedDate: true,
          actionedDate: true,
          createdAt: true,
          updatedAt: true,
          applicationType: true,
          requester: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          Licenses: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
            },
          },
        },
      });

      const applicantName = updated.Licenses
        ? [updated.Licenses.firstName, updated.Licenses.middleName, updated.Licenses.lastName]
            .filter((part: any) => part && String(part).trim())
            .join(' ')
        : '';

      return {
        ...updated,
        applicantName: applicantName || updated.requester?.username || `Cancel Request #${updated.id}`,
      };
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
        select: {
          id: true,
          requestedBy: true,
          actionedBy: true,
          currentUserId: true,
          previousUserId: true,
          licenseId: true,
          applicationType: true,
          workFlowStatusId: true,
          cancellationReason: true,
          remarks: true,
        },
      });

      if (!cancelRequest) {
        throw new NotFoundException('Cancel request not found.');
      }

      if (dto.action === 'REJECTED' && !dto.remarks) {
        throw new BadRequestException('Remarks are required when rejecting a cancel request.');
      }

      // The cancel request references the license via licenseId
      if (!cancelRequest.licenseId) {
        throw new BadRequestException('Cancel request has no associated license.');
      }

      // Fetch the license for validation
      const application = await prisma.licenses.findUnique({
        where: { id: cancelRequest.licenseId },
      });

      if (!application) {
        throw new NotFoundException('Original license not found.');
      }

      const cancelRequestStatusCode = dto.action === 'REJECTED' ? STATUS_CODES.REJECT : dto.action;
      const cancelRequestStatus = await prisma.statuses.findFirst({
        where: { code: cancelRequestStatusCode },
      });

      if (!cancelRequestStatus) {
        throw new InternalServerErrorException(`${cancelRequestStatusCode} status not found in the system.`);
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
        actionedBy: currentUserId,
        actionedDate: new Date(),
        workFlowStatusId: cancelRequestStatus.id,
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

          // Capture the license's current status and tracking fields BEFORE the update
          // so the workflow history and previous-modified tracking are accurate.
          const licenseBeforeCancel = await tx.licenses.findUnique({
            where: { id: cancelRequest.licenseId },
            select: {
              status: true,
              lastModifiedAppType: true,
              lastModifiedAppId: true,
              lastModifiedRenewalId: true,
              renewalApplicationId: true,
              freshApplicationId: true,
            },
          });

          // 2. Update the license with cancellation metadata
          // Only cancellation-relevant fields are updated — personal details,
          // addresses, occupation, criminal history, documents, weapons,
          // and other applicant data are preserved intact for audit/historical purposes.
          await tx.licenses.update({
            where: { id: cancelRequest.licenseId },
            data: {
              status: LicenseStatus.CANCELLED,
              validTill: null,
              cancellationReason: cancelRequest.cancellationReason,
              cancellationDate: new Date(),
              cancelApplicationId: cancelRequest.id,
              // Shift current → previous tracking
              previousModifiedAppType: licenseBeforeCancel?.lastModifiedAppType,
              previousModifiedAppId: licenseBeforeCancel?.lastModifiedAppId ?? (
                (licenseBeforeCancel?.lastModifiedAppType || '').toUpperCase() === 'FRESH'
                  ? licenseBeforeCancel?.freshApplicationId
                  : licenseBeforeCancel?.lastModifiedRenewalId ?? licenseBeforeCancel?.renewalApplicationId
              ),
              lastModifiedAppType: 'CANCELLATION',
              lastModifiedAppId: cancelRequest.id,
            },
          });

          // 3. Create LicenseWorkflowHistory entry
          if (cancelAction) {
            await tx.licenseWorkflowHistory.create({
              data: {
                licenseId: cancelRequest.licenseId,
                action: ACTION_CODES.CANCEL,
                applicationId: cancelRequest.id,
                applicationType: cancelRequest.applicationType,
                previousStatus: licenseBeforeCancel?.status ?? application.status,
                newStatus: LicenseStatus.CANCELLED,
                changedBy: currentUserId,
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
