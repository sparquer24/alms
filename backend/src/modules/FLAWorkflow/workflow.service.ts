import { Injectable, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { LicenseStatus } from '@prisma/client';
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

    // Find the existing license by licenseNumber
    const existingLicense = await prisma.licenses.findUnique({
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
        lastModifiedAppType: 'RENEWAL',
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
//     // 1. Fetch the cancel request
//     const cancelRequest = await prisma.cancelFormRequests.findUnique({
//       where: { id: payload.applicationId },
//       include: {
//         workflowStatus: {
//           select: {
//             code: true,
//           },
//         },
//       },
//     });
//     if (!cancelRequest) {
//       throw new NotFoundException('Cancel request not found');
//     }

//     if (isTerminalAction(cancelRequest.workflowStatus?.code || '')) {
//       throw new BadRequestException('Cancel request has already been processed.');
//     }

//     const isRenewal = cancelRequest.applicationType.toLowerCase().includes('renewal');

//     // 2. Fetch the original application using licenseId
//     let application: any;
//     if (!cancelRequest.licenseId) {
//       throw new BadRequestException('Cancel request has no associated license.');
//     }
//     if (isRenewal) {
//       application = await prisma.renewalFormPersonalDetails.findUnique({
//         where: { id: cancelRequest.licenseId },
//       });
//     } else {
//       application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
//         where: { id: cancelRequest.licenseId },
//       });
//     }

//     if (!application) {
//       throw new NotFoundException('Original application not found');
//     }

//     const newStatusId = status ? status.id : cancelRequest.workFlowStatusId;

//     // 3. Build cancel request update data - mirrors Fresh/Renewal currentUserId/previousUserId tracking
//     const cancelUpdateData: any = {
//       actionedBy: payload.currentUserId,
//       actionedDate: new Date(),
//       previousUserId: cancelRequest.actionedBy || cancelRequest.requestedBy,
//       currentUserId: nextUserId,
//     };

//     // 4. Determine action outcome
//     const isApprovedAction = isTerminalAction(actionCode) && isApprovalAction(actionCode);
//     const isRejectedAction = isTerminalAction(actionCode) && isRejectionAction(actionCode);

//     if (isTerminalAction(actionCode)) {
//       if (isApprovalAction(actionCode)) {
//         // APPROVED: mark cancel request as APPROVED, cancel the original application
//         cancelUpdateData.workFlowStatusId = newStatusId;
//       } else if (isRejectionAction(actionCode)) {
//         // REJECTED: mark cancel request as REJECTED, do NOT modify original app
//         cancelUpdateData.workFlowStatusId = newStatusId;
//       }
//     } else {
//       // Non-terminal action (FORWARD, etc.): just update workflow status
//       cancelUpdateData.workFlowStatusId = newStatusId;
//     }

//     if (payload.remarks) {
//       const originalRemarks = cancelRequest.remarks || '';
//       cancelUpdateData.remarks = originalRemarks
//         ? `${originalRemarks}\n[Action: ${actionCode}] ${payload.remarks}`
//         : `[Action: ${actionCode}] ${payload.remarks}`;
//     }

//     // 5. Execute all updates in a transaction
//     await prisma.$transaction(async (tx: any) => {
//       // Update the cancel request
//       await tx.cancelFormRequests.update({
//         where: { id: payload.applicationId },
//         data: cancelUpdateData,
//       });

//       // Determine the type of workflow history entry to create on the original application
//       let actionTaken = actionCode;
//       const previousUserIdForHistory = application.currentUserId || payload.currentUserId;

//       if (isApprovedAction) {
//         // Find the CANCEL status for final approval
//         const cancelStatus = await tx.statuses.findFirst({ where: { code: ACTION_CODES.CANCEL } });

//         // Update the original application to CANCELLED
//         if (isRenewal) {
//           await tx.renewalFormPersonalDetails.update({
//             where: { id: cancelRequest.licenseId },
//             data: {
//               workflowStatusId: cancelStatus?.id || newStatusId,
//               isPending: false,
//             },
//           });
//         } else {
//           await tx.freshLicenseApplicationPersonalDetails.update({
//             where: { id: cancelRequest.licenseId },
//             data: {
//               workflowStatusId: cancelStatus?.id || newStatusId,
//               isPending: false,
//             },
//           });
//         }

//         // === LICENSE HOOK: Cancel license on cancel request approval ===
//         try {
//           if (cancelRequest.licenseId) {
//             const licenseToCancel = await tx.licenses.findFirst({
//               where: {
//                 OR: [
//                   { freshApplicationId: cancelRequest.licenseId },
//                   { licenseNumber: application.licenseNumber },
//                 ],
//               },
//             });

//             if (licenseToCancel) {
//               await tx.licenses.update({
//                 where: { id: licenseToCancel.id },
//                 data: {
//                   status: LicenseStatus.CANCELLED,
//                   cancellationReason: cancelRequest.cancellationReason,
//                   cancellationDate: new Date(),
//                   cancelApplicationId: payload.applicationId,
//                   lastModifiedAppType: 'CANCELLATION',
//                 },
//               });

//               await tx.licenseWorkflowHistory.create({
//                 data: {
//                   licenseId: licenseToCancel.id,
//                   action: 'CANCELLED',
//                   applicationId: payload.applicationId,
//                   applicationType: 'CANCELLATION',
//                   previousStatus: licenseToCancel.status,
//                   newStatus: LicenseStatus.CANCELLED,
//                   changedBy: payload.currentUserId,
//                   remarks: `License cancelled. Reason: ${cancelRequest.cancellationReason}`,
//                 },
//               });
//             }
//           }
//         } catch (err) {
//           console.error('[LicenseHook] Failed to cancel license:', err);
//         }

//         actionTaken = ACTION_CODES.CANCEL;
//       } else if (isRejectedAction) {
//         // REJECTED: application unchanged, history entry records the rejection
//         actionTaken = ACTION_CODES.REJECT;
//       }

//       // Create workflow history on the original application
//       const remarks = isApprovedAction
//         ? `Cancel request approved. Application cancelled. Reason: ${cancelRequest.cancellationReason}`
//         : isRejectedAction
//           ? `Cancel request rejected. ${payload.remarks || ''}`
//           : `Cancel request forwarded. ${payload.remarks || ''}`;

//       if (isRenewal) {
//         await tx.renewalApplicationsFormWorkflowHistories.create({
//           data: {
//             applicationId: cancelRequest.licenseId,
//             previousUserId: previousUserIdForHistory,
//             nextUserId: nextUserId || payload.currentUserId,
//             actionTaken: actionTaken,
//             remarks: remarks,
//             previousRoleId: currentRoleId,
//             nextRoleId: nextUserRoleId?.roleId || null,
//             actionesId: payload.actionId,
//           },
//         });
//       } else {
//         await tx.freshLicenseApplicationsFormWorkflowHistories.create({
//           data: {
//             applicationId: cancelRequest.licenseId,
//             previousUserId: previousUserIdForHistory,
//             nextUserId: nextUserId || payload.currentUserId,
//             actionTaken: actionTaken,
//             remarks: remarks,
//             previousRoleId: currentRoleId,
//             nextRoleId: nextUserRoleId?.roleId || null,
//             actionesId: payload.actionId,
//           },
//         });
//       }

//       // Create CancelWorkflowHistories entry for the cancel request itself
//       // This mirrors the workflow history pattern from Fresh/Renewal applications
//       await tx.cancelWorkflowHistories.create({
//         data: {
//           applicationId: payload.applicationId,
//           previousUserId: cancelRequest.actionedBy || payload.currentUserId,
//           nextUserId: nextUserId || payload.currentUserId,
//           actionTaken: actionTaken,
//           remarks: remarks,
//           previousRoleId: currentRoleId,
//           nextRoleId: nextUserRoleId?.roleId || null,
//           actionesId: payload.actionId,
//         },
//       });
//     });

//     return cancelRequest;
 }

}

