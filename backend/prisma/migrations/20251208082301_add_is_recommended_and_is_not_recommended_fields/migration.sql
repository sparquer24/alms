-- AlterTable
ALTER TABLE "FreshLicenseApplicationPersonalDetails" ADD COLUMN     "isNotRecommended" BOOLEAN DEFAULT false,
ADD COLUMN     "isRecommended" BOOLEAN DEFAULT false;
