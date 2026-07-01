-- AlterTable: Add workFlowStatusId column to CancelFormRequests
ALTER TABLE "CancelFormRequests" ADD COLUMN "workFlowStatusId" INTEGER;

-- AddForeignKey: Create foreign key relationship between CancelFormRequests and Statuses
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_workFlowStatusId_fkey" FOREIGN KEY ("workFlowStatusId") REFERENCES "Statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
