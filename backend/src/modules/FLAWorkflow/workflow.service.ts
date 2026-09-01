import { Injectable, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { LicenseStatus, RoleFlowApplicationType } from '@prisma/client';
import { ForwardDto } from './dto/forward.dto';
import { TERMINAL_ACTIONS, FORWARD_ACTIONS, ACTION_CODES, isTerminalAction, isForwardAction, isApprovalAction, isRejectionAction,  isReEnquiryAction, isRecommendAction, isNotRecommendAction } from '../../constants/workflow-actions';
import { normalizeApplicationType } from '../../constants/flow-mapping';
import { CancelWorkflowHandler } from './handlers/cancel-workflow.handler';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly cancelWorkflowHandler: CancelWorkflowHandler,
  ) {}

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
    if (applicationType === 'flawUpdate' || applicationType === 'FreshLicenseApplicationForm' || applicationType.toLowerCase() === 'fresh') {
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
    } else if (applicationType === 'renewUpdate' || applicationType === 'RenewalApplicationForm' || applicationType.toLowerCase() === 'renewal') {
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
    } 
    // else if (
    //   applicationType === 'CancelFormRequest' ||
    //   applicationType === 'CancelApplication' ||
    //   applicationType === 'CancelForm' ||
    //   applicationType === 'cancel'
    // ) {
    //   const cancelRequests = await prisma.cancelFormRequests.findMany({
    //     select: {
    //       id: true,
    //       licenseId: true,
    //       applicationType: true,
    //       cancellationReason: true,
    //       remarks: true,
    //       workFlowStatusId: true,
    //       workflowStatus: {
    //         select: {
    //           code: true,
    //         },
    //       },
    //       currentUserId: true,
    //       previousUserId: true,
    //       requestedBy: true,
    //       actionedBy: true,
    //       requestedDate: true,
    //       actionedDate: true,
    //       createdAt: true,
    //       updatedAt: true,
    //       Licenses: {
    //         select: {
    //           id: true,
    //           firstName: true,
    //           middleName: true,
    //           lastName: true,
    //         },
    //       },
    //     }
    //   });
    //   return cancelRequests.map(r => {
    //     const applicantName = r.Licenses
    //       ? [r.Licenses.firstName, r.Licenses.middleName, r.Licenses.lastName]
    //           .filter(Boolean)
    //           .join(' ') || 'Applicant'
    //       : 'Applicant';

    //     return {
    //       id: r.id,
    //       freshLicenseId: r.licenseId,
    //       applicationType: r.applicationType,
    //       cancellationReason: r.cancellationReason,
    //       remarks: r.remarks,
    //       applicantName,
    //       requestedDate: r.requestedDate,
    //       actionedDate: r.actionedDate,
    //       workflowStatusId: r.workFlowStatusId,
    //       currentUserId: r.currentUserId || r.actionedBy || r.requestedBy,
    //       previousUserId: r.previousUserId || r.requestedBy,
    //       isApproved: isApprovalAction(r.workflowStatus?.code || ''),
    //       isRejected: isRejectionAction(r.workflowStatus?.code || ''),
    //       isRecommended: false,
    //       isNotRecommended: false,
    //       isPending: !isTerminalAction(r.workflowStatus?.code || ''),
    //       isReEnquiry: false,
    //       createdAt: r.createdAt,
    //       updatedAt: r.updatedAt,
    //     };
    //   });
    // } 
    else {
      throw new Error(`Invalid applicationType: ${applicationType}`);
    }
  }

  async getWorkflowHistory(applicationId: number, applicationType: string = 'fresh'): Promise<any[]> {
    if (applicationType.toLowerCase().includes('renew')) {
      const history = await prisma.renewalApplicationsFormWorkflowHistories.findMany({
        where: { applicationId },
        include: {
          actiones: true,
          previousUser: { select: { id: true, username: true } },
          nextUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'asc' }
      });

      // If no direct results, the applicationId might be a license ID — resolve it
      if (history.length === 0) {
        const license = await prisma.licenses.findUnique({
          where: { id: applicationId },
          select: { renewalApplicationId: true, freshApplicationId: true },
        });
        if (license?.renewalApplicationId && license.renewalApplicationId !== applicationId) {
          return this.getWorkflowHistory(license.renewalApplicationId, 'renewal');
        }
        if (license?.freshApplicationId && license.freshApplicationId !== applicationId) {
          return this.getWorkflowHistory(license.freshApplicationId, 'fresh');
        }
      }

      return history;
    } else if (applicationType.toLowerCase().includes('cancel')) {
      const history = await prisma.cancelWorkflowHistories.findMany({
        where: { applicationId },
        include: {
          actiones: true,
          previousUser: { select: { id: true, username: true } },
          nextUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'asc' }
      });

      // If no direct results, try resolving via license ID
      if (history.length === 0) {
        const license = await prisma.licenses.findUnique({
          where: { id: applicationId },
          select: { cancelApplicationId: true },
        });
        if (license?.cancelApplicationId && license.cancelApplicationId !== applicationId) {
          return this.getWorkflowHistory(license.cancelApplicationId, 'cancel');
        }
      }

      return history;
    } else {
      const history = await prisma.freshLicenseApplicationsFormWorkflowHistories.findMany({
        where: { applicationId },
        include: {
          actiones: true,
          previousUser: { select: { id: true, username: true } },
          nextUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'asc' }
      });

      // If no direct results, try resolving via license ID
      if (history.length === 0) {
        const license = await prisma.licenses.findUnique({
          where: { id: applicationId },
          select: { freshApplicationId: true },
        });
        if (license?.freshApplicationId && license.freshApplicationId !== applicationId) {
          return this.getWorkflowHistory(license.freshApplicationId, 'fresh');
        }
      }

      return history;
    }
  }

  private async resolveApplicationTypeFromId(applicationId: number): Promise<RoleFlowApplicationType> {
    const cancelRequest = await prisma.cancelFormRequests.findUnique({
      where: { id: applicationId },
      select: { id: true },
    });
    if (cancelRequest) return 'CANCEL';

    const renewalApp = await prisma.renewalFormPersonalDetails.findUnique({
      where: { id: applicationId },
      select: { id: true },
    });
    if (renewalApp) return 'RENEWAL';

    const freshApp = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: applicationId },
      select: { id: true },
    });
    if (freshApp) return 'FRESH';

    throw new BadRequestException(
      `Application with ID ${applicationId} not found in any application table.`,
    );
  }

  async checkRoleActionPermission(roleId: number, actionId: number, applicationType?: string): Promise<boolean> {
    const appType = normalizeApplicationType(applicationType ?? 'ALL');
    const mapping = await prisma.rolesActionsMapping.findFirst({
      where: {
        roleId,
        actionId,
        applicationType: appType,
      },
    });
    return mapping !== null && mapping.isActive === true;
  }

  /**
   * Resolve the location (stateId, districtId) used to scope the role-mapping
   * lookup for an application. Mirrors getUsersInHierarchy(): FRESH/RENEWAL use
   * the application's present address; CANCEL resolves through the cancel
   * request → license → source application, with the license's flattened
   * address as a fallback.
   */
  private async resolveApplicationLocation(applicationType: string, applicationId: number): Promise<{ stateId: number | null; districtId: number | null }> {
    const t = applicationType.toLowerCase();

    if (t.includes('renew')) {
      const app = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
        select: { presentAddress: { select: { stateId: true, districtId: true } } },
      });
      return { stateId: app?.presentAddress?.stateId ?? null, districtId: app?.presentAddress?.districtId ?? null };
    }

    if (t.includes('cancel')) {
      const cancelRequest = await prisma.cancelFormRequests.findUnique({
        where: { id: applicationId },
        select: { licenseId: true },
      });
      if (!cancelRequest?.licenseId) return { stateId: null, districtId: null };

      const license = await prisma.licenses.findUnique({
        where: { id: cancelRequest.licenseId },
        select: { freshApplicationId: true, renewalApplicationId: true, presentStateId: true, presentDistrictId: true },
      });
      if (!license) return { stateId: null, districtId: null };

      if (license.freshApplicationId) {
        const app = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
          where: { id: license.freshApplicationId },
          select: { presentAddress: { select: { stateId: true, districtId: true } } },
        });
        if (app?.presentAddress) return { stateId: app.presentAddress.stateId, districtId: app.presentAddress.districtId };
      }
      if (license.renewalApplicationId) {
        const app = await prisma.renewalFormPersonalDetails.findUnique({
          where: { id: license.renewalApplicationId },
          select: { presentAddress: { select: { stateId: true, districtId: true } } },
        });
        if (app?.presentAddress) return { stateId: app.presentAddress.stateId, districtId: app.presentAddress.districtId };
      }
      if (license.presentStateId) return { stateId: license.presentStateId, districtId: license.presentDistrictId ?? null };
      return { stateId: null, districtId: null };
    }

    // FRESH
    const app = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: applicationId },
      select: { presentAddress: { select: { stateId: true, districtId: true } } },
    });
    return { stateId: app?.presentAddress?.stateId ?? null, districtId: app?.presentAddress?.districtId ?? null };
  }

  /**
   * Resolve the role IDs the current role is allowed to forward to, scoped by
   * application type + location. Resolution order mirrors the forward-list
   * endpoint: exact (stateId, districtId) → state-level → global mapping.
   */
  private async resolveAllowedNextRoleIds(
    currentRoleId: number,
    applicationType: string,
    stateId: number | null,
    districtId: number | null,
  ): Promise<number[]> {
    let appType: any = 'FRESH';
    try {
      appType = normalizeApplicationType(applicationType);
    } catch {
      // Unrecognized application type — fall back to fresh, matching the
      // dispatch default in handleUserAction().
    }

    const mapping = await prisma.roleFlowMapping.findFirst({
      where: {
        currentRoleId,
        applicationType: appType,
        purpose: 'ALL',
        OR: [
          { stateId, districtId },
          { stateId, districtId: null },
          { stateId: null, districtId: null },
        ],
      },
      orderBy: [
        { stateId: { sort: 'desc', nulls: 'last' } },
        { districtId: { sort: 'desc', nulls: 'last' } },
      ],
      select: { nextRoleIds: true },
    });

    return mapping?.nextRoleIds ?? [];
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

    // === LICENSE HOOK: Create license on fresh application approval ===
    if (isApprovalAction(actionCode)) {
      await this.issueLicenseFromFreshApproval(payload.applicationId, payload.currentUserId);
    }

    return updatedApplication;
  }

  /**
   * Create a new license record when a fresh application is approved
   */
  private async issueLicenseFromFreshApproval(applicationId: number, issuedBy: number) {
    // Check if license already exists for this application
    const existingLicense = await prisma.licenses.findFirst({
      where: { freshApplicationId: applicationId }
    });
    if (existingLicense) return;

    // Fetch full application data with includes
    const appData = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: applicationId },
      include: {
        presentAddress: true,
        permanentAddress: true,
        occupationAndBusiness: true,
        licenseDetails: { include: { requestedWeapons: true } }
      }
    });

    if (!appData) return;

    const licDetail = appData.licenseDetails?.[0];
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(6, '0');
    const licenseNumber = `LUAN${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${ms}`;
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 2);

    const license = await prisma.$transaction(async (tx: any) => {
      const created = await tx.licenses.create({
        data: {
          licenseNumber,
          almsLicenseId: appData.almsLicenseId,
          freshApplicationId: appData.id,
          issueDate: new Date(),
          firstName: appData.firstName,
          middleName: appData.middleName,
          lastName: appData.lastName,
          parentOrSpouseName: appData.parentOrSpouseName,
          sex: appData.sex,
          dateOfBirth: appData.dateOfBirth || undefined,
          placeOfBirth: appData.placeOfBirth,
          aadharNumber: appData.aadharNumber,
          panNumber: appData.panNumber,
          validFrom: new Date(),
          validTill,
          armsCategory: licDetail?.armsCategory || undefined,
          areaOfValidity: licDetail?.areaOfValidity,
          ammunitionDescription: licDetail?.ammunitionDescription,
          licencePlaceArea: licDetail?.licencePlaceArea,
          specialConsiderationReason: licDetail?.specialConsiderationReason,
          needForLicense: licDetail?.needForLicense || undefined,
          presentAddressLine: appData.presentAddress?.addressLine,
          presentStateId: appData.presentAddress?.stateId,
          presentDistrictId: appData.presentAddress?.districtId,
          presentPoliceStationId: appData.presentAddress?.policeStationId,
          presentZoneId: appData.presentAddress?.zoneId,
          presentDivisionId: appData.presentAddress?.divisionId,
          presentRangeOfficeId: appData.presentAddress?.rangeOfficeId,
          permanentAddressLine: appData.permanentAddress?.addressLine,
          permanentStateId: appData.permanentAddress?.stateId,
          permanentDistrictId: appData.permanentAddress?.districtId,
          permanentPoliceStationId: appData.permanentAddress?.policeStationId,
          permanentZoneId: appData.permanentAddress?.zoneId,
          permanentDivisionId: appData.permanentAddress?.divisionId,
          permanentRangeOfficeId: appData.permanentAddress?.rangeOfficeId,
          occupation: appData.occupationAndBusiness?.occupation,
          officeAddress: appData.occupationAndBusiness?.officeAddress,
          status: LicenseStatus.ACTIVE,
          renewalCount: 0,
          issuedBy,
          lastModifiedAppType: 'FRESH',
          lastModifiedAppId: appData.id,
          endorsedWeapons: licDetail?.requestedWeapons?.length
            ? { connect: licDetail.requestedWeapons.map((w: any) => ({ id: w.id })) }
            : undefined,
        }
      });

      // Create LicenseWorkflowHistory entry within same transaction
      await tx.licenseWorkflowHistory.create({
        data: {
          licenseId: created.id,
          action: 'ISSUED',
          applicationId,
          applicationType: 'FRESH',
          newStatus: LicenseStatus.ACTIVE,
          changedBy: issuedBy,
          remarks: 'License issued upon fresh application approval',
        }
      });

      // Link the FreshApplication to the newly created license
      await tx.freshLicenseApplicationPersonalDetails.update({
        where: { id: appData.id },
        data: {
          licenseId: created.id
        }
      });

      return created;
    });
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

    // === LICENSE HOOK: Update license on renewal application approval ===
    if (isApprovalAction(actionCode)) {
      await this.updateLicenseFromRenewalApproval(payload.applicationId, payload.currentUserId);
    }

    return updatedApplication;
  }

  /**
   * Update the existing license record when a renewal application is approved
   */
  private async updateLicenseFromRenewalApproval(renewalApplicationId: number, changedBy: number) {
    // Fetch the renewal application with its data
    const renewalApp = await prisma.renewalFormPersonalDetails.findUnique({
      where: { id: renewalApplicationId },
      include: {
        presentAddress: true,
        permanentAddress: true,
        occupationAndBusiness: true,
        licenseDetails: { include: { requestedWeapons: true } }
      }
    });

    if (!renewalApp) return;

    // Find the existing license by licenseId (from the renewal form)
    // If licenseId is not set, fall back to licenseNumber lookup
    const existingLicense = renewalApp.licenseId
      ? await prisma.licenses.findUnique({
          where: { id: renewalApp.licenseId }
        })
      : await prisma.licenses.findUnique({
          where: { licenseNumber: renewalApp.licenseNumber }
        });

    if (!existingLicense) return;

    const licDetail = renewalApp.licenseDetails?.[0];
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 2);

    const updated = await prisma.$transaction(async (tx: any) => {
      const updatedLicense = await tx.licenses.update({
        where: { id: existingLicense.id },
        data: {
        // Update personal details if changed
        firstName: renewalApp.firstName,
        middleName: renewalApp.middleName,
        lastName: renewalApp.lastName,
        parentOrSpouseName: renewalApp.parentOrSpouseName,
        dateOfBirth: renewalApp.dateOfBirth || undefined,
        aadharNumber: renewalApp.aadharNumber,
        panNumber: renewalApp.panNumber,

        // Update license terms
        validTill,
        lastRenewedDate: new Date(),
        armsCategory: licDetail?.armsCategory || existingLicense.armsCategory,
        areaOfValidity: licDetail?.areaOfValidity || existingLicense.areaOfValidity,
        ammunitionDescription: licDetail?.ammunitionDescription || existingLicense.ammunitionDescription,
        licencePlaceArea: licDetail?.licencePlaceArea || existingLicense.licencePlaceArea,
        specialConsiderationReason: licDetail?.specialConsiderationReason || existingLicense.specialConsiderationReason,
        needForLicense: licDetail?.needForLicense || existingLicense.needForLicense,

        // Update address if provided
        presentAddressLine: renewalApp.presentAddress?.addressLine ?? existingLicense.presentAddressLine,
        presentStateId: renewalApp.presentAddress?.stateId ?? existingLicense.presentStateId,
        presentDistrictId: renewalApp.presentAddress?.districtId ?? existingLicense.presentDistrictId,
        presentPoliceStationId: renewalApp.presentAddress?.policeStationId ?? existingLicense.presentPoliceStationId,
        presentZoneId: renewalApp.presentAddress?.zoneId ?? existingLicense.presentZoneId,
        presentDivisionId: renewalApp.presentAddress?.divisionId ?? existingLicense.presentDivisionId,
        presentRangeOfficeId: renewalApp.presentAddress?.rangeOfficeId ?? existingLicense.presentRangeOfficeId,

        permanentAddressLine: renewalApp.permanentAddress?.addressLine ?? existingLicense.permanentAddressLine,
        permanentStateId: renewalApp.permanentAddress?.stateId ?? existingLicense.permanentStateId,
        permanentDistrictId: renewalApp.permanentAddress?.districtId ?? existingLicense.permanentDistrictId,
        permanentPoliceStationId: renewalApp.permanentAddress?.policeStationId ?? existingLicense.permanentPoliceStationId,
        permanentZoneId: renewalApp.permanentAddress?.zoneId ?? existingLicense.permanentZoneId,
        permanentDivisionId: renewalApp.permanentAddress?.divisionId ?? existingLicense.permanentDivisionId,
        permanentRangeOfficeId: renewalApp.permanentAddress?.rangeOfficeId ?? existingLicense.permanentRangeOfficeId,

        // Update occupation
        occupation: renewalApp.occupationAndBusiness?.occupation ?? existingLicense.occupation,
        officeAddress: renewalApp.occupationAndBusiness?.officeAddress ?? existingLicense.officeAddress,

        // Update tracking
        renewalCount: { increment: 1 },
        renewalApplicationId: renewalApplicationId,
        lastModifiedRenewalId: renewalApplicationId,
        renewalIds: {
          push: renewalApplicationId,
        },
        // Shift current → previous tracking before updating
        previousModifiedAppType: existingLicense.lastModifiedAppType,
        previousModifiedAppId: existingLicense.lastModifiedAppId ?? (
          (existingLicense.lastModifiedAppType || '').toUpperCase() === 'FRESH'
            ? existingLicense.freshApplicationId
            : existingLicense.lastModifiedRenewalId ?? existingLicense.renewalApplicationId
        ),
        lastModifiedAppType: 'RENEWAL',
        lastModifiedAppId: renewalApplicationId,
        status: LicenseStatus.ACTIVE,

        // Update endorsed weapons
        endorsedWeapons: licDetail?.requestedWeapons?.length
          ? { set: licDetail.requestedWeapons.map((w: any) => ({ id: w.id })) }
          : undefined,
      }
    });

    // Create LicenseWorkflowHistory entry within the same transaction
    await tx.licenseWorkflowHistory.create({
      data: {
        licenseId: updatedLicense.id,
        action: 'RENEWED',
        applicationId: renewalApplicationId,
        applicationType: 'RENEWAL',
        previousStatus: existingLicense.status,
        newStatus: LicenseStatus.ACTIVE,
        changedBy,
        remarks: 'License renewed upon renewal application approval',
      }
    });
    // Update the renewal application with the licenseId and licenseNumber
    await tx.renewalFormPersonalDetails.update({
      where: { id: renewalApplicationId },
      data: {
        licenseId: updatedLicense.id ,
        licenseNumber: updatedLicense.licenseNumber,
      }
    });

    return updatedLicense;
    }); // end transaction
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
  }, clientApplicationType : string,)

   {
     // 1. Resolve the true application type from the database.
     // SECURITY: Never trust the client-supplied applicationType. The backend
     // determines the actual type by probing which table holds the applicationId.
     const applicationType = await this.resolveApplicationTypeFromId(payload.applicationId);

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
    // Uses the server-resolved applicationType — a FRESH-only mapping will NOT
    // grant access when the application is actually a RENEWAL.
    const hasPermission = await this.checkRoleActionPermission(currentRoleId, payload.actionId, applicationType);
    if (!hasPermission) {
      throw new ForbiddenException(
        `You are not authorized to perform this action for ${applicationType} applications. ` +
        `Your role does not have permission for action ID: ${payload.actionId}`,
      );
    }

     // 3. Determine next user and validate based on action type
    let nextUserId: number | null 
     const nextUserRoleId = await prisma.users.findUnique({
      where: { id: payload.nextUserId },
      select: { roleId: true },
    });

    const actionCode = payload.action.code.toUpperCase();

    // ---- Role-mapping enforcement (FORWARD actions only) ----
    // The target role must be permitted by the configured role mapping (scoped
    // by application type + state/district) — a client cannot bypass Role
    // Mapping by sending an arbitrary nextUserId. Re-visiting a role that
    // already processed the application is intentionally ALLOWED, matching the
    // admin-configured flow; workflow history still records the full trail.
    if (isForwardAction(actionCode) && nextUserRoleId?.roleId) {
      const { stateId, districtId } = await this.resolveApplicationLocation(applicationType, payload.applicationId);
      const allowedRoleIds = await this.resolveAllowedNextRoleIds(currentRoleId, applicationType, stateId, districtId);

      if (!allowedRoleIds.includes(nextUserRoleId.roleId)) {
        throw new ForbiddenException(
          `Target user (id ${payload.nextUserId}) has role ${nextUserRoleId.roleId}, which is not permitted by the configured role mapping for this application.`,
        );
      }
    }

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

    // 5. Dispatch to the correct application handler based on server-resolved type
    if (applicationType === 'RENEWAL') {
      await this.renewalapplication(payload, status, nextUserId, actionCode, nextUserRoleId, currentRoleId)
    } else if (applicationType === 'CANCEL') {
      await this.cancelFormApplication(payload, status, nextUserId, actionCode, nextUserRoleId, currentRoleId)
    } else {
      // applicationType === 'FRESH' (or 'ALL' which shouldn't reach here after resolution)
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
  }, status: any, nextUserId: number, actionCode: string, nextUserRoleId: any, currentRoleId: number) {
    // 1. Fetch the cancel request
    const cancelRequest = await prisma.cancelFormRequests.findUnique({
      where: { id: payload.applicationId },
      include: {
        workflowStatus: {
          select: { code: true },
        },
      },
    });
    if (!cancelRequest) {
      throw new NotFoundException('Cancel request not found');
    }

    if (isTerminalAction(cancelRequest.workflowStatus?.code || '')) {
      throw new BadRequestException('Cancel request has already been processed.');
    }

    if (!cancelRequest.licenseId) {
      throw new BadRequestException('Cancel request has no associated license.');
    }

    // ----------------------------------------------------------------
    // FIX: cancelRequest.licenseId is the ID in the `licenses` table.
    // Look up the license to find the source application IDs.
    // ----------------------------------------------------------------
    const licenseRecord = await prisma.licenses.findUnique({
      where: { id: cancelRequest.licenseId },
      select: {
        id: true,
        freshApplicationId: true,
        renewalApplicationId: true,
        licenseNumber: true,
      }
    });

    if (!licenseRecord) {
      throw new NotFoundException('Linked license record not found');
    }

    // Determine the source application from the license record
    let application: any = null;
    let isRenewal = false;
    let sourceAppId: number | null = null;

    if (licenseRecord.freshApplicationId) {
      sourceAppId = licenseRecord.freshApplicationId;
      application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: sourceAppId },
      });
      isRenewal = false;
    } else if (licenseRecord.renewalApplicationId) {
      sourceAppId = licenseRecord.renewalApplicationId;
      application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: sourceAppId },
      });
      isRenewal = true;
    }

    // application is optional — forwarding works without it; only APPROVED/REJECTED needs it
    const newStatusId = status ? status.id : cancelRequest.workFlowStatusId;

    // 3. Build cancel request update data - mirrors Fresh/Renewal currentUserId/previousUserId tracking
    const cancelUpdateData: any = {
      previousUserId: cancelRequest.currentUserId || cancelRequest.requestedBy,
      currentUserId: nextUserId,
      workFlowStatusId: newStatusId,
    };

    // Determine action outcome
    const isApprovedAction = isTerminalAction(actionCode) && isApprovalAction(actionCode);
    const isRejectedAction = isTerminalAction(actionCode) && isRejectionAction(actionCode);

    if (payload.remarks) {
      const originalRemarks = cancelRequest.remarks || '';
      cancelUpdateData.remarks = originalRemarks
        ? `${originalRemarks}\n[Action: ${actionCode}] ${payload.remarks}`
        : `[Action: ${actionCode}] ${payload.remarks}`;
    }

    // 5. Execute all updates in a transaction
    const updatedCancelRequest = await prisma.$transaction(async (tx: any) => {
      // Update the cancel request
      const updated = await tx.cancelFormRequests.update({
        where: { id: payload.applicationId },
        data: cancelUpdateData,
      });

      // Determine actionTaken for workflow history
      let actionTaken = actionCode;

      if (isApprovedAction) {
        actionTaken = ACTION_CODES.CANCEL;

        // Find the CANCEL status
        const cancelStatus = await tx.statuses.findFirst({ where: { code: ACTION_CODES.CANCEL } });

        // Update the original application to CANCELLED
        if (application && sourceAppId) {
          if (isRenewal) {
            await tx.renewalFormPersonalDetails.update({
              where: { id: sourceAppId },
              data: {
                workflowStatusId: cancelStatus?.id || newStatusId,
                isPending: false,
              },
            });
          } else {
            await tx.freshLicenseApplicationPersonalDetails.update({
              where: { id: sourceAppId },
              data: {
                workflowStatusId: cancelStatus?.id || newStatusId,
                isPending: false,
              },
            });
          }
        }

        // === LICENSE HOOK: Delegate to handler ===
        try {
          await this.cancelWorkflowHandler.onFinalApproval(payload.applicationId, payload.currentUserId, tx);
        } catch (err) {
          console.error('[LicenseHook] Failed to cancel license:', err);
          throw new InternalServerErrorException('Failed to update license record');
        }
      } else if (isRejectedAction) {
        actionTaken = ACTION_CODES.REJECT;
      }

      // Build remarks for history entries
      const historyRemarks = isApprovedAction
        ? `Cancel request approved. Application cancelled. Reason: ${cancelRequest.cancellationReason}`
        : isRejectedAction
          ? `Cancel request rejected. ${payload.remarks || ''}`
          : `Cancel request forwarded. ${payload.remarks || ''}`;

      // Create workflow history on the original application (only if we found it)
      if (application && sourceAppId) {
        if (isRenewal) {
          await tx.renewalApplicationsFormWorkflowHistories.create({
            data: {
              applicationId: sourceAppId,
              previousUserId: application.currentUserId || payload.currentUserId,
              nextUserId: nextUserId || payload.currentUserId,
              actionTaken: actionTaken,
              remarks: historyRemarks,
              previousRoleId: currentRoleId,
              nextRoleId: nextUserRoleId?.roleId || null,
              actionesId: payload.actionId,
            },
          });
        } else {
          await tx.freshLicenseApplicationsFormWorkflowHistories.create({
            data: {
              applicationId: sourceAppId,
              previousUserId: application.currentUserId || payload.currentUserId,
              nextUserId: nextUserId || payload.currentUserId,
              actionTaken: actionTaken,
              remarks: historyRemarks,
              previousRoleId: currentRoleId,
              nextRoleId: nextUserRoleId?.roleId || null,
              actionesId: payload.actionId,
            },
          });
        }
      }

      // Create CancelWorkflowHistories entry for the cancel request itself
      await tx.cancelWorkflowHistories.create({
        data: {
          applicationId: payload.applicationId,
          previousUserId: cancelRequest.currentUserId || payload.currentUserId,
          nextUserId: nextUserId || payload.currentUserId,
          actionTaken: actionTaken,
          remarks: historyRemarks,
          previousRoleId: currentRoleId,
          nextRoleId: nextUserRoleId?.roleId || null,
          actionesId: payload.actionId,
          attachments: payload.attachments && payload.attachments.length > 0 ? payload.attachments : undefined,
        },
      });

      if (payload.attachments && payload.attachments.length > 0) {
        updated.attachments = payload.attachments;
      }

      return updated;
    });

    return updatedCancelRequest;
  }

}

