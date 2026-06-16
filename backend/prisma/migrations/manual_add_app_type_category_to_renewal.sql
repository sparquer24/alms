-- ============================================================
-- Migration: Add applicationTypeId and categoryId to RenewalFormPersonalDetails
-- 
-- This migration adds optional foreign key columns to the
-- RenewalFormPersonalDetails table linking it to the
-- ApplicationType and Category master tables.
-- 
-- Applied: (fill in when applied)
-- ============================================================

-- Add applicationTypeId column (nullable foreign key to ApplicationType)
ALTER TABLE "RenewalFormPersonalDetails" 
  ADD COLUMN "applicationTypeId" INTEGER;

-- Add categoryId column (nullable foreign key to Category)
ALTER TABLE "RenewalFormPersonalDetails" 
  ADD COLUMN "categoryId" INTEGER;

-- Add foreign key constraint for applicationTypeId
ALTER TABLE "RenewalFormPersonalDetails" 
  ADD CONSTRAINT "RenewalFormPersonalDetails_applicationTypeId_fkey" 
  FOREIGN KEY ("applicationTypeId") 
  REFERENCES "ApplicationType"(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Add foreign key constraint for categoryId
ALTER TABLE "RenewalFormPersonalDetails" 
  ADD CONSTRAINT "RenewalFormPersonalDetails_categoryId_fkey" 
  FOREIGN KEY ("categoryId") 
  REFERENCES "Category"(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- (Optional) Add index for better join performance
CREATE INDEX IF NOT EXISTS "RenewalFormPersonalDetails_applicationTypeId_idx" 
  ON "RenewalFormPersonalDetails"("applicationTypeId");

CREATE INDEX IF NOT EXISTS "RenewalFormPersonalDetails_categoryId_idx" 
  ON "RenewalFormPersonalDetails"("categoryId");

-- ============================================================
-- Rollback SQL (if needed):
--   ALTER TABLE "RenewalFormPersonalDetails" DROP CONSTRAINT "RenewalFormPersonalDetails_applicationTypeId_fkey";
--   ALTER TABLE "RenewalFormPersonalDetails" DROP CONSTRAINT "RenewalFormPersonalDetails_categoryId_fkey";
--   ALTER TABLE "RenewalFormPersonalDetails" DROP COLUMN "applicationTypeId";
--   ALTER TABLE "RenewalFormPersonalDetails" DROP COLUMN "categoryId";
-- ============================================================
