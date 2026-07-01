/*
  Warnings:

  - You are about to drop the column `districtId` on the `Zones` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Zones" DROP CONSTRAINT "Zones_districtId_fkey";

-- AlterTable
ALTER TABLE "FLAFAddressesAndContactDetails" ADD COLUMN     "rangeOfficeId" INTEGER;

-- AlterTable
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD COLUMN     "aliasPotalNumber" TEXT;

-- AlterTable
ALTER TABLE "RenewalAddressesAndContactDetails" ADD COLUMN     "rangeOfficeId" INTEGER;

-- AlterTable
ALTER TABLE "RenewalFormPersonalDetails" ADD COLUMN     "freshLicenseId" INTEGER;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "rangeOfficeId" INTEGER;

-- AlterTable
ALTER TABLE "Zones" DROP COLUMN "districtId",
ADD COLUMN     "rangeOfficeId" INTEGER;

-- CreateTable
CREATE TABLE "RenewalCriminalHistories" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "isConvicted" BOOLEAN NOT NULL DEFAULT false,
    "isBondExecuted" BOOLEAN NOT NULL DEFAULT false,
    "bondDate" TIMESTAMP(3),
    "bondPeriod" TEXT,
    "isProhibited" BOOLEAN NOT NULL DEFAULT false,
    "prohibitionDate" TIMESTAMP(3),
    "prohibitionPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firDetails" JSONB,

    CONSTRAINT "RenewalCriminalHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalLicenseHistories" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "hasAppliedBefore" BOOLEAN NOT NULL DEFAULT false,
    "dateAppliedFor" TIMESTAMP(3),
    "previousAuthorityName" TEXT,
    "previousResult" "LicenseResult",
    "hasLicenceSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionAuthorityName" TEXT,
    "suspensionReason" TEXT,
    "hasFamilyLicence" BOOLEAN NOT NULL DEFAULT false,
    "familyMemberName" TEXT,
    "familyLicenceNumber" TEXT,
    "familyWeaponsEndorsed" TEXT[],
    "hasSafePlace" BOOLEAN NOT NULL DEFAULT false,
    "safePlaceDetails" TEXT,
    "hasTraining" BOOLEAN NOT NULL DEFAULT false,
    "trainingDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenewalLicenseHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelFormRequests" (
    "id" SERIAL NOT NULL,
    "applicationType" TEXT NOT NULL,
    "cancellationReason" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" INTEGER NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedBy" INTEGER,
    "actionedDate" TIMESTAMP(3),
    "workFlowStatusId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "freshLicenseId" INTEGER,
    "currentUserId" INTEGER,
    "previousUserId" INTEGER,

    CONSTRAINT "CancelFormRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelWorkflowHistories" (
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

    CONSTRAINT "CancelWorkflowHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RangeOffices" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RangeOffices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_cancel_workflow_actionesId" ON "CancelWorkflowHistories"("actionesId");

-- CreateIndex
CREATE INDEX "idx_cancel_workflow_applicationId" ON "CancelWorkflowHistories"("applicationId");

-- CreateIndex
CREATE INDEX "idx_cancel_workflow_nextRoleId" ON "CancelWorkflowHistories"("nextRoleId");

-- CreateIndex
CREATE INDEX "idx_cancel_workflow_nextUserId" ON "CancelWorkflowHistories"("nextUserId");

-- CreateIndex
CREATE INDEX "idx_cancel_workflow_previousRoleId" ON "CancelWorkflowHistories"("previousRoleId");

-- CreateIndex
CREATE INDEX "idx_cancel_workflow_previousUserId" ON "CancelWorkflowHistories"("previousUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RangeOffices_name_key" ON "RangeOffices"("name");

-- AddForeignKey
ALTER TABLE "Zones" ADD CONSTRAINT "Zones_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_freshLicenseId_fkey" FOREIGN KEY ("freshLicenseId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalAddressesAndContactDetails" ADD CONSTRAINT "RenewalAddressesAndContactDetails_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalCriminalHistories" ADD CONSTRAINT "RenewalCriminalHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RenewalFormPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalLicenseHistories" ADD CONSTRAINT "RenewalLicenseHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RenewalFormPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_actionedBy_fkey" FOREIGN KEY ("actionedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_freshLicenseId_fkey" FOREIGN KEY ("freshLicenseId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_workFlowStatusId_fkey" FOREIGN KEY ("workFlowStatusId") REFERENCES "Statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "fk_cancel_workflow_actiones" FOREIGN KEY ("actionesId") REFERENCES "Actiones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "fk_cancel_workflow_application" FOREIGN KEY ("applicationId") REFERENCES "CancelFormRequests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "fk_cancel_workflow_next_role" FOREIGN KEY ("nextRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "fk_cancel_workflow_next_user" FOREIGN KEY ("nextUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "fk_cancel_workflow_previous_role" FOREIGN KEY ("previousRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CancelWorkflowHistories" ADD CONSTRAINT "fk_cancel_workflow_previous_user" FOREIGN KEY ("previousUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RangeOffices" ADD CONSTRAINT "RangeOffices_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
