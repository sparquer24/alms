// ─── services/revert.service.ts ─────────────────────────────────────────────
// Core revert execution logic. Runs inside a DB transaction.

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApplicationType, Prisma } from '@prisma/client';
import prisma from '../../../db/prismaClient';
import { SnapshotService } from './snapshot.service';
import { RevertAuditService } from './revert-audit.service';
import { RevertValidationResult, RevertExecutionResult } from '../interfaces/revert-result.interface';
import { VersionDiffResult, FieldDiff } from '../interfaces/version-diff.interface';
import { ApplicationSnapshotData } from '../interfaces/snapshot.interface';

/** Status codes that are considered terminal (final decisions) */
const TERMINAL_STATUS_CODES = ['APPROVED', 'REJECT', 'CLOSE', 'DISPOSE', 'CANCEL'];

@Injectable()
export class RevertService {
  constructor(
    private readonly snapshotService: SnapshotService,
    private readonly revertAuditService: RevertAuditService,
  ) {}

  // ─── Validation ────────────────────────────────────────────────────────────

  /**
   * Pre-validate a revert request. Returns blockers if the revert cannot proceed.
   * Called BEFORE showing the confirmation modal on the frontend.
   */
  async validateRevert(params: {
    applicationId: number;
    applicationType: ApplicationType;
    targetVersionNumber: number;
    requestingUserId: number;
    requestingRoleId: number;
  }): Promise<RevertValidationResult> {
    const { applicationId, applicationType, targetVersionNumber,
            requestingUserId, requestingRoleId } = params;
    const blockers: string[] = [];

    // 1. Fetch role permissions
    const role = await prisma.roles.findUnique({ where: { id: requestingRoleId } });
    if (!role || !role.can_revert) {
      return { canRevert: false, blockers: ['Your role does not have revert permission.'],
               isTerminalRevert: false, requiresEscalation: false };
    }

    // 2. Fetch application
    let application: any = null;
    if (applicationType === ApplicationType.FRESH) {
      application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: applicationId },
        include: { workflowStatus: true },
      });
    } else {
      application = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
        include: { workflowStatus: true },
      });
    }

    if (!application) {
      return { canRevert: false, blockers: ['Application not found.'],
               isTerminalRevert: false, requiresEscalation: false };
    }

    // 3. Check handler permission — must be current handler, or have can_revert_others
    const isCurrentHandler = application.currentUserId === requestingUserId;
    if (!isCurrentHandler && !role.can_revert_others) {
      blockers.push('You can only revert applications currently assigned to you.');
    }

    // 4. Check if current status is terminal
    const currentStatusCode = application.workflowStatus?.code ?? '';
    const isCurrentlyTerminal = TERMINAL_STATUS_CODES.includes(currentStatusCode);
    let isTerminalRevert = false;
    let requiresEscalation = false;

    if (isCurrentlyTerminal) {
      isTerminalRevert = true;
      requiresEscalation = true;
      if (!role.can_revert_terminal) {
        blockers.push(
          `Cannot revert a terminal status (${currentStatusCode}). Only Admin/Super Admin can perform this action.`,
        );
      }
    }

    // 5. Fetch version history
    const versions = await prisma.applicationVersionSnapshot.findMany({
      where: { applicationId, applicationType },
      orderBy: { versionNumber: 'desc' },
    });

    if (versions.length < 1) {
      blockers.push('No version history available for this application.');
    }

    // 6. Check target version exists
    const targetVersion = versions.find((v: { versionNumber: number; triggerAction: string; createdAt: Date; workflowStatusId: number; currentUserId: number }) => v.versionNumber === targetVersionNumber);
    if (!targetVersion) {
      blockers.push(`Version ${targetVersionNumber} does not exist for this application.`);
    }

    // 7. Check target version is not the current version
    const currentMax = versions[0]?.versionNumber ?? 0;
    if (targetVersionNumber >= currentMax) {
      blockers.push('Cannot revert to the current version. Select an earlier version.');
    }

    // 8. Check that target version's handler is still active
    if (targetVersion) {
      const targetHandler = await prisma.users.findUnique({
        where: { id: targetVersion.currentUserId },
      });
      if (!targetHandler) {
        blockers.push(
          `Cannot revert: the handler at version ${targetVersionNumber} no longer exists.`,
        );
      }
    }

    return {
      canRevert: blockers.length === 0,
      blockers,
      isTerminalRevert,
      requiresEscalation,
      targetVersion: targetVersion
        ? {
            versionNumber: targetVersion.versionNumber,
            triggerAction: targetVersion.triggerAction,
            createdAt: targetVersion.createdAt,
            workflowStatusId: targetVersion.workflowStatusId,
            currentUserId: targetVersion.currentUserId,
          }
        : undefined,
    };
  }

  // ─── Execution ─────────────────────────────────────────────────────────────

  /**
   * Execute the revert operation.
   * - Creates a new snapshot of the CURRENT state (pre-revert)
   * - Restores the application to the target version's snapshot data
   * - Writes RevertAuditLog entry + WorkflowHistory entry
   * - All done inside a prisma.$transaction
   */
  async executeRevert(params: {
    applicationId: number;
    applicationType: ApplicationType;
    targetVersionNumber: number;
    reason: string;
    escalationDocumentUrl?: string;
    requestingUserId: number;
    requestingRoleId: number;
    expectedCurrentVersion?: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RevertExecutionResult> {
    const {
      applicationId, applicationType, targetVersionNumber, reason,
      escalationDocumentUrl, requestingUserId, requestingRoleId,
      expectedCurrentVersion, ipAddress, userAgent,
    } = params;

    // ── Pre-flight validation ──
    const validation = await this.validateRevert({
      applicationId, applicationType, targetVersionNumber,
      requestingUserId, requestingRoleId,
    });

    if (!validation.canRevert) {
      throw new ForbiddenException(validation.blockers.join(' | '));
    }

    if (validation.requiresEscalation && !escalationDocumentUrl) {
      throw new UnprocessableEntityException(
        'Terminal status reverts require an escalation document URL.',
      );
    }

    // ── Fetch the target snapshot data ──
    const targetSnapshot = await prisma.applicationVersionSnapshot.findUnique({
      where: {
        applicationId_applicationType_versionNumber: {
          applicationId, applicationType, versionNumber: targetVersionNumber,
        },
      },
    });

    if (!targetSnapshot) {
      throw new NotFoundException(`Target version ${targetVersionNumber} not found.`);
    }

    // ── Fetch current application state ──
    let currentApp: any;
    if (applicationType === ApplicationType.FRESH) {
      currentApp = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: applicationId },
      });
    } else {
      currentApp = await prisma.renewalFormPersonalDetails.findUnique({
        where: { id: applicationId },
      });
    }

    if (!currentApp) throw new NotFoundException('Application not found.');

    // ── Optimistic lock check ──
    if (
      expectedCurrentVersion !== undefined &&
      currentApp.currentVersionNumber !== expectedCurrentVersion
    ) {
      throw new ConflictException(
        'Application was modified by another user. Please refresh and try again.',
      );
    }

    const fromVersionNumber = currentApp.currentVersionNumber;
    const snapshotData = targetSnapshot.snapshotData as unknown as ApplicationSnapshotData;
    const pd = snapshotData.personalDetails;

    // ── Execute everything in a single DB transaction ──
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Capture the CURRENT state as a new snapshot (pre-revert state preserved)
      const preRevertVersion = (
        await tx.applicationVersionSnapshot.aggregate({
          _max: { versionNumber: true },
          where: { applicationId, applicationType },
        })
      )._max.versionNumber ?? 0;
      const preRevertVersionNumber = preRevertVersion + 1;

      const currentSnapshotData =
        applicationType === ApplicationType.FRESH
          ? await this.snapshotService.buildFreshSnapshot(applicationId)
          : await this.snapshotService.buildRenewalSnapshot(applicationId);

      await tx.applicationVersionSnapshot.create({
        data: {
          applicationId,
          applicationType,
          versionNumber: preRevertVersionNumber,
          snapshotData: currentSnapshotData as any,
          triggerAction: 'REVERT',
          actionByUserId: requestingUserId,
          actionByRoleId: requestingRoleId,
          workflowStatusId: currentApp.workflowStatusId ?? 0,
          currentUserId: currentApp.currentUserId ?? requestingUserId,
          previousUserId: currentApp.previousUserId ?? undefined,
        },
      });

      // 2. Restore application fields from the target snapshot
      const restoreData: any = {
        workflowStatusId: targetSnapshot.workflowStatusId,
        currentUserId: targetSnapshot.currentUserId,
        previousUserId: targetSnapshot.previousUserId ?? null,
        // Restore workflow flags from snapshot
        isSubmit: pd.isSubmit ?? false,
        isApproved: pd.isApproved ?? false,
        isGroundReportGenerated: pd.isGroundReportGenerated ?? false,
        isPending: pd.isPending ?? false,
        isReEnquiry: pd.isReEnquiry ?? false,
        isReEnquiryDone: pd.isReEnquiryDone ?? false,
        isRejected: pd.isRejected ?? false,
        isRecommended: pd.isRecommended ?? false,
        isNotRecommended: pd.isNotRecommended ?? false,
        // Version tracking
        currentVersionNumber: preRevertVersionNumber,
        lastRevertedAt: new Date(),
        lastRevertedByUserId: requestingUserId,
        isReverted: true,
      };

      // Restore fresh-only fields
      if (applicationType === ApplicationType.FRESH) {
        restoreData.isFLAFGenerated = pd.isFLAFGenerated ?? false;
        await tx.freshLicenseApplicationPersonalDetails.update({
          where: { id: applicationId },
          data: restoreData,
        });
      } else {
        await tx.renewalFormPersonalDetails.update({
          where: { id: applicationId },
          data: restoreData,
        });
      }

      // 3. Write RevertAuditLog
      await tx.revertAuditLog.create({
        data: {
          applicationId,
          applicationType,
          fromVersionNumber,
          toVersionNumber: targetVersionNumber,
          newVersionNumber: preRevertVersionNumber,
          revertedByUserId: requestingUserId,
          revertedByRoleId: requestingRoleId,
          reason,
          fromStatusId: currentApp.workflowStatusId ?? 0,
          toStatusId: targetSnapshot.workflowStatusId,
          isTerminalRevert: validation.isTerminalRevert,
          escalationDocumentUrl,
          ipAddress,
          userAgent,
        },
      });

      // 4. Write WorkflowHistory entry for the revert action
      const historyData: any = {
        applicationId,
        previousUserId: requestingUserId,
        nextUserId: targetSnapshot.currentUserId,
        actionTaken: 'REVERT',
        remarks: `Reverted from V${fromVersionNumber} to V${targetVersionNumber}. Reason: ${reason}`,
        previousRoleId: requestingRoleId,
        nextRoleId: null,
      };

      if (applicationType === ApplicationType.FRESH) {
        await tx.freshLicenseApplicationsFormWorkflowHistories.create({ data: historyData });
      } else {
        await tx.renewalApplicationsFormWorkflowHistories.create({ data: historyData });
      }

      return {
        success: true,
        newVersionNumber: preRevertVersionNumber,
        fromVersionNumber,
        toVersionNumber: targetVersionNumber,
        message: `Application successfully reverted from V${fromVersionNumber} to V${targetVersionNumber}. New version V${preRevertVersionNumber} created.`,
        applicationId,
        applicationType,
      };
    });
  }

  // ─── Diff/Compare ──────────────────────────────────────────────────────────

  /**
   * Compare two version snapshots field-by-field.
   * Returns only the fields that differ between the two versions.
   */
  async compareVersions(
    applicationId: number,
    applicationType: ApplicationType,
    fromVersion: number,
    toVersion: number,
  ): Promise<VersionDiffResult> {
    const [snapA, snapB] = await Promise.all([
      this.snapshotService.getVersion(applicationId, applicationType, fromVersion),
      this.snapshotService.getVersion(applicationId, applicationType, toVersion),
    ]);

    const dataA = snapA.snapshotData as unknown as ApplicationSnapshotData;
    const dataB = snapB.snapshotData as unknown as ApplicationSnapshotData;
    const changedFields: FieldDiff[] = [];

    // Compare personal detail fields
    const pdFields: { key: keyof typeof dataA.personalDetails; label: string }[] = [
      { key: 'firstName', label: 'First Name' },
      { key: 'middleName', label: 'Middle Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'parentOrSpouseName', label: 'Father/Spouse Name' },
      { key: 'sex', label: 'Gender' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'panNumber', label: 'PAN Number' },
      { key: 'aadharNumber', label: 'Aadhar Number' },
      { key: 'isApproved', label: 'Approved' },
      { key: 'isRejected', label: 'Rejected' },
      { key: 'isRecommended', label: 'Recommended' },
      { key: 'isNotRecommended', label: 'Not Recommended' },
      { key: 'isPending', label: 'Pending' },
      { key: 'isReEnquiry', label: 'Re-enquiry' },
      { key: 'workflowStatusId', label: 'Workflow Status' },
      { key: 'currentUserId', label: 'Current Handler' },
      { key: 'previousUserId', label: 'Previous Handler' },
    ];

    for (const { key, label } of pdFields) {
      const vA = dataA.personalDetails?.[key];
      const vB = dataB.personalDetails?.[key];
      if (String(vA ?? '') !== String(vB ?? '')) {
        changedFields.push({ field: `personalDetails.${key}`, label, fromValue: vA, toValue: vB, section: 'Personal Details' });
      }
    }

    // Compare address fields (present address)
    const addrFields: { key: string; label: string }[] = [
      { key: 'addressLine', label: 'Address Line' },
      { key: 'stateId', label: 'State' },
      { key: 'districtId', label: 'District' },
      { key: 'zoneId', label: 'Zone' },
      { key: 'divisionId', label: 'Division' },
      { key: 'policeStationId', label: 'Police Station' },
    ];

    for (const { key, label } of addrFields) {
      const vA = (dataA.presentAddress as any)?.[key];
      const vB = (dataB.presentAddress as any)?.[key];
      if (String(vA ?? '') !== String(vB ?? '')) {
        changedFields.push({ field: `presentAddress.${key}`, label, fromValue: vA, toValue: vB, section: 'Present Address' });
      }
    }

    // Compare occupation
    const occFields: { key: string; label: string }[] = [
      { key: 'occupation', label: 'Occupation' },
      { key: 'officeAddress', label: 'Office Address' },
    ];

    for (const { key, label } of occFields) {
      const vA = (dataA.occupation as any)?.[key];
      const vB = (dataB.occupation as any)?.[key];
      if (String(vA ?? '') !== String(vB ?? '')) {
        changedFields.push({ field: `occupation.${key}`, label, fromValue: vA, toValue: vB, section: 'Occupation' });
      }
    }

    return {
      applicationId,
      applicationType,
      fromVersionNumber: fromVersion,
      toVersionNumber: toVersion,
      changedFields,
      totalChanges: changedFields.length,
    };
  }
}
