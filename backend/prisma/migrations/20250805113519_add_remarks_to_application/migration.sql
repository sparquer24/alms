-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('FORWARD', 'REJECT', 'GROUND_REPORT', 'DISPOSE', 'CLOSE', 'RED_FLAG', 'APPROVE');

-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsForms" ADD COLUMN     "remarks" TEXT;
