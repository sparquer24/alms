-- Reconcile schema: bring database in sync with schema.prisma
-- Includes: CancelWorkflowHistories table, relation fixes, and un-tracked changes

-- DropForeignKey
ALTER TABLE "CancelFormRequests" DROP CONSTRAINT IF EXISTS "fk_cancel_form_application";

-- DropForeignKey
ALTER TABLE "RenewalFormPersonalDetails" DROP CONSTRAINT IF EXISTS "fk_renewal_fresh_application";

-- AlterTable
ALTER TABLE "CancelFormRequests" ADD COLUMN IF NOT EXISTS "freshLicenseId" INTEGER;
ALTER TABLE "CancelFormRequests" ALTER COLUMN "applicationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD COLUMN IF NOT EXISTS "aliasPotalNumber" TEXT;

-- AlterTable
ALTER TABLE "RenewalCriminalHistories" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RenewalFormPersonalDetails" DROP COLUMN IF EXISTS "applicationId";
ALTER TABLE "RenewalFormPersonalDetails" ADD COLUMN IF NOT EXISTS "freshLicenseId" INTEGER;

-- AlterTable
ALTER TABLE "RenewalLicenseHistories" ALTER COLUMN "familyWeaponsEndorsed" DROP DEFAULT;
ALTER TABLE "RenewalLicenseHistories" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Roles" DROP COLUMN IF EXISTS "can_revert";

-- CreateTable
CREATE TABLE IF NOT EXISTS "CancelWorkflowHistories" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "previousUserId" INTEGER NOT NULL,
    "nextUserId" INTEGER NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousRoleId" INTEGER,
    "nextRoleId" INTEGER,
    "actionesId" INTEGER,
    "attachments" JSONB,
    "cancelledBy" INTEGER,

    CONSTRAINT "CancelWorkflowHistories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_freshLicenseId_fkey" FOREIGN KEY ("freshLicenseId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_freshLicenseId_fkey" FOREIGN KEY ("freshLicenseId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "CancelWorkflowHistories_actionesId_fkey" FOREIGN KEY ("actionesId") REFERENCES "Actiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "CancelWorkflowHistories_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "CancelWorkflowHistories_nextRoleId_fkey" FOREIGN KEY ("nextRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "CancelWorkflowHistories_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "CancelWorkflowHistories_previousRoleId_fkey" FOREIGN KEY ("previousRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "CancelWorkflowHistories_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "CancelWorkflowHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CancelFormRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
