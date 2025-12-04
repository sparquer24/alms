/*
  Warnings:

  - You are about to drop the column `irisScanImageUrl` on the `FLAFBiometricDatas` table. All the data in the column will be lost.
  - You are about to drop the column `photoImageUrl` on the `FLAFBiometricDatas` table. All the data in the column will be lost.
  - You are about to drop the column `signatureImageUrl` on the `FLAFBiometricDatas` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Districts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Divisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `biometricData` to the `FLAFBiometricDatas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PoliceStations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `States` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Zones` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ActionHistories" DROP CONSTRAINT "ActionHistories_flowMapId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ActionHistories" DROP CONSTRAINT "ActionHistories_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ActionHistories" DROP CONSTRAINT "ActionHistories_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Districts" DROP CONSTRAINT "Districts_stateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Divisions" DROP CONSTRAINT "Divisions_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" DROP CONSTRAINT "FLAFAddressesAndContactDetails_districtId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" DROP CONSTRAINT "FLAFAddressesAndContactDetails_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" DROP CONSTRAINT "FLAFAddressesAndContactDetails_policeStationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" DROP CONSTRAINT "FLAFAddressesAndContactDetails_stateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" DROP CONSTRAINT "FLAFAddressesAndContactDetails_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFBiometricDatas" DROP CONSTRAINT "FLAFBiometricDatas_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFCriminalHistories" DROP CONSTRAINT "FLAFCriminalHistories_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFFileUploads" DROP CONSTRAINT "FLAFFileUploads_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFLicenseDetails" DROP CONSTRAINT "FLAFLicenseDetails_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFLicenseHistories" DROP CONSTRAINT "FLAFLicenseHistories_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFOccupationAndBusiness" DROP CONSTRAINT "FLAFOccupationAndBusiness_districtId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FLAFOccupationAndBusiness" DROP CONSTRAINT "FLAFOccupationAndBusiness_stateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FlowMaps" DROP CONSTRAINT "FlowMaps_currentUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FlowNextUsers" DROP CONSTRAINT "FlowNextUsers_flowMapId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FlowNextUsers" DROP CONSTRAINT "FlowNextUsers_nextUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" DROP CONSTRAINT "FreshLicenseApplicationPersonalDetails_currentUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" DROP CONSTRAINT "FreshLicenseApplicationPersonalDetails_occupationAndBusine_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" DROP CONSTRAINT "FreshLicenseApplicationPersonalDetails_permanentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" DROP CONSTRAINT "FreshLicenseApplicationPersonalDetails_presentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" DROP CONSTRAINT "FreshLicenseApplicationPersonalDetails_previousUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" DROP CONSTRAINT "FreshLicenseApplicationPersonalDetails_workflowStatusId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_actionesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextRoleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousRole_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousUser_fkey";

-- DropForeignKey
ALTER TABLE "public"."PoliceStations" DROP CONSTRAINT "PoliceStations_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RolesActionsMapping" DROP CONSTRAINT "RolesActionsMapping_actionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RolesActionsMapping" DROP CONSTRAINT "RolesActionsMapping_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_districtId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_policeStationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_stateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Zones" DROP CONSTRAINT "Zones_districtId_fkey";

-- AlterTable
ALTER TABLE "Districts" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Divisions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FLAFBiometricDatas" DROP COLUMN "irisScanImageUrl",
DROP COLUMN "photoImageUrl",
DROP COLUMN "signatureImageUrl",
ADD COLUMN     "biometricData" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD COLUMN     "almsLicenseId" TEXT,
ADD COLUMN     "isApproved" BOOLEAN DEFAULT false,
ADD COLUMN     "isFLAFGenerated" BOOLEAN DEFAULT false,
ADD COLUMN     "isGroundReportGenerated" BOOLEAN DEFAULT false,
ADD COLUMN     "isPending" BOOLEAN DEFAULT false,
ADD COLUMN     "isReEnquiry" BOOLEAN DEFAULT false,
ADD COLUMN     "isReEnquiryDone" BOOLEAN DEFAULT false,
ADD COLUMN     "isRejected" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "PoliceStations" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "States" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Statuses" ADD COLUMN     "isStarted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Zones" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "RoleFlowMapping" (
    "id" SERIAL NOT NULL,
    "currentRoleId" INTEGER NOT NULL,
    "nextRoleIds" INTEGER[],
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleFlowMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleFlowMapping_currentRoleId_key" ON "RoleFlowMapping"("currentRoleId");

-- AddForeignKey
ALTER TABLE "Districts" ADD CONSTRAINT "Districts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zones" ADD CONSTRAINT "Zones_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divisions" ADD CONSTRAINT "Divisions_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStations" ADD CONSTRAINT "PoliceStations_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolesActionsMapping" ADD CONSTRAINT "RolesActionsMapping_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Actiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolesActionsMapping" ADD CONSTRAINT "RolesActionsMapping_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleFlowMapping" ADD CONSTRAINT "RoleFlowMapping_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleFlowMapping" ADD CONSTRAINT "RoleFlowMapping_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowMaps" ADD CONSTRAINT "FlowMaps_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowNextUsers" ADD CONSTRAINT "FlowNextUsers_flowMapId_fkey" FOREIGN KEY ("flowMapId") REFERENCES "FlowMaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowNextUsers" ADD CONSTRAINT "FlowNextUsers_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistories" ADD CONSTRAINT "ActionHistories_flowMapId_fkey" FOREIGN KEY ("flowMapId") REFERENCES "FlowMaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistories" ADD CONSTRAINT "ActionHistories_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistories" ADD CONSTRAINT "ActionHistories_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_occupationAndBusine_fkey" FOREIGN KEY ("occupationAndBusinessId") REFERENCES "FLAFOccupationAndBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES "FLAFAddressesAndContactDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES "FLAFAddressesAndContactDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_workflowStatusId_fkey" FOREIGN KEY ("workflowStatusId") REFERENCES "Statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFOccupationAndBusiness" ADD CONSTRAINT "FLAFOccupationAndBusiness_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFOccupationAndBusiness" ADD CONSTRAINT "FLAFOccupationAndBusiness_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFCriminalHistories" ADD CONSTRAINT "FLAFCriminalHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFLicenseHistories" ADD CONSTRAINT "FLAFLicenseHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFLicenseDetails" ADD CONSTRAINT "FLAFLicenseDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFFileUploads" ADD CONSTRAINT "FLAFFileUploads_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FLAFBiometricDatas" ADD CONSTRAINT "FLAFBiometricDatas_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_actionesId_fkey" FOREIGN KEY ("actionesId") REFERENCES "Actiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextRoleId_fkey" FOREIGN KEY ("nextRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousRole_fkey" FOREIGN KEY ("previousRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousUser_fkey" FOREIGN KEY ("previousUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
