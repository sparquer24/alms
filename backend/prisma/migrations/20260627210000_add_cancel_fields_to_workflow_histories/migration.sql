-- DropForeignKey
ALTER TABLE "CancelLicenseHistory" DROP CONSTRAINT IF EXISTS "CancelLicenseHistory_cancelRequestId_fkey";

-- DropForeignKey
ALTER TABLE "CancelLicenseHistory" DROP CONSTRAINT IF EXISTS "CancelLicenseHistory_cancelledBy_fkey";

-- AlterTable
ALTER TABLE "CancelWorkflowHistories" ADD COLUMN IF NOT EXISTS "acknowledgementNo" TEXT,
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "isSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "middleName" TEXT;

-- DropTable
DROP TABLE IF EXISTS "CancelLicenseHistory";
