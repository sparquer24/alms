/*
  Warnings:

  - Made the column `contactInfoId` on table `FreshLicenseApplicationsForms` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" DROP CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey";

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD COLUMN     "isApprovied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFLAFGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGroundReportGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReEnquiry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReEnquiryDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRejected" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "contactInfoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD CONSTRAINT "FreshLicenseApplicationsForms_contactInfoId_fkey" FOREIGN KEY ("contactInfoId") REFERENCES "public"."FreshLicenseApplicationsFormContactInfos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
