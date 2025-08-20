/*
  Warnings:

  - You are about to drop the column `jurisdictionStationId` on the `FreshLicenseApplicationsFormAddresses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" DROP CONSTRAINT "FreshLicenseApplicationsFormAddresses_jurisdictionStationI_fkey";

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" DROP COLUMN "jurisdictionStationId";
