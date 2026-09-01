-- CreateTable: RangeOffices (was in schema but never migrated)
CREATE TABLE IF NOT EXISTS "RangeOffices" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RangeOffices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RangeOffices_name_key" ON "RangeOffices"("name");

-- AddForeignKey for RangeOffices -> Districts
ALTER TABLE "RangeOffices" ADD CONSTRAINT "RangeOffices_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add rangeOfficeId to Users
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "rangeOfficeId" INTEGER;

-- AddForeignKey: Users -> RangeOffices
ALTER TABLE "Users" ADD CONSTRAINT "Users_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add rangeOfficeId to Zones (already in schema)
ALTER TABLE "Zones" ADD COLUMN IF NOT EXISTS "rangeOfficeId" INTEGER;

-- AddForeignKey: Zones -> RangeOffices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Zones_rangeOfficeId_fkey'
  ) THEN
    ALTER TABLE "Zones" ADD CONSTRAINT "Zones_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add rangeOfficeId to FLAFAddressesAndContactDetails (already in schema)
ALTER TABLE "FLAFAddressesAndContactDetails" ADD COLUMN IF NOT EXISTS "rangeOfficeId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FLAFAddressesAndContactDetails_rangeOfficeId_fkey'
  ) THEN
    ALTER TABLE "FLAFAddressesAndContactDetails" ADD CONSTRAINT "FLAFAddressesAndContactDetails_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add rangeOfficeId to RenewalAddressesAndContactDetails (already in schema)
ALTER TABLE "RenewalAddressesAndContactDetails" ADD COLUMN IF NOT EXISTS "rangeOfficeId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'RenewalAddressesAndContactDetails_rangeOfficeId_fkey'
  ) THEN
    ALTER TABLE "RenewalAddressesAndContactDetails" ADD CONSTRAINT "RenewalAddressesAndContactDetails_rangeOfficeId_fkey" FOREIGN KEY ("rangeOfficeId") REFERENCES "RangeOffices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
