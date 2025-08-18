/*
  Warnings:

  - The primary key for the `ActionHistories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ActionHistories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FlowMaps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FlowMaps` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FlowNextUsers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FlowNextUsers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormAddresses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormAddresses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormBiometricDatas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormBiometricDatas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormContactInfos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormContactInfos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `applicationId` column on the `FreshLicenseApplicationsFormContactInfos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormCriminalHistories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormCriminalHistories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormFileUploads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormFileUploads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormLicenseHistories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormLicenseHistories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormLicenseRequestDetails` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormLicenseRequestDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormOccupationInfos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormOccupationInfos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsFormWorkflowHistories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsFormWorkflowHistories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FreshLicenseApplicationsForms` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FreshLicenseApplicationsForms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `permanentAddressId` column on the `FreshLicenseApplicationsForms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `occupationInfoId` column on the `FreshLicenseApplicationsForms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `biometricDataId` column on the `FreshLicenseApplicationsForms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currentUserId` column on the `FreshLicenseApplicationsForms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `previousUserId` column on the `FreshLicenseApplicationsForms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `WeaponTypeMaster` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `WeaponTypeMaster` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `_RequestedWeapons` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `flowMapId` on the `ActionHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fromUserId` on the `ActionHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `toUserId` on the `ActionHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `currentUserId` on the `FlowMaps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `flowMapId` on the `FlowNextUsers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `nextUserId` on the `FlowNextUsers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `applicationId` on the `FreshLicenseApplicationsFormBiometricDatas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `applicationId` on the `FreshLicenseApplicationsFormCriminalHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `applicationId` on the `FreshLicenseApplicationsFormFileUploads` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `applicationId` on the `FreshLicenseApplicationsFormLicenseHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `applicationId` on the `FreshLicenseApplicationsFormLicenseRequestDetails` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `applicationId` on the `FreshLicenseApplicationsFormWorkflowHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `previousUserId` on the `FreshLicenseApplicationsFormWorkflowHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `nextUserId` on the `FreshLicenseApplicationsFormWorkflowHistories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `presentAddressId` on the `FreshLicenseApplicationsForms` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `contactInfoId` on the `FreshLicenseApplicationsForms` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `A` on the `_RequestedWeapons` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_RequestedWeapons` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."ActionHistories" DROP CONSTRAINT "ActionHistories_flowMapId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ActionHistories" DROP CONSTRAINT "ActionHistories_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ActionHistories" DROP CONSTRAINT "ActionHistories_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FlowMaps" DROP CONSTRAINT "FlowMaps_currentUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FlowNextUsers" DROP CONSTRAINT "FlowNextUsers_flowMapId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FlowNextUsers" DROP CONSTRAINT "FlowNextUsers_nextUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormCriminalHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_applicationI_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormFileUploads" DROP CONSTRAINT "FreshLicenseApplicationsFormFileUploads_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseRequestDetails" DROP CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_applicat_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_applicationI_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_biometricDataId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_currentUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_occupationInfoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_permanentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_presentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_previousUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_RequestedWeapons" DROP CONSTRAINT "_RequestedWeapons_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_RequestedWeapons" DROP CONSTRAINT "_RequestedWeapons_B_fkey";

-- AlterTable
ALTER TABLE "public"."ActionHistories" DROP CONSTRAINT "ActionHistories_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "flowMapId",
ADD COLUMN     "flowMapId" INTEGER NOT NULL,
DROP COLUMN "fromUserId",
ADD COLUMN     "fromUserId" INTEGER NOT NULL,
DROP COLUMN "toUserId",
ADD COLUMN     "toUserId" INTEGER NOT NULL,
ADD CONSTRAINT "ActionHistories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FlowMaps" DROP CONSTRAINT "FlowMaps_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "currentUserId",
ADD COLUMN     "currentUserId" INTEGER NOT NULL,
ADD CONSTRAINT "FlowMaps_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FlowNextUsers" DROP CONSTRAINT "FlowNextUsers_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "flowMapId",
ADD COLUMN     "flowMapId" INTEGER NOT NULL,
DROP COLUMN "nextUserId",
ADD COLUMN     "nextUserId" INTEGER NOT NULL,
ADD CONSTRAINT "FlowNextUsers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" DROP CONSTRAINT "FreshLicenseApplicationsFormAddresses_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormBiometricDatas" DROP CONSTRAINT "FreshLicenseApplicationsFormBiometricDatas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "applicationId",
ADD COLUMN     "applicationId" INTEGER NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormBiometricDatas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormContactInfos" DROP CONSTRAINT "FreshLicenseApplicationsFormContactInfos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "applicationId",
ADD COLUMN     "applicationId" INTEGER,
ADD CONSTRAINT "FreshLicenseApplicationsFormContactInfos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormCriminalHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "applicationId",
ADD COLUMN     "applicationId" INTEGER NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormFileUploads" DROP CONSTRAINT "FreshLicenseApplicationsFormFileUploads_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "applicationId",
ADD COLUMN     "applicationId" INTEGER NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormFileUploads_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "applicationId",
ADD COLUMN     "applicationId" INTEGER NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseRequestDetails" DROP CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "applicationId",
ADD COLUMN     "applicationId" INTEGER NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormOccupationInfos" DROP CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormOccupationInfos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "applicationId",
ADD COLUMN     "applicationId" INTEGER NOT NULL,
DROP COLUMN "previousUserId",
ADD COLUMN     "previousUserId" INTEGER NOT NULL,
DROP COLUMN "nextUserId",
ADD COLUMN     "nextUserId" INTEGER NOT NULL,
ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "presentAddressId",
ADD COLUMN     "presentAddressId" INTEGER NOT NULL,
DROP COLUMN "permanentAddressId",
ADD COLUMN     "permanentAddressId" INTEGER,
DROP COLUMN "contactInfoId",
ADD COLUMN     "contactInfoId" INTEGER NOT NULL,
DROP COLUMN "occupationInfoId",
ADD COLUMN     "occupationInfoId" INTEGER,
DROP COLUMN "biometricDataId",
ADD COLUMN     "biometricDataId" INTEGER,
DROP COLUMN "currentUserId",
ADD COLUMN     "currentUserId" INTEGER,
DROP COLUMN "previousUserId",
ADD COLUMN     "previousUserId" INTEGER,
ADD CONSTRAINT "FreshLicenseApplicationsForms_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."WeaponTypeMaster" DROP CONSTRAINT "WeaponTypeMaster_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "WeaponTypeMaster_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."_RequestedWeapons" DROP CONSTRAINT "_RequestedWeapons_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
DROP COLUMN "B",
ADD COLUMN     "B" INTEGER NOT NULL,
ADD CONSTRAINT "_RequestedWeapons_AB_pkey" PRIMARY KEY ("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsFormBiometricDatas_applicationId_key" ON "public"."FreshLicenseApplicationsFormBiometricDatas"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsFormContactInfos_applicationId_key" ON "public"."FreshLicenseApplicationsFormContactInfos"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_contactInfoId_key" ON "public"."FreshLicenseApplicationsForms"("contactInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationsForms_biometricDataId_key" ON "public"."FreshLicenseApplicationsForms"("biometricDataId");

-- CreateIndex
CREATE INDEX "_RequestedWeapons_B_index" ON "public"."_RequestedWeapons"("B");

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormCriminalHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormCriminalHistories_applicationI_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormLicenseRequestDetails" ADD CONSTRAINT "FreshLicenseApplicationsFormLicenseRequestDetails_applicat_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormFileUploads" ADD CONSTRAINT "FreshLicenseApplicationsFormFileUploads_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_biometricDataId_fkey" FOREIGN KEY ("biometricDataId") REFERENCES "public"."FreshLicenseApplicationsFormBiometricDatas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey" FOREIGN KEY ("contactInfoId") REFERENCES "public"."FreshLicenseApplicationsFormContactInfos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_occupationInfoId_fkey" FOREIGN KEY ("occupationInfoId") REFERENCES "public"."FreshLicenseApplicationsFormOccupationInfos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES "public"."FreshLicenseApplicationsFormAddresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES "public"."FreshLicenseApplicationsFormAddresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_applicationI_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."FreshLicenseApplicationsFormLicenseRequestDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RequestedWeapons" ADD CONSTRAINT "_RequestedWeapons_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."WeaponTypeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
