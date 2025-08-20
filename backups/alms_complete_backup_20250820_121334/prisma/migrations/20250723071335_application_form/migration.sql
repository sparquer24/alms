/*
  Warnings:

  - You are about to drop the column `officeName` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ArmsCategory" AS ENUM ('RESTRICTED', 'PERMISSIBLE');

-- CreateEnum
CREATE TYPE "AreaOfUse" AS ENUM ('DISTRICT', 'STATE', 'INDIA');

-- CreateEnum
CREATE TYPE "LicenseResult" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('AADHAR_CARD', 'PAN_CARD', 'TRAINING_CERTIFICATE', 'OTHER_STATE_LICENSE', 'EXISTING_LICENSE', 'SAFE_CUSTODY', 'MEDICAL_REPORT', 'OTHER');

-- DropIndex
DROP INDEX "User_officeName_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "officeName",
ADD COLUMN     "districtId" INTEGER,
ADD COLUMN     "divisionId" INTEGER,
ADD COLUMN     "policeStationId" INTEGER,
ADD COLUMN     "stateId" INTEGER,
ADD COLUMN     "zoneId" INTEGER;

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceStation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "divisionId" INTEGER NOT NULL,

    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriminalHistory" (
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

    CONSTRAINT "CriminalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseHistory" (
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

    CONSTRAINT "LicenseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricData" (
    "id" TEXT NOT NULL,
    "signatureImageUrl" TEXT,
    "irisScanImageUrl" TEXT,
    "photoImageUrl" TEXT,

    CONSTRAINT "BiometricData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "sinceResiding" TIMESTAMP(3) NOT NULL,
    "jurisdictionStation" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL,
    "telephoneOffice" TEXT,
    "telephoneResidence" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "officeMobileNumber" TEXT,
    "alternativeMobile" TEXT,

    CONSTRAINT "ContactInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupationInfo" (
    "id" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "cropProtectionRequired" BOOLEAN NOT NULL DEFAULT false,
    "cropLocation" TEXT,
    "areaUnderCultivation" DOUBLE PRECISION,

    CONSTRAINT "OccupationInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArmsLicenseApplication" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "ArmsLicenseApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_key" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Division_name_key" ON "Division"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceStation_name_key" ON "PoliceStation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ArmsLicenseApplication_acknowledgementNo_key" ON "ArmsLicenseApplication"("acknowledgementNo");

-- CreateIndex
CREATE UNIQUE INDEX "ArmsLicenseApplication_aadharNumber_key" ON "ArmsLicenseApplication"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ArmsLicenseApplication_contactInfoId_key" ON "ArmsLicenseApplication"("contactInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "ArmsLicenseApplication_biometricDataId_key" ON "ArmsLicenseApplication"("biometricDataId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriminalHistory" ADD CONSTRAINT "CriminalHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ArmsLicenseApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseHistory" ADD CONSTRAINT "LicenseHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ArmsLicenseApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ArmsLicenseApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccupationInfo" ADD CONSTRAINT "OccupationInfo_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccupationInfo" ADD CONSTRAINT "OccupationInfo_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmsLicenseApplication" ADD CONSTRAINT "ArmsLicenseApplication_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmsLicenseApplication" ADD CONSTRAINT "ArmsLicenseApplication_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmsLicenseApplication" ADD CONSTRAINT "ArmsLicenseApplication_contactInfoId_fkey" FOREIGN KEY ("contactInfoId") REFERENCES "ContactInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmsLicenseApplication" ADD CONSTRAINT "ArmsLicenseApplication_occupationInfoId_fkey" FOREIGN KEY ("occupationInfoId") REFERENCES "OccupationInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmsLicenseApplication" ADD CONSTRAINT "ArmsLicenseApplication_biometricDataId_fkey" FOREIGN KEY ("biometricDataId") REFERENCES "BiometricData"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmsLicenseApplication" ADD CONSTRAINT "ArmsLicenseApplication_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmsLicenseApplication" ADD CONSTRAINT "ArmsLicenseApplication_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
