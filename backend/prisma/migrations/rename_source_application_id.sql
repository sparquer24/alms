-- ============================================================
-- Migration: Rename & Restructure License Application ID Fields
-- 
-- Changes:
--   1. Add freshApplicationId (replaces sourceApplicationId)
--   2. Add renewalApplicationId (tracks last renewal)
--   3. Add cancelApplicationId (tracks cancellation)
--   4. Migrate existing data from sourceApplicationId
--   5. Add foreign key constraints and indexes
--   6. Remove old columns (sourceApplicationId, lastModifiedByAppId)
-- ============================================================

-- ============================================================
-- STEP 1: Add New Columns
-- ============================================================
ALTER TABLE "Licenses" ADD COLUMN "freshApplicationId" INTEGER;
ALTER TABLE "Licenses" ADD COLUMN "renewalApplicationId" INTEGER;
ALTER TABLE "Licenses" ADD COLUMN "cancelApplicationId" INTEGER;

-- ============================================================
-- STEP 2: Migrate Existing Data
-- ============================================================

-- Copy existing sourceApplicationId values into freshApplicationId
-- (This preserves the original fresh app reference for all existing licenses)
UPDATE "Licenses" SET "freshApplicationId" = "sourceApplicationId" WHERE "sourceApplicationId" IS NOT NULL;

-- ============================================================
-- STEP 3: Add Foreign Key Constraints
-- ============================================================

-- Foreign key: freshApplicationId → FreshLicenseApplicationPersonalDetails.id
ALTER TABLE "Licenses" 
  ADD CONSTRAINT "fk_licenses_fresh_application" 
  FOREIGN KEY ("freshApplicationId") 
  REFERENCES "FreshLicenseApplicationPersonalDetails"("id") 
  ON DELETE SET NULL;

-- Foreign key: renewalApplicationId → RenewalFormPersonalDetails.id
ALTER TABLE "Licenses" 
  ADD CONSTRAINT "fk_licenses_renewal_application" 
  FOREIGN KEY ("renewalApplicationId") 
  REFERENCES "RenewalFormPersonalDetails"("id") 
  ON DELETE SET NULL;

-- Foreign key: cancelApplicationId → CancelFormRequests.id
ALTER TABLE "Licenses" 
  ADD CONSTRAINT "fk_licenses_cancel_application" 
  FOREIGN KEY ("cancelApplicationId") 
  REFERENCES "CancelFormRequests"("id") 
  ON DELETE SET NULL;

-- ============================================================
-- STEP 4: Add Indexes (for query performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS "idx_licenses_fresh_application_id" ON "Licenses"("freshApplicationId");
CREATE INDEX IF NOT EXISTS "idx_licenses_renewal_application_id" ON "Licenses"("renewalApplicationId");
CREATE INDEX IF NOT EXISTS "idx_licenses_cancel_application_id" ON "Licenses"("cancelApplicationId");

-- ============================================================
-- STEP 5: Verify Data Integrity BEFORE Dropping Old Columns
-- ============================================================

-- Run this query first to ensure migration is complete:
-- SELECT COUNT(*) as unmatched 
-- FROM "Licenses" 
-- WHERE "sourceApplicationId" IS NOT NULL 
--   AND ("freshApplicationId" IS NULL OR "freshApplicationId" != "sourceApplicationId");
--
-- If unmatched = 0, proceed with step 6.

-- ============================================================
-- STEP 6: Remove Old Columns (run ONLY after verification)
-- ============================================================

-- Drop the old sourceApplicationId column
ALTER TABLE "Licenses" DROP COLUMN "sourceApplicationId";

-- Drop the old lastModifiedByAppId column  
ALTER TABLE "Licenses" DROP COLUMN "lastModifiedByAppId";

-- ============================================================
-- ROLLBACK QUERIES (if anything goes wrong)
-- ============================================================
-- 
-- -- Restore sourceApplicationId
-- ALTER TABLE "Licenses" ADD COLUMN "sourceApplicationId" INTEGER;
-- UPDATE "Licenses" SET "sourceApplicationId" = "freshApplicationId" WHERE "freshApplicationId" IS NOT NULL;
-- 
-- -- Drop new columns
-- ALTER TABLE "Licenses" DROP CONSTRAINT IF EXISTS "fk_licenses_cancel_application";
-- ALTER TABLE "Licenses" DROP CONSTRAINT IF EXISTS "fk_licenses_renewal_application";
-- ALTER TABLE "Licenses" DROP CONSTRAINT IF EXISTS "fk_licenses_fresh_application";
-- ALTER TABLE "Licenses" DROP COLUMN IF EXISTS "cancelApplicationId";
-- ALTER TABLE "Licenses" DROP COLUMN IF EXISTS "renewalApplicationId";
-- ALTER TABLE "Licenses" DROP COLUMN IF EXISTS "freshApplicationId";
-- 
-- -- Restore lastModifiedByAppId
-- ALTER TABLE "Licenses" ADD COLUMN "lastModifiedByAppId" INTEGER;
