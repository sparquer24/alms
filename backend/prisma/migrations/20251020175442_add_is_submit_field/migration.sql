-- CreateEnum
CREATE TYPE "public"."Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ArmsCategory" AS ENUM ('RESTRICTED', 'PERMISSIBLE');

-- CreateEnum
CREATE TYPE "public"."AreaOfUse" AS ENUM ('DISTRICT', 'STATE', 'INDIA');

-- CreateEnum
CREATE TYPE "public"."previousStatusOfLicence" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."FileType" AS ENUM ('AADHAR_CARD', 'PAN_CARD', 'TRAINING_CERTIFICATE', 'OTHER_STATE_LICENSE', 'EXISTING_LICENSE', 'SAFE_CUSTODY', 'MEDICAL_REPORT', 'REJECTED_LICENSE', 'CLAIM_DOCS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LicensePurpose" AS ENUM ('SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY');

-- CreateEnum
CREATE TYPE "public"."LicenseResult" AS ENUM ('APPROVED', 'REJECTED', 'PENDING');

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
    "dashboard_title" TEXT NOT NULL,
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
CREATE TABLE "public"."RolesActionsMapping" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolesActionsMapping_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."FreshLicenseApplicationPersonalDetails" (
    "id" SERIAL NOT NULL,
    "acknowledgementNo" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "parentOrSpouseName" TEXT NOT NULL,
    "sex" "public"."Sex" NOT NULL,
    "placeOfBirth" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dobInWords" TEXT,
    "panNumber" TEXT,
    "aadharNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledBy" TEXT,
    "occupationAndBusinessId" INTEGER,
    "permanentAddressId" INTEGER,
    "presentAddressId" INTEGER,
    "currentUserId" INTEGER,
    "previousUserId" INTEGER,
    "workflowStatusId" INTEGER,
    "isAwareOfLegalConsequences" BOOLEAN DEFAULT false,
    "isDeclarationAccepted" BOOLEAN DEFAULT false,
    "isTermsAccepted" BOOLEAN DEFAULT false,
    "isSubmit" BOOLEAN DEFAULT false,

    CONSTRAINT "FreshLicenseApplicationPersonalDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FLAFAddressesAndContactDetails" (
    "id" SERIAL NOT NULL,
    "addressLine" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "policeStationId" INTEGER NOT NULL,
    "sinceResiding" TIMESTAMP(3) NOT NULL,
    "divisionId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "telephoneOffice" TEXT,
    "telephoneResidence" TEXT,
    "officeMobileNumber" TEXT,
    "alternativeMobile" TEXT,

    CONSTRAINT "FLAFAddressesAndContactDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FLAFOccupationAndBusiness" (
    "id" SERIAL NOT NULL,
    "occupation" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "cropLocation" TEXT,
    "areaUnderCultivation" DOUBLE PRECISION,

    CONSTRAINT "FLAFOccupationAndBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FLAFCriminalHistories" (
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

    CONSTRAINT "FLAFCriminalHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FLAFLicenseHistories" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "hasAppliedBefore" BOOLEAN NOT NULL DEFAULT false,
    "dateAppliedFor" TIMESTAMP(3),
    "previousAuthorityName" TEXT,
    "previousResult" "public"."LicenseResult",
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

    CONSTRAINT "FLAFLicenseHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FLAFLicenseDetails" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "needForLicense" "public"."LicensePurpose",
    "armsCategory" "public"."ArmsCategory",
    "areaOfValidity" TEXT,
    "ammunitionDescription" TEXT,
    "specialConsiderationReason" TEXT,
    "licencePlaceArea" TEXT,
    "wildBeastsSpecification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FLAFLicenseDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FLAFFileUploads" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fileType" "public"."FileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,

    CONSTRAINT "FLAFFileUploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FLAFBiometricDatas" (
    "id" SERIAL NOT NULL,
    "signatureImageUrl" TEXT,
    "irisScanImageUrl" TEXT,
    "photoImageUrl" TEXT,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "FLAFBiometricDatas_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "RolesActionsMapping_roleId_actionId_key" ON "public"."RolesActionsMapping"("roleId", "actionId");

-- CreateIndex
CREATE UNIQUE INDEX "WeaponTypeMaster_name_key" ON "public"."WeaponTypeMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_phoneNo_key" ON "public"."Users"("phoneNo");

-- CreateIndex
CREATE INDEX "FreshLicenseApplicationPersonalDetails_aadharNumber_idx" ON "public"."FreshLicenseApplicationPersonalDetails"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FLAFBiometricDatas_applicationId_key" ON "public"."FLAFBiometricDatas"("applicationId");

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
ALTER TABLE "public"."RolesActionsMapping" ADD CONSTRAINT "RolesActionsMapping_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."Actiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolesActionsMapping" ADD CONSTRAINT "RolesActionsMapping_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_occupationAndBusine_fkey" FOREIGN KEY ("occupationAndBusinessId") REFERENCES "public"."FLAFOccupationAndBusiness"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES "public"."FLAFAddressesAndContactDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES "public"."FLAFAddressesAndContactDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationPersonalDetails" ADD CONSTRAINT "FreshLicenseApplicationPersonalDetails_workflowStatusId_fkey" FOREIGN KEY ("workflowStatusId") REFERENCES "public"."Statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "public"."PoliceStations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFOccupationAndBusiness" ADD CONSTRAINT "FLAFOccupationAndBusiness_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFOccupationAndBusiness" ADD CONSTRAINT "FLAFOccupationAndBusiness_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFCriminalHistories" ADD CONSTRAINT "FLAFCriminalHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationPersonalDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFLicenseHistories" ADD CONSTRAINT "FLAFLicenseHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationPersonalDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFLicenseDetails" ADD CONSTRAINT "FLAFLicenseDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationPersonalDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFFileUploads" ADD CONSTRAINT "FLAFFileUploads_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationPersonalDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FLAFBiometricDatas" ADD CONSTRAINT "FLAFBiometricDatas_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationPersonalDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_actionesId_fkey" FOREIGN KEY ("actionesId") REFERENCES "public"."Actiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextRoleId_fkey" FOREIGN KEY ("nextRoleId") REFERENCES "public"."Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousRole_fkey" FOREIGN KEY ("previousRoleId") REFERENCES "public"."Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_previousUser_fkey" FOREIGN KEY ("previousUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."FLAFLicenseDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."WeaponTypeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
