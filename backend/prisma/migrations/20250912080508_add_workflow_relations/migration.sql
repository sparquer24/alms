/*
  Warnings:

  - Added the required column `divisionId` to the `FreshLicenseApplicationsFormAddresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zoneId` to the `FreshLicenseApplicationsFormAddresses` table without a default value. This is not possible if the table is not empty.

  Solution: First add columns as nullable, populate them based on existing policeStationId relationships, then make them required.
*/

-- Step 1: Add the columns as nullable first
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ADD COLUMN "divisionId" INTEGER;
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ADD COLUMN "zoneId" INTEGER;

-- Step 2: Update existing records by deriving values from policeStationId
UPDATE "public"."FreshLicenseApplicationsFormAddresses" 
SET "divisionId" = ps."divisionId"
FROM "public"."PoliceStations" ps
WHERE "FreshLicenseApplicationsFormAddresses"."policeStationId" = ps.id;

UPDATE "public"."FreshLicenseApplicationsFormAddresses" 
SET "zoneId" = d."zoneId"
FROM "public"."PoliceStations" ps
JOIN "public"."Divisions" d ON ps."divisionId" = d.id
WHERE "FreshLicenseApplicationsFormAddresses"."policeStationId" = ps.id;

-- Step 3: Make the columns required (NOT NULL)
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ALTER COLUMN "divisionId" SET NOT NULL;
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ALTER COLUMN "zoneId" SET NOT NULL;

-- Step 4: Add foreign key constraints
ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."FreshLicenseApplicationsFormAddresses" ADD CONSTRAINT "FreshLicenseApplicationsFormAddresses_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
