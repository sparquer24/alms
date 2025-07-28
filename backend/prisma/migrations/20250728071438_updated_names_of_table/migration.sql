/*
  Warnings:

  - You are about to drop the `ActionHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArmsLicenseApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BiometricData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContactInfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CriminalHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `District` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Division` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FileUpload` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FlowMap` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FlowNextUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LicenseHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OccupationInfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PoliceStation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `State` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Zone` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActionHistory" DROP CONSTRAINT "ActionHistory_flowMapId_fkey";

-- DropForeignKey
ALTER TABLE "ActionHistory" DROP CONSTRAINT "ActionHistory_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "ActionHistory" DROP CONSTRAINT "ActionHistory_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_districtId_fkey";

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_stateId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_biometricDataId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_contactInfoId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_districtId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_occupationInfoId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_permanentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_presentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_stateId_fkey";

-- DropForeignKey
ALTER TABLE "ArmsLicenseApplication" DROP CONSTRAINT "ArmsLicenseApplication_statusId_fkey";

-- DropForeignKey
ALTER TABLE "CriminalHistory" DROP CONSTRAINT "CriminalHistory_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "District" DROP CONSTRAINT "District_stateId_fkey";

-- DropForeignKey
ALTER TABLE "Division" DROP CONSTRAINT "Division_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "FlowMap" DROP CONSTRAINT "FlowMap_currentUserId_fkey";

-- DropForeignKey
ALTER TABLE "FlowNextUser" DROP CONSTRAINT "FlowNextUser_flowMapId_fkey";

-- DropForeignKey
ALTER TABLE "FlowNextUser" DROP CONSTRAINT "FlowNextUser_nextUserId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseHistory" DROP CONSTRAINT "LicenseHistory_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "OccupationInfo" DROP CONSTRAINT "OccupationInfo_districtId_fkey";

-- DropForeignKey
ALTER TABLE "OccupationInfo" DROP CONSTRAINT "OccupationInfo_stateId_fkey";

-- DropForeignKey
ALTER TABLE "PoliceStation" DROP CONSTRAINT "PoliceStation_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_districtId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_policeStationId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_stateId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_districtId_fkey";

-- DropTable
DROP TABLE "ActionHistory";

-- DropTable
DROP TABLE "Address";

-- DropTable
DROP TABLE "ArmsLicenseApplication";

-- DropTable
DROP TABLE "BiometricData";

-- DropTable
DROP TABLE "ContactInfo";

-- DropTable
DROP TABLE "CriminalHistory";

-- DropTable
DROP TABLE "District";

-- DropTable
DROP TABLE "Division";

-- DropTable
DROP TABLE "FileUpload";

-- DropTable
DROP TABLE "FlowMap";

-- DropTable
DROP TABLE "FlowNextUser";

-- DropTable
DROP TABLE "LicenseHistory";

-- DropTable
DROP TABLE "OccupationInfo";

-- DropTable
DROP TABLE "Permission";

-- DropTable
DROP TABLE "PoliceStation";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "RolePermission";

-- DropTable
DROP TABLE "State";

-- DropTable
DROP TABLE "Status";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Zone";

-- CreateTable
CREATE TABLE "Statuses" (
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
CREATE TABLE "States" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "States_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Districts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "Districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "Zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Divisions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "Divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceStations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "divisionId" INTEGER NOT NULL,

    CONSTRAINT "PoliceStations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "can_forward" BOOLEAN NOT NULL DEFAULT false,
    "can_re_enquiry" BOOLEAN NOT NULL DEFAULT false,
    "can_generate_ground_report" BOOLEAN NOT NULL DEFAULT false,
    "can_FLAF" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsFormCriminalHistories" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "convicted" BOOLEAN NOT NULL,
    "firNumber" TEXT,
    "underSection" TEXT,
    "policeStation" TEXT,
    "unit" TEXT,
    "district" TEXT,
    "state" TEXT,
    "offence" TEXT,
    "sentence" TEXT,
    "dateOfSentence" TIMESTAMP(3),

    CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsFormLicenseHistories" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "previouslyApplied" BOOLEAN NOT NULL,
    "dateApplied" TIMESTAMP(3),
    "licenseName" TEXT,
    "authority" TEXT,
    "result" "LicenseResult",
    "status" TEXT,
    "rejectionDocumentUrl" TEXT,
    "licenseSuspended" BOOLEAN,
    "licenseDetails" TEXT,

    CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsFormFileUploads" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreshLicenseApplicationsFormFileUploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "FlowMaps" (
    "id" TEXT NOT NULL,
    "currentUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowMaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowNextUsers" (
    "id" TEXT NOT NULL,
    "flowMapId" TEXT NOT NULL,
    "nextUserId" TEXT NOT NULL,

    CONSTRAINT "FlowNextUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionHistories" (
    "id" TEXT NOT NULL,
    "flowMapId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsFormAddresses" (
    "id" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "sinceResiding" TIMESTAMP(3) NOT NULL,
    "jurisdictionStationId" INTEGER NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsFormAddresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsFormContactInfos" (
    "id" TEXT NOT NULL,
    "telephoneOffice" TEXT,
    "telephoneResidence" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "officeMobileNumber" TEXT,
    "alternativeMobile" TEXT,

    CONSTRAINT "FreshLicenseApplicationsFormContactInfos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsFormOccupationInfos" (
    "id" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "cropProtectionRequired" BOOLEAN NOT NULL DEFAULT false,
    "cropLocation" TEXT,
    "areaUnderCultivation" DOUBLE PRECISION,

    CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsFormBiometricDatas" (
    "id" TEXT NOT NULL,
    "signatureImageUrl" TEXT,
    "irisScanImageUrl" TEXT,
    "photoImageUrl" TEXT,

    CONSTRAINT "FreshLicenseApplicationsFormBiometricDatas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreshLicenseApplicationsForms" (
    "id" TEXT NOT NULL,
    "acknowledgementNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "filledBy" TEXT,
    "parentOrSpouseName" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "panNumber" TEXT,
    "aadharNumber" TEXT NOT NULL,
    "dobInWords" TEXT,
    "presentAddressId" TEXT NOT NULL,
    "permanentAddressId" TEXT,
    "contactInfoId" TEXT NOT NULL,
    "occupationInfoId" TEXT,
    "biometricDataId" TEXT,
    "needForLicense" TEXT NOT NULL,
    "descriptionOfArms" TEXT NOT NULL,
    "armsCategory" "ArmsCategory" NOT NULL,
    "areasOfUse" "AreaOfUse" NOT NULL,
    "specialConsideration" TEXT,
    "statusId" INTEGER,
    "currentRoleId" INTEGER,
    "previousRoleId" INTEGER,
    "currentUserId" TEXT,
    "previousUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsForms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Statuses_code_key" ON "Statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "States_name_key" ON "States"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Districts_name_key" ON "Districts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Zones_name_key" ON "Zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Divisions_name_key" ON "Divisions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceStations_name_key" ON "PoliceStations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_code_key" ON "Roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_phoneNo_key" ON "Users"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_acknowledgementNo_key" ON "FreshLicenseApplicationsForms"("acknowledgementNo");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_aadharNumber_key" ON "FreshLicenseApplicationsForms"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_contactInfoId_key" ON "FreshLicenseApplicationsForms"("contactInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_biometricDataId_key" ON "FreshLicenseApplicationsForms"("biometricDataId");

-- AddForeignKey
ALTER TABLE "Districts" ADD CONSTRAINT "Districts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zones" ADD CONSTRAINT "Zones_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divisions" ADD CONSTRAINT "Divisions_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStations" ADD CONSTRAINT "PoliceStations_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormCriminalHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_applicationI_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormLicenseHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormFileUploads" ADD CONSTRAINT "FreshLicenseApplicationsFormFileUploads_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowMaps" ADD CONSTRAINT "FlowMaps_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowNextUsers" ADD CONSTRAINT "FlowNextUsers_flowMapId_fkey" FOREIGN KEY ("flowMapId") REFERENCES "FlowMaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowNextUsers" ADD CONSTRAINT "FlowNextUsers_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistories" ADD CONSTRAINT "ActionHistories_flowMapId_fkey" FOREIGN KEY ("flowMapId") REFERENCES "FlowMaps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistories" ADD CONSTRAINT "ActionHistories_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistories" ADD CONSTRAINT "ActionHistories_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_jurisdictionStationI_fkey" FOREIGN KEY ("jurisdictionStationId") REFERENCES "PoliceStations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormOccupationInfos" ADD CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsFormOccupationInfos" ADD CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_previousRoleId_fkey" FOREIGN KEY ("previousRoleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES "FreshLicenseApplicationsFormAddresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES "FreshLicenseApplicationsFormAddresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey" FOREIGN KEY ("contactInfoId") REFERENCES "FreshLicenseApplicationsFormContactInfos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_occupationInfoId_fkey" FOREIGN KEY ("occupationInfoId") REFERENCES "FreshLicenseApplicationsFormOccupationInfos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_biometricDataId_fkey" FOREIGN KEY ("biometricDataId") REFERENCES "FreshLicenseApplicationsFormBiometricDatas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
