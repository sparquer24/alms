/*
  Warnings:

  - You are about to drop the column `dateOfSentence` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `firNumber` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `offence` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `policeStation` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `sentence` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `underSection` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `FreshLicenseApplicationsFormCriminalHistories` table. All the data in the column will be lost.
  - You are about to drop the column `authority` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `dateApplied` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `licenseDetails` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `licenseName` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `licenseSuspended` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `previouslyApplied` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionDocumentUrl` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `FreshLicenseApplicationsFormLicenseHistories` table. All the data in the column will be lost.
  - You are about to drop the column `cropProtectionRequired` on the `FreshLicenseApplicationsFormOccupationInfos` table. All the data in the column will be lost.
  - You are about to drop the column `areasOfUse` on the `FreshLicenseApplicationsForms` table. All the data in the column will be lost.
  - You are about to drop the column `armsCategory` on the `FreshLicenseApplicationsForms` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionOfArms` on the `FreshLicenseApplicationsForms` table. All the data in the column will be lost.
  - You are about to drop the column `needForLicense` on the `FreshLicenseApplicationsForms` table. All the data in the column will be lost.
  - You are about to drop the column `specialConsideration` on the `FreshLicenseApplicationsForms` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[applicationId]` on the table `FreshLicenseApplicationsFormBiometricDatas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[applicationId]` on the table `FreshLicenseApplicationsFormContactInfos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `applicationId` to the `FreshLicenseApplicationsFormBiometricDatas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `FreshLicenseApplicationsFormFileUploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `FreshLicenseApplicationsFormFileUploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyMemberHasArmsLicense` to the `FreshLicenseApplicationsFormLicenseHistories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hasAppliedBefore` to the `FreshLicenseApplicationsFormLicenseHistories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hasOtherApplications` to the `FreshLicenseApplicationsFormLicenseHistories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hasSafePlaceForArms` to the `FreshLicenseApplicationsFormLicenseHistories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hasUndergoneTraining` to the `FreshLicenseApplicationsFormLicenseHistories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FreshLicenseApplicationsFormLicenseHistories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."previousStatusOfLicence" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."LicensePurpose" AS ENUM ('SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY');

-- CreateEnum
CREATE TYPE "public"."WeaponCategory" AS ENUM ('RESTRICTED', 'PERMISSIBLE');

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey";

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormBiometricDatas" ADD COLUMN     "applicationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormContactInfos" ADD COLUMN     "applicationId" TEXT;

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormCriminalHistories" DROP COLUMN "dateOfSentence",
DROP COLUMN "district",
DROP COLUMN "firNumber",
DROP COLUMN "offence",
DROP COLUMN "policeStation",
DROP COLUMN "sentence",
DROP COLUMN "state",
DROP COLUMN "underSection",
DROP COLUMN "unit",
ADD COLUMN     "bondDate" TIMESTAMP(3),
ADD COLUMN     "bondExecutionOrdered" BOOLEAN,
ADD COLUMN     "convictionData" JSONB,
ADD COLUMN     "periodOfBond" TEXT,
ADD COLUMN     "prohibitedDate" TIMESTAMP(3),
ADD COLUMN     "prohibitedUnderArmsAct" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormFileUploads" ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileSize" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseHistories" DROP COLUMN "authority",
DROP COLUMN "dateApplied",
DROP COLUMN "licenseDetails",
DROP COLUMN "licenseName",
DROP COLUMN "licenseSuspended",
DROP COLUMN "previouslyApplied",
DROP COLUMN "rejectionDocumentUrl",
DROP COLUMN "result",
DROP COLUMN "status",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "familyMemberHasArmsLicense" BOOLEAN NOT NULL,
ADD COLUMN     "familyMemberLicenses" JSONB,
ADD COLUMN     "hasAppliedBefore" BOOLEAN NOT NULL,
ADD COLUMN     "hasOtherApplications" BOOLEAN NOT NULL,
ADD COLUMN     "hasSafePlaceForArms" BOOLEAN NOT NULL,
ADD COLUMN     "hasUndergoneTraining" BOOLEAN NOT NULL,
ADD COLUMN     "otherApplications" JSONB,
ADD COLUMN     "previousApplications" JSONB,
ADD COLUMN     "safeStorageDetails" TEXT,
ADD COLUMN     "trainingDetails" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormOccupationInfos" DROP COLUMN "cropProtectionRequired";

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP COLUMN "areasOfUse",
DROP COLUMN "armsCategory",
DROP COLUMN "descriptionOfArms",
DROP COLUMN "needForLicense",
DROP COLUMN "specialConsideration",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "contactInfoId" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."LicenseResult";

-- CreateTable
CREATE TABLE "public"."WeaponTypeMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "WeaponTypeMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormLicenseRequestDetails" (
    "id" TEXT NOT NULL,
    "needForLicense" "public"."LicensePurpose",
    "weaponCategory" "public"."WeaponCategory",
    "areaOfValidity" TEXT,
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_RequestedWeapons" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RequestedWeapons_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeaponTypeMaster_name_key" ON "public"."WeaponTypeMaster"("name");

-- CreateIndex
CREATE INDEX "_RequestedWeapons_B_index" ON "public"."_RequestedWeapons"("B");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsFormBiometricDatas_applicationId_key" ON "public"."FreshLicenseApplicationsFormBiometricDatas"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsFormContactInfos_applicationId_key" ON "public"."FreshLicenseApplicationsFormContactInfos"("applicationId");

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseRequestDetails" ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_applicat_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey" FOREIGN KEY ("contactInfoId") REFERENCES "public"."FreshLicenseApplicationsFormContactInfos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."FreshLicenseApplicationsFormLicenseRequestDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."WeaponTypeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
