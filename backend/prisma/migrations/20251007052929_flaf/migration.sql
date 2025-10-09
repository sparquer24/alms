/*
  Warnings:

  - Made the column `dashboard_title` on table `Roles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ApplicationLifecycleStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- AlterTable
ALTER TABLE "public"."Roles" ALTER COLUMN "dashboard_title" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."RolesActionsMapping" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolesActionsMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationPersonalDetails" (
    "id" SERIAL NOT NULL,
    "acknowledgementNo" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "filledBy" TEXT,
    "parentOrSpouseName" TEXT NOT NULL,
    "sex" "public"."Sex" NOT NULL,
    "placeOfBirth" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dobInWords" TEXT,
    "panNumber" TEXT,
    "aadharNumber" TEXT,
    "applicationLifecycleStatus" "public"."ApplicationLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreshLicenseApplicationPersonalDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolesActionsMapping_roleId_actionId_key" ON "public"."RolesActionsMapping"("roleId", "actionId");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationPersonalDetails_acknowledgementNo_key" ON "public"."FreshLicenseApplicationPersonalDetails"("acknowledgementNo");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationPersonalDetails_panNumber_key" ON "public"."FreshLicenseApplicationPersonalDetails"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FreshLicenseApplicationPersonalDetails_aadharNumber_key" ON "public"."FreshLicenseApplicationPersonalDetails"("aadharNumber");

-- CreateIndex
CREATE INDEX "FreshLicenseApplicationPersonalDetails_aadharNumber_idx" ON "public"."FreshLicenseApplicationPersonalDetails"("aadharNumber");

-- AddForeignKey
ALTER TABLE "public"."RolesActionsMapping" ADD CONSTRAINT "RolesActionsMapping_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolesActionsMapping" ADD CONSTRAINT "RolesActionsMapping_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."Actiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
