-- CreateEnum
CREATE TYPE "RoleFlowApplicationType" AS ENUM ('ALL', 'FRESH', 'RENEWAL', 'CANCEL');

-- CreateEnum
CREATE TYPE "RoleFlowPurpose" AS ENUM ('ALL', 'SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY', 'CROP_PROTECTION');

-- AlterTable
ALTER TABLE "RoleFlowMapping" ADD COLUMN "applicationType" "RoleFlowApplicationType" NOT NULL DEFAULT 'ALL',
ADD COLUMN "purpose" "RoleFlowPurpose" NOT NULL DEFAULT 'ALL';

-- DropIndex
DROP INDEX "RoleFlowMapping_currentRoleId_key";

-- CreateIndex
CREATE UNIQUE INDEX "RoleFlowMapping_currentRoleId_applicationType_purpose_key" ON "RoleFlowMapping"("currentRoleId", "applicationType", "purpose");
