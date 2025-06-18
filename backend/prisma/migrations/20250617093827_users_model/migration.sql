/*
  Warnings:

  - You are about to drop the column `description` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `designation` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_assigned_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_login` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ApplicationFlow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FlowStatusMapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleHierarchy` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_assigned_to_id_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_flow_status_id_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_forwarded_from_id_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_forwarded_to_id_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationFlow" DROP CONSTRAINT "ApplicationFlow_acted_by_id_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationFlow" DROP CONSTRAINT "ApplicationFlow_application_id_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationFlow" DROP CONSTRAINT "ApplicationFlow_flow_status_id_fkey";

-- DropForeignKey
ALTER TABLE "RoleHierarchy" DROP CONSTRAINT "RoleHierarchy_from_role_id_fkey";

-- DropForeignKey
ALTER TABLE "RoleHierarchy" DROP CONSTRAINT "RoleHierarchy_to_role_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_role_id_fkey";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "description",
DROP COLUMN "level";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "created_at",
DROP COLUMN "designation",
DROP COLUMN "is_active",
DROP COLUMN "last_assigned_at",
DROP COLUMN "last_login",
DROP COLUMN "name",
DROP COLUMN "password_hash",
DROP COLUMN "role_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "districtId" INTEGER,
ADD COLUMN     "divisionId" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "policeStationId" INTEGER,
ADD COLUMN     "roleId" INTEGER NOT NULL,
ADD COLUMN     "stateId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "zoneId" INTEGER;

-- DropTable
DROP TABLE "Application";

-- DropTable
DROP TABLE "ApplicationFlow";

-- DropTable
DROP TABLE "FlowStatusMapping";

-- DropTable
DROP TABLE "RoleHierarchy";

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

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
