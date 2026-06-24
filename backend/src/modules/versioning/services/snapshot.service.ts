// ─── services/snapshot.service.ts ───────────────────────────────────────────
// Creates and retrieves full application state snapshots.
// Called by WorkflowService BEFORE modifying the application on any workflow action.

import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationType } from '@prisma/client';
import prisma from '../../../db/prismaClient';
import { ApplicationSnapshotData } from '../interfaces/snapshot.interface';

@Injectable()
export class SnapshotService {
  /**
   * Build a full JSON snapshot of a FRESH application's current state.
   * Includes personal details, addresses, occupation, criminal/license histories,
   * license details (with weapon IDs), and file upload metadata.
   */
  async buildFreshSnapshot(applicationId: number): Promise<ApplicationSnapshotData> {
    const app = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
      where: { id: applicationId },
      include: {
        presentAddress: true,
        permanentAddress: true,
        occupationAndBusiness: true,
        criminalHistories: true,
        licenseHistories: true,
        licenseDetails: { include: { requestedWeapons: { select: { id: true } } } },
        fileUploads: true,
      },
    });

    if (!app) {
      throw new NotFoundException(`Fresh application ${applicationId} not found`);
    }

    return {
      personalDetails: {
        id: app.id,
        acknowledgementNo: app.acknowledgementNo ?? undefined,
        firstName: app.firstName,
        middleName: app.middleName ?? undefined,
        lastName: app.lastName,
        parentOrSpouseName: app.parentOrSpouseName,
        sex: app.sex,
        placeOfBirth: app.placeOfBirth ?? undefined,
        dateOfBirth: app.dateOfBirth?.toISOString(),
        dobInWords: app.dobInWords ?? undefined,
        panNumber: app.panNumber ?? undefined,
        aadharNumber: app.aadharNumber ?? undefined,
        filledBy: app.filledBy ?? undefined,
        almsLicenseId: app.almsLicenseId ?? undefined,
        isSubmit: app.isSubmit ?? false,
        isApproved: app.isApproved ?? false,
        isFLAFGenerated: app.isFLAFGenerated ?? false,
        isGroundReportGenerated: app.isGroundReportGenerated ?? false,
        isPending: app.isPending ?? false,
        isReEnquiry: app.isReEnquiry ?? false,
        isReEnquiryDone: app.isReEnquiryDone ?? false,
        isRejected: app.isRejected ?? false,
        isRecommended: app.isRecommended ?? false,
        isNotRecommended: app.isNotRecommended ?? false,
        isAwareOfLegalConsequences: app.isAwareOfLegalConsequences ?? false,
        isDeclarationAccepted: app.isDeclarationAccepted ?? false,
        isTermsAccepted: app.isTermsAccepted ?? false,
        workflowStatusId: app.workflowStatusId ?? undefined,
        currentUserId: app.currentUserId ?? undefined,
        previousUserId: app.previousUserId ?? undefined,
        occupationAndBusinessId: app.occupationAndBusinessId ?? undefined,
        permanentAddressId: app.permanentAddressId ?? undefined,
        presentAddressId: app.presentAddressId ?? undefined,
      },
      presentAddress: app.presentAddress
        ? {
            id: app.presentAddress.id,
            addressLine: app.presentAddress.addressLine,
            stateId: app.presentAddress.stateId,
            districtId: app.presentAddress.districtId,
            zoneId: app.presentAddress.zoneId,
            divisionId: app.presentAddress.divisionId,
            policeStationId: app.presentAddress.policeStationId,
            sinceResiding: app.presentAddress.sinceResiding.toISOString(),
            telephoneOffice: app.presentAddress.telephoneOffice ?? undefined,
            telephoneResidence: app.presentAddress.telephoneResidence ?? undefined,
            officeMobileNumber: app.presentAddress.officeMobileNumber ?? undefined,
            alternativeMobile: app.presentAddress.alternativeMobile ?? undefined,
          }
        : undefined,
      permanentAddress: app.permanentAddress
        ? {
            id: app.permanentAddress.id,
            addressLine: app.permanentAddress.addressLine,
            stateId: app.permanentAddress.stateId,
            districtId: app.permanentAddress.districtId,
            zoneId: app.permanentAddress.zoneId,
            divisionId: app.permanentAddress.divisionId,
            policeStationId: app.permanentAddress.policeStationId,
            sinceResiding: app.permanentAddress.sinceResiding.toISOString(),
            telephoneOffice: app.permanentAddress.telephoneOffice ?? undefined,
            telephoneResidence: app.permanentAddress.telephoneResidence ?? undefined,
            officeMobileNumber: app.permanentAddress.officeMobileNumber ?? undefined,
            alternativeMobile: app.permanentAddress.alternativeMobile ?? undefined,
          }
        : undefined,
      occupation: app.occupationAndBusiness
        ? {
            id: app.occupationAndBusiness.id,
            occupation: app.occupationAndBusiness.occupation,
            officeAddress: app.occupationAndBusiness.officeAddress,
            stateId: app.occupationAndBusiness.stateId,
            districtId: app.occupationAndBusiness.districtId,
            cropLocation: app.occupationAndBusiness.cropLocation ?? undefined,
            areaUnderCultivation: app.occupationAndBusiness.areaUnderCultivation ?? undefined,
          }
        : undefined,
      criminalHistories: app.criminalHistories.map((ch: any) => ({
        id: ch.id,
        isConvicted: ch.isConvicted,
        isBondExecuted: ch.isBondExecuted,
        bondDate: ch.bondDate?.toISOString(),
        bondPeriod: ch.bondPeriod ?? undefined,
        isProhibited: ch.isProhibited,
        prohibitionDate: ch.prohibitionDate?.toISOString(),
        prohibitionPeriod: ch.prohibitionPeriod ?? undefined,
        firDetails: ch.firDetails,
      })),
      licenseHistories: app.licenseHistories.map((lh: any) => ({
        id: lh.id,
        hasAppliedBefore: lh.hasAppliedBefore,
        dateAppliedFor: lh.dateAppliedFor?.toISOString(),
        previousAuthorityName: lh.previousAuthorityName ?? undefined,
        previousResult: lh.previousResult ?? undefined,
        hasLicenceSuspended: lh.hasLicenceSuspended,
        suspensionAuthorityName: lh.suspensionAuthorityName ?? undefined,
        suspensionReason: lh.suspensionReason ?? undefined,
        hasFamilyLicence: lh.hasFamilyLicence,
        familyMemberName: lh.familyMemberName ?? undefined,
        familyLicenceNumber: lh.familyLicenceNumber ?? undefined,
        familyWeaponsEndorsed: lh.familyWeaponsEndorsed,
        hasSafePlace: lh.hasSafePlace,
        safePlaceDetails: lh.safePlaceDetails ?? undefined,
        hasTraining: lh.hasTraining,
        trainingDetails: lh.trainingDetails ?? undefined,
      })),
      licenseDetails: app.licenseDetails.map((ld: any) => ({
        id: ld.id,
        needForLicense: ld.needForLicense ?? undefined,
        armsCategory: ld.armsCategory ?? undefined,
        areaOfValidity: ld.areaOfValidity ?? undefined,
        ammunitionDescription: ld.ammunitionDescription ?? undefined,
        specialConsiderationReason: ld.specialConsiderationReason ?? undefined,
        licencePlaceArea: ld.licencePlaceArea ?? undefined,
        wildBeastsSpecification: ld.wildBeastsSpecification ?? undefined,
        requestedWeaponIds: ld.requestedWeapons.map((w: any) => w.id),
      })),
      fileUploads: app.fileUploads.map((fu: any) => ({
        id: fu.id,
        fileType: fu.fileType,
        fileUrl: fu.fileUrl,
        fileName: fu.fileName,
        fileSize: fu.fileSize,
        uploadedAt: fu.uploadedAt.toISOString(),
      })),
    };
  }

  /**
   * Build a full JSON snapshot of a RENEWAL application's current state.
   */
  async buildRenewalSnapshot(applicationId: number): Promise<ApplicationSnapshotData> {
    const app = await prisma.renewalFormPersonalDetails.findUnique({
      where: { id: applicationId },
      include: {
        presentAddress: true,
        permanentAddress: true,
        occupationAndBusiness: true,
        criminalHistories: true,
        licenseHistories: true,
        licenseDetails: { include: { requestedWeapons: { select: { id: true } } } },
        fileUploads: true,
      },
    });

    if (!app) {
      throw new NotFoundException(`Renewal application ${applicationId} not found`);
    }

    return {
      personalDetails: {
        id: app.id,
        acknowledgementNo: app.acknowledgementNo ?? undefined,
        licenseNumber: app.licenseNumber,
        renewalLicenseId: app.renewalLicenseId ?? undefined,
        firstName: app.firstName,
        middleName: app.middleName ?? undefined,
        lastName: app.lastName,
        parentOrSpouseName: app.parentOrSpouseName,
        sex: app.sex,
        dateOfBirth: app.dateOfBirth?.toISOString(),
        dobInWords: app.dobInWords ?? undefined,
        panNumber: app.panNumber ?? undefined,
        aadharNumber: app.aadharNumber ?? undefined,
        filledBy: app.filledBy ?? undefined,
        isSubmit: app.isSubmit ?? false,
        isApproved: app.isApproved ?? false,
        isGroundReportGenerated: app.isGroundReportGenerated ?? false,
        isPending: app.isPending ?? false,
        isReEnquiry: app.isReEnquiry ?? false,
        isReEnquiryDone: app.isReEnquiryDone ?? false,
        isRejected: app.isRejected ?? false,
        isRecommended: app.isRecommended ?? false,
        isNotRecommended: app.isNotRecommended ?? false,
        isAwareOfLegalConsequences: app.isAwareOfLegalConsequences ?? false,
        isDeclarationAccepted: app.isDeclarationAccepted ?? false,
        isTermsAccepted: app.isTermsAccepted ?? false,
        workflowStatusId: app.workflowStatusId ?? undefined,
        currentUserId: app.currentUserId ?? undefined,
        previousUserId: app.previousUserId ?? undefined,
      },
      presentAddress: app.presentAddress
        ? {
            id: app.presentAddress.id,
            addressLine: app.presentAddress.addressLine,
            stateId: app.presentAddress.stateId,
            districtId: app.presentAddress.districtId,
            zoneId: app.presentAddress.zoneId,
            divisionId: app.presentAddress.divisionId,
            policeStationId: app.presentAddress.policeStationId,
            sinceResiding: app.presentAddress.sinceResiding.toISOString(),
            telephoneOffice: app.presentAddress.telephoneOffice ?? undefined,
            telephoneResidence: app.presentAddress.telephoneResidence ?? undefined,
            officeMobileNumber: app.presentAddress.officeMobileNumber ?? undefined,
            alternativeMobile: app.presentAddress.alternativeMobile ?? undefined,
          }
        : undefined,
      permanentAddress: app.permanentAddress
        ? {
            id: app.permanentAddress.id,
            addressLine: app.permanentAddress.addressLine,
            stateId: app.permanentAddress.stateId,
            districtId: app.permanentAddress.districtId,
            zoneId: app.permanentAddress.zoneId,
            divisionId: app.permanentAddress.divisionId,
            policeStationId: app.permanentAddress.policeStationId,
            sinceResiding: app.permanentAddress.sinceResiding.toISOString(),
            telephoneOffice: app.permanentAddress.telephoneOffice ?? undefined,
            telephoneResidence: app.permanentAddress.telephoneResidence ?? undefined,
            officeMobileNumber: app.permanentAddress.officeMobileNumber ?? undefined,
            alternativeMobile: app.permanentAddress.alternativeMobile ?? undefined,
          }
        : undefined,
      occupation: app.occupationAndBusiness
        ? {
            id: app.occupationAndBusiness.id,
            occupation: app.occupationAndBusiness.occupation,
            officeAddress: app.occupationAndBusiness.officeAddress,
            stateId: app.occupationAndBusiness.stateId,
            districtId: app.occupationAndBusiness.districtId,
            cropLocation: app.occupationAndBusiness.cropLocation ?? undefined,
            areaUnderCultivation: app.occupationAndBusiness.areaUnderCultivation ?? undefined,
          }
        : undefined,
      criminalHistories: app.criminalHistories.map((ch: any) => ({
        id: ch.id,
        isConvicted: ch.isConvicted,
        isBondExecuted: ch.isBondExecuted,
        bondDate: ch.bondDate?.toISOString(),
        bondPeriod: ch.bondPeriod ?? undefined,
        isProhibited: ch.isProhibited,
        prohibitionDate: ch.prohibitionDate?.toISOString(),
        prohibitionPeriod: ch.prohibitionPeriod ?? undefined,
        firDetails: ch.firDetails,
      })),
      licenseHistories: app.licenseHistories.map((lh: any) => ({
        id: lh.id,
        hasAppliedBefore: lh.hasAppliedBefore,
        dateAppliedFor: lh.dateAppliedFor?.toISOString(),
        previousAuthorityName: lh.previousAuthorityName ?? undefined,
        previousResult: lh.previousResult ?? undefined,
        hasLicenceSuspended: lh.hasLicenceSuspended,
        suspensionAuthorityName: lh.suspensionAuthorityName ?? undefined,
        suspensionReason: lh.suspensionReason ?? undefined,
        hasFamilyLicence: lh.hasFamilyLicence,
        familyMemberName: lh.familyMemberName ?? undefined,
        familyLicenceNumber: lh.familyLicenceNumber ?? undefined,
        familyWeaponsEndorsed: lh.familyWeaponsEndorsed,
        hasSafePlace: lh.hasSafePlace,
        safePlaceDetails: lh.safePlaceDetails ?? undefined,
        hasTraining: lh.hasTraining,
        trainingDetails: lh.trainingDetails ?? undefined,
      })),
      licenseDetails: app.licenseDetails.map((ld: any) => ({
        id: ld.id,
        needForLicense: ld.needForLicense ?? undefined,
        armsCategory: ld.armsCategory ?? undefined,
        areaOfValidity: ld.areaOfValidity ?? undefined,
        ammunitionDescription: ld.ammunitionDescription ?? undefined,
        specialConsiderationReason: ld.specialConsiderationReason ?? undefined,
        licencePlaceArea: ld.licencePlaceArea ?? undefined,
        requestedWeaponIds: ld.requestedWeapons.map((w: any) => w.id),
      })),
      fileUploads: app.fileUploads.map((fu: any) => ({
        id: fu.id,
        fileType: fu.fileType,
        fileUrl: fu.fileUrl,
        fileName: fu.fileName,
        fileSize: fu.fileSize,
        uploadedAt: fu.uploadedAt.toISOString(),
      })),
    };
  }

  /**
   * Creates a version snapshot in the DB for a FRESH or RENEWAL application.
   * Should be called BEFORE the application is modified (within the same transaction or just before).
   *
   * @returns The created snapshot record (with the new versionNumber)
   */
  async createSnapshot(params: {
    applicationId: number;
    applicationType: ApplicationType;
    triggerAction: string;
    triggerActionId?: number;
    actionByUserId: number;
    actionByRoleId: number;
    workflowStatusId: number;
    currentUserId: number;
    previousUserId?: number;
  }) {
    const { applicationId, applicationType, triggerAction, triggerActionId,
            actionByUserId, actionByRoleId, workflowStatusId, currentUserId, previousUserId } = params;

    // Determine next version number for this application
    const maxVersion = await prisma.applicationVersionSnapshot.aggregate({
      _max: { versionNumber: true },
      where: { applicationId, applicationType },
    });
    const nextVersion = (maxVersion._max.versionNumber ?? 0) + 1;

    // Build the snapshot data
    let snapshotData: ApplicationSnapshotData;
    if (applicationType === ApplicationType.FRESH) {
      snapshotData = await this.buildFreshSnapshot(applicationId);
    } else {
      snapshotData = await this.buildRenewalSnapshot(applicationId);
    }

    // Persist snapshot
    const snapshot = await prisma.applicationVersionSnapshot.create({
      data: {
        applicationId,
        applicationType,
        versionNumber: nextVersion,
        snapshotData: snapshotData as any,
        triggerAction,
        triggerActionId,
        actionByUserId,
        actionByRoleId,
        workflowStatusId,
        currentUserId,
        previousUserId,
      },
    });

    return snapshot;
  }

  /**
   * Get version history for an application (latest first)
   */
  async getVersionHistory(applicationId: number, applicationType: ApplicationType) {
    return prisma.applicationVersionSnapshot.findMany({
      where: { applicationId, applicationType },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        triggerAction: true,
        createdAt: true,
        workflowStatusId: true,
        currentUserId: true,
        previousUserId: true,
        actionByUserId: true,
        actionByRoleId: true,
        actionByUser: { select: { id: true, username: true, roleId: true } },
        actionByRole: { select: { id: true, name: true, code: true } },
      },
    });
  }

  /**
   * Get a specific version snapshot (full data including snapshotData JSON)
   */
  async getVersion(applicationId: number, applicationType: ApplicationType, versionNumber: number) {
    const snapshot = await prisma.applicationVersionSnapshot.findUnique({
      where: {
        applicationId_applicationType_versionNumber: {
          applicationId,
          applicationType,
          versionNumber,
        },
      },
      include: {
        actionByUser: { select: { id: true, username: true } },
        actionByRole: { select: { id: true, name: true, code: true } },
      },
    });

    if (!snapshot) {
      throw new NotFoundException(
        `Version ${versionNumber} not found for application ${applicationId}`,
      );
    }
    return snapshot;
  }
}
