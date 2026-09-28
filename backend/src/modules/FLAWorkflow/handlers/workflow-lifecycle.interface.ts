import { Prisma } from '@prisma/client';

export interface IWorkflowLifecycleHandler {
  onFinalApproval(applicationId: number, currentUserId: number, tx: Prisma.TransactionClient): Promise<void>;
  onFinalRejection(applicationId: number, currentUserId: number, tx: Prisma.TransactionClient): Promise<void>;
}
