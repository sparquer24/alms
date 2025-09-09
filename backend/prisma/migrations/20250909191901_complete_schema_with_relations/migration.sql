-- CreateEnum
CREATE TYPE "public"."Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ArmsCategory" AS ENUM ('RESTRICTED', 'PERMISSIBLE');

-- CreateEnum
CREATE TYPE "public"."AreaOfUse" AS ENUM ('DISTRICT', 'STATE', 'INDIA');

-- CreateEnum
CREATE TYPE "public"."previousStatusOfLicence" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."FileType" AS ENUM ('AADHAR_CARD', 'PAN_CARD', 'TRAINING_CERTIFICATE', 'OTHER_STATE_LICENSE', 'EXISTING_LICENSE', 'SAFE_CUSTODY', 'MEDICAL_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LicensePurpose" AS ENUM ('SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY');

-- CreateEnum
CREATE TYPE "public"."WeaponCategory" AS ENUM ('RESTRICTED', 'PERMISSIBLE');

-- CreateTable
CREATE TABLE "public"."Statuses" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Actiones" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."States" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "States_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Districts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "Districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Zones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "Zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Divisions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "Divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PoliceStations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "divisionId" INTEGER NOT NULL,

    CONSTRAINT "PoliceStations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Roles" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dashboard_title" TEXT,
    "menu_items" JSONB,
    "permissions" JSONB,
    "can_access_settings" BOOLEAN NOT NULL DEFAULT false,
    "can_forward" BOOLEAN NOT NULL DEFAULT false,
    "can_re_enquiry" BOOLEAN NOT NULL DEFAULT false,
    "can_generate_ground_report" BOOLEAN NOT NULL DEFAULT false,
    "can_FLAF" BOOLEAN NOT NULL DEFAULT false,
    "can_create_freshLicence" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormCriminalHistories" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "convicted" BOOLEAN NOT NULL,
    "bondDate" TIMESTAMP(3),
    "bondExecutionOrdered" BOOLEAN,
    "convictionData" JSONB,
    "periodOfBond" TEXT,
    "prohibitedDate" TIMESTAMP(3),
    "prohibitedUnderArmsAct" BOOLEAN,

    CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormLicenseHistories" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyMemberHasArmsLicense" BOOLEAN NOT NULL,
    "familyMemberLicenses" JSONB,
    "hasAppliedBefore" BOOLEAN NOT NULL,
    "hasOtherApplications" BOOLEAN NOT NULL,
    "hasSafePlaceForArms" BOOLEAN NOT NULL,
    "hasUndergoneTraining" BOOLEAN NOT NULL,
    "otherApplications" JSONB,
    "previousApplications" JSONB,
    "safeStorageDetails" TEXT,
    "trainingDetails" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeaponTypeMaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "WeaponTypeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormLicenseRequestDetails" (
    "id" SERIAL NOT NULL,
    "needForLicense" "public"."LicensePurpose",
    "weaponCategory" "public"."WeaponCategory",
    "areaOfValidity" TEXT,
    "applicationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormFileUploads" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fileType" "public"."FileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsFormFileUploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNo" TEXT,
    "roleId" INTEGER NOT NULL,
    "policeStationId" INTEGER,
    "stateId" INTEGER,
    "districtId" INTEGER,
    "zoneId" INTEGER,
    "divisionId" INTEGER,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FlowMaps" (
    "id" SERIAL NOT NULL,
    "currentUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowMaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FlowNextUsers" (
    "id" SERIAL NOT NULL,
    "flowMapId" INTEGER NOT NULL,
    "nextUserId" INTEGER NOT NULL,

    CONSTRAINT "FlowNextUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActionHistories" (
    "id" SERIAL NOT NULL,
    "flowMapId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormAddresses" (
    "id" SERIAL NOT NULL,
    "addressLine" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "policeStationId" INTEGER NOT NULL,
    "sinceResiding" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsFormAddresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormContactInfos" (
    "id" SERIAL NOT NULL,
    "telephoneOffice" TEXT,
    "telephoneResidence" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "officeMobileNumber" TEXT,
    "alternativeMobile" TEXT,
    "applicationId" INTEGER,

    CONSTRAINT "FreshLicenseApplicationsFormContactInfos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormOccupationInfos" (
    "id" SERIAL NOT NULL,
    "occupation" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "cropLocation" TEXT,
    "areaUnderCultivation" DOUBLE PRECISION,

    CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormBiometricDatas" (
    "id" SERIAL NOT NULL,
    "signatureImageUrl" TEXT,
    "irisScanImageUrl" TEXT,
    "photoImageUrl" TEXT,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsFormBiometricDatas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsForms" (
    "id" SERIAL NOT NULL,
    "acknowledgementNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "filledBy" TEXT,
    "parentOrSpouseName" TEXT NOT NULL,
    "sex" "public"."Sex" NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "panNumber" TEXT,
    "aadharNumber" TEXT NOT NULL,
    "dobInWords" TEXT,
    "presentAddressId" INTEGER NOT NULL,
    "permanentAddressId" INTEGER,
    "contactInfoId" INTEGER NOT NULL,
    "occupationInfoId" INTEGER,
    "biometricDataId" INTEGER,
    "statusId" INTEGER,
    "currentRoleId" INTEGER,
    "previousRoleId" INTEGER,
    "currentUserId" INTEGER,
    "previousUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isApprovied" BOOLEAN NOT NULL DEFAULT false,
    "isFLAFGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isGroundReportGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isPending" BOOLEAN NOT NULL DEFAULT false,
    "isReEnquiry" BOOLEAN NOT NULL DEFAULT false,
    "isReEnquiryDone" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,

    CONSTRAINT "FreshLicenseApplicationsForms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" (
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

    CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_RequestedWeapons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RequestedWeapons_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Statuses_code_key" ON "public"."Statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Actiones_code_key" ON "public"."Actiones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "States_name_key" ON "public"."States"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Districts_name_key" ON "public"."Districts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Zones_name_key" ON "public"."Zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Divisions_name_key" ON "public"."Divisions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceStations_name_key" ON "public"."PoliceStations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_code_key" ON "public"."Roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WeaponTypeMaster_name_key" ON "public"."WeaponTypeMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_phoneNo_key" ON "public"."Users"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsFormContactInfos_applicationId_key" ON "public"."FreshLicenseApplicationsFormContactInfos"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsFormBiometricDatas_applicationId_key" ON "public"."FreshLicenseApplicationsFormBiometricDatas"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_acknowledgementNo_key" ON "public"."FreshLicenseApplicationsForms"("acknowledgementNo");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_aadharNumber_key" ON "public"."FreshLicenseApplicationsForms"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_contactInfoId_key" ON "public"."FreshLicenseApplicationsForms"("contactInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_biometricDataId_key" ON "public"."FreshLicenseApplicationsForms"("biometricDataId");

-- CreateIndex
CREATE INDEX "_RequestedWeapons_B_index" ON "public"."_RequestedWeapons"("B");

-- AddForeignKey
ALTER TABLE "public"."Districts" ADD CONSTRAINT "Districts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Zones" ADD CONSTRAINT "Zones_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Divisions" ADD CONSTRAINT "Divisions_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PoliceStations" ADD CONSTRAINT "PoliceStations_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormCriminalHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_applicationI_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseRequestDetails" ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_applicat_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormFileUploads" ADD CONSTRAINT "FreshLicenseApplicationsFormFileUploads_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Users" ADD CONSTRAINT "Users_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Users" ADD CONSTRAINT "Users_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Users" ADD CONSTRAINT "Users_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "public"."PoliceStations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Users" ADD CONSTRAINT "Users_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Users" ADD CONSTRAINT "Users_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowMaps" ADD CONSTRAINT "FlowMaps_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowNextUsers" ADD CONSTRAINT "FlowNextUsers_flowMapId_fkey" FOREIGN KEY ("flowMapId") REFERENCES "public"."FlowMaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowNextUsers" ADD CONSTRAINT "FlowNextUsers_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionHistories" ADD CONSTRAINT "ActionHistories_flowMapId_fkey" FOREIGN KEY ("flowMapId") REFERENCES "public"."FlowMaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionHistories" ADD CONSTRAINT "ActionHistories_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionHistories" ADD CONSTRAINT "ActionHistories_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "public"."PoliceStations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormOccupationInfos" ADD CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormOccupationInfos" ADD CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_biometricDataId_fkey" FOREIGN KEY ("biometricDataId") REFERENCES "public"."FreshLicenseApplicationsFormBiometricDatas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey" FOREIGN KEY ("contactInfoId") REFERENCES "public"."FreshLicenseApplicationsFormContactInfos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "public"."Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_occupationInfoId_fkey" FOREIGN KEY ("occupationInfoId") REFERENCES "public"."FreshLicenseApplicationsFormOccupationInfos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES "public"."FreshLicenseApplicationsFormAddresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES "public"."FreshLicenseApplicationsFormAddresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_previousRoleId_fkey" FOREIGN KEY ("previousRoleId") REFERENCES "public"."Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."Statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_actionesId_fkey" FOREIGN KEY ("actionesId") REFERENCES "public"."Actiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_applicationI_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousUser_fkey" FOREIGN KEY ("previousUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousRole_fkey" FOREIGN KEY ("previousRoleId") REFERENCES "public"."Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextRoleId_fkey" FOREIGN KEY ("nextRoleId") REFERENCES "public"."Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."FreshLicenseApplicationsFormLicenseRequestDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."WeaponTypeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
