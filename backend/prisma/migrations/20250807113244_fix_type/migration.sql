/*
  Warnings:

  - The `previousRoleId` column on the `FreshLicenseApplicationsFormWorkflowHistories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nextRoleId` column on the `FreshLicenseApplicationsFormWorkflowHistories` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" DROP COLUMN "previousRoleId",
ADD COLUMN     "previousRoleId" INTEGER,
DROP COLUMN "nextRoleId",
ADD COLUMN     "nextRoleId" INTEGER;
