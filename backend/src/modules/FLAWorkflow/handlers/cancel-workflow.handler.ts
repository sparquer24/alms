import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowLifecycleHandler } from './workflow-lifecycle.interface';
import { Prisma } from '@prisma/client';
import { LicensesService } from '../../licenses/licenses.service';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class CancelWorkflowHandler implements IWorkflowLifecycleHandler {
  private readonly logger = new Logger(CancelWorkflowHandler.name);

  constructor(
    private readonly licensesService: LicensesService,
    private readonly prisma: PrismaService,
  ) {}

  async onFinalApproval(applicationId: number, currentUserId: number, tx: Prisma.TransactionClient): Promise<void> {
    this.logger.debug(`Executing onFinalApproval for Cancel Request: ${applicationId}`);

    // Fetch the cancel request details to get the licenseId and reason
    const cancelRequest = await tx.cancelFormRequests.findUnique({
      where: { id: applicationId },
    });

    if (!cancelRequest || !cancelRequest.licenseId) {
      throw new Error(`Cancel request ${applicationId} not found or missing licenseId`);
    }

    // Delegate the actual license mutation logic to LicensesService
    await this.licensesService.cancelLicense(
      cancelRequest.licenseId,
      cancelRequest.cancellationReason,
      applicationId,
      currentUserId,
      tx,
    );
  }

  async onFinalRejection(applicationId: number, currentUserId: number, tx: Prisma.TransactionClient): Promise<void> {
    // Optionally handle any specific logic when a cancellation is rejected
    this.logger.debug(`Executing onFinalRejection for Cancel Request: ${applicationId}`);
  }
}
