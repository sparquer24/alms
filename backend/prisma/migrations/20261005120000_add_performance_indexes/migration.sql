-- Performance: indexes for foreign keys used in hot read paths.
-- PostgreSQL does not index foreign keys automatically, so detail pages (child rows
-- by applicationId), the inbox "Sent" tab (history by previousUserId), the location
-- hierarchy and user lookups by role/location were doing sequential scans.
--
-- Idempotent (IF NOT EXISTS) like the other migrations, in case an index already exists.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Districts_stateId_idx" ON "Districts"("stateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Zones_rangeOfficeId_idx" ON "Zones"("rangeOfficeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Divisions_zoneId_idx" ON "Divisions"("zoneId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PoliceStations_divisionId_idx" ON "PoliceStations"("divisionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Users_roleId_idx" ON "Users"("roleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Users_stateId_idx" ON "Users"("stateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Users_districtId_idx" ON "Users"("districtId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FLAFCriminalHistories_applicationId_idx" ON "FLAFCriminalHistories"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FLAFLicenseHistories_applicationId_idx" ON "FLAFLicenseHistories"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FLAFLicenseDetails_applicationId_idx" ON "FLAFLicenseDetails"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FLAFFileUploads_applicationId_idx" ON "FLAFFileUploads"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FreshLicenseApplicationsFormWorkflowHistories_applicationId_idx" ON "FreshLicenseApplicationsFormWorkflowHistories"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FreshLicenseApplicationsFormWorkflowHistories_previousUserI_idx" ON "FreshLicenseApplicationsFormWorkflowHistories"("previousUserId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FreshLicenseApplicationsFormWorkflowHistories_nextUserId_idx" ON "FreshLicenseApplicationsFormWorkflowHistories"("nextUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenewalLicenseDetails_applicationId_idx" ON "RenewalLicenseDetails"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenewalFileUploads_applicationId_idx" ON "RenewalFileUploads"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenewalCriminalHistories_applicationId_idx" ON "RenewalCriminalHistories"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenewalLicenseHistories_applicationId_idx" ON "RenewalLicenseHistories"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenewalApplicationsFormWorkflowHistories_applicationId_crea_idx" ON "RenewalApplicationsFormWorkflowHistories"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenewalApplicationsFormWorkflowHistories_previousUserId_cre_idx" ON "RenewalApplicationsFormWorkflowHistories"("previousUserId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenewalApplicationsFormWorkflowHistories_nextUserId_idx" ON "RenewalApplicationsFormWorkflowHistories"("nextUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RangeOffices_districtId_idx" ON "RangeOffices"("districtId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Licenses_freshApplicationId_idx" ON "Licenses"("freshApplicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Licenses_renewalApplicationId_idx" ON "Licenses"("renewalApplicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLogs_userId_idx" ON "AuditLogs"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PoliceEnquiryReports_applicationId_idx" ON "PoliceEnquiryReports"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PoliceEnquiryReports_renewalId_idx" ON "PoliceEnquiryReports"("renewalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hearings_applicationId_idx" ON "Hearings"("applicationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hearings_renewalId_idx" ON "Hearings"("renewalId");

