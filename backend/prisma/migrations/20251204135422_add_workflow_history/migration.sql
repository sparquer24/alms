-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileType" ADD VALUE 'SIGNATURE_THUMB';
ALTER TYPE "FileType" ADD VALUE 'PHOTOGRAPH';
ALTER TYPE "FileType" ADD VALUE 'IRIS_SCAN';

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_applicationI_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
