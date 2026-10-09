-- Approval rules: which role makes the final decision (approve vs recommend)
-- per application type / state / district / purpose / area of validity.
-- Note: PostgreSQL treats NULLs as distinct in the unique index, so rows with
-- a NULL state/district (the defaults) are kept unique by ApprovalRulesService.
--
-- Idempotent: some databases already had these objects from `prisma db push`,
-- so every statement skips what already exists instead of failing.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ApprovalRuleArea" AS ENUM ('DISTRICT', 'STATE', 'INDIA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVE', 'RECOMMEND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApprovalRule" (
    "id" SERIAL NOT NULL,
    "applicationType" "RoleFlowApplicationType" NOT NULL DEFAULT 'ALL',
    "stateId" INTEGER,
    "districtId" INTEGER,
    "purpose" "RoleFlowPurpose" NOT NULL DEFAULT 'ALL',
    "area" "ApprovalRuleArea" NOT NULL,
    "approverRoleId" INTEGER NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApprovalRule_stateId_districtId_idx" ON "ApprovalRule"("stateId", "districtId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ApprovalRule_applicationType_stateId_districtId_purpose_are_key" ON "ApprovalRule"("applicationType", "stateId", "districtId", "purpose", "area");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_approverRoleId_fkey" FOREIGN KEY ("approverRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "States"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
