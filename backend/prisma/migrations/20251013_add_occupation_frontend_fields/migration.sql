-- Migration: Add frontend form fields to FLAFOccupationAndBusiness table
-- Date: October 13, 2025
-- Purpose: Add missing frontend form fields that exist in Prisma schema but not in database

-- ==============================================================================
-- 1. Add Missing Columns to Occupation and Business Table
-- ==============================================================================

-- AlterTable - Add new columns if they don't exist
DO $$
BEGIN
    -- Add employerName column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FLAFOccupationAndBusiness' 
        AND column_name = 'employerName'
    ) THEN
        ALTER TABLE "FLAFOccupationAndBusiness" ADD COLUMN "employerName" TEXT;
    END IF;

    -- Add businessDetails column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FLAFOccupationAndBusiness' 
        AND column_name = 'businessDetails'
    ) THEN
        ALTER TABLE "FLAFOccupationAndBusiness" ADD COLUMN "businessDetails" TEXT;
    END IF;

    -- Add annualIncome column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FLAFOccupationAndBusiness' 
        AND column_name = 'annualIncome'
    ) THEN
        ALTER TABLE "FLAFOccupationAndBusiness" ADD COLUMN "annualIncome" TEXT;
    END IF;

    -- Add workExperience column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FLAFOccupationAndBusiness' 
        AND column_name = 'workExperience'
    ) THEN
        ALTER TABLE "FLAFOccupationAndBusiness" ADD COLUMN "workExperience" TEXT;
    END IF;

    -- Add businessType column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FLAFOccupationAndBusiness' 
        AND column_name = 'businessType'
    ) THEN
        ALTER TABLE "FLAFOccupationAndBusiness" ADD COLUMN "businessType" TEXT;
    END IF;
END $$;

-- ==============================================================================
-- 2. Create Indexes for Performance
-- ==============================================================================

-- Index on employer name for faster searching
CREATE INDEX IF NOT EXISTS "idx_occupation_employer" ON "FLAFOccupationAndBusiness" ("employerName");

-- Index on annualIncome for filtering/reporting
CREATE INDEX IF NOT EXISTS "idx_occupation_income" ON "FLAFOccupationAndBusiness" ("annualIncome");