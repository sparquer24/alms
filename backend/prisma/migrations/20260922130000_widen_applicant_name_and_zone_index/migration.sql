-- AlterTable
ALTER TABLE "CancelFormRequests" ALTER COLUMN "applicantName" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE INDEX "Licenses_presentZoneId_idx" ON "Licenses"("presentZoneId");
