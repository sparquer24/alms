-- CreateTable
CREATE TABLE "LicensesMergeAuditLog" (
    "id" SERIAL NOT NULL,
    "mergeId" TEXT NOT NULL,
    "freshLicenseId" INTEGER NOT NULL,
    "renewalLicenseId" INTEGER NOT NULL,
    "mergedFields" TEXT,
    "mergedBy" INTEGER,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicensesMergeAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LicensesMergeAuditLog_mergeId_key" ON "LicensesMergeAuditLog"("mergeId");

-- CreateIndex
CREATE INDEX "LicensesMergeAuditLog_freshLicenseId_idx" ON "LicensesMergeAuditLog"("freshLicenseId");

-- CreateIndex
CREATE INDEX "LicensesMergeAuditLog_renewalLicenseId_idx" ON "LicensesMergeAuditLog"("renewalLicenseId");

-- CreateIndex
CREATE INDEX "LicensesMergeAuditLog_mergeId_idx" ON "LicensesMergeAuditLog"("mergeId");

-- AddForeignKey
ALTER TABLE "LicensesMergeAuditLog" ADD CONSTRAINT "LicensesMergeAuditLog_freshLicenseId_fkey" FOREIGN KEY ("freshLicenseId") REFERENCES "FreshLicenseApplicationPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicensesMergeAuditLog" ADD CONSTRAINT "LicensesMergeAuditLog_renewalLicenseId_fkey" FOREIGN KEY ("renewalLicenseId") REFERENCES "RenewalFormPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicensesMergeAuditLog" ADD CONSTRAINT "LicensesMergeAuditLog_mergedBy_fkey" FOREIGN KEY ("mergedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
