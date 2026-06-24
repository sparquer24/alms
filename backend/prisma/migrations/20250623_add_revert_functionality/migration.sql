-- ============================================================
-- Migration: add_revert_functionality
-- Generated for ALMS Project
-- Run via: npx prisma migrate dev --name add_revert_functionality
-- Or apply manually for production
-- ============================================================

-- 1. Create ApplicationType enum
DO $$ BEGIN
    CREATE TYPE "ApplicationType" AS ENUM ('FRESH', 'RENEWAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create ApplicationVersionSnapshot table
CREATE TABLE IF NOT EXISTS "ApplicationVersionSnapshot" (
    "id"               SERIAL PRIMARY KEY,
    "applicationId"    INTEGER NOT NULL,
    "applicationType"  "ApplicationType" NOT NULL,
    "versionNumber"    INTEGER NOT NULL,
    "snapshotData"     JSONB NOT NULL,
    "triggerAction"    VARCHAR(50) NOT NULL,
    "triggerActionId"  INTEGER,
    "actionByUserId"   INTEGER NOT NULL,
    "actionByRoleId"   INTEGER NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflowStatusId" INTEGER NOT NULL,
    "currentUserId"    INTEGER NOT NULL,
    "previousUserId"   INTEGER,
    CONSTRAINT "ApplicationVersionSnapshot_appId_type_vNum_key"
        UNIQUE ("applicationId", "applicationType", "versionNumber"),
    CONSTRAINT "ApplicationVersionSnapshot_actionByUserId_fkey"
        FOREIGN KEY ("actionByUserId") REFERENCES "Users"("id") ON DELETE CASCADE,
    CONSTRAINT "ApplicationVersionSnapshot_actionByRoleId_fkey"
        FOREIGN KEY ("actionByRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE
);

-- 3. Create RevertAuditLog table
CREATE TABLE IF NOT EXISTS "RevertAuditLog" (
    "id"                     SERIAL PRIMARY KEY,
    "applicationId"          INTEGER NOT NULL,
    "applicationType"        "ApplicationType" NOT NULL,
    "fromVersionNumber"      INTEGER NOT NULL,
    "toVersionNumber"        INTEGER NOT NULL,
    "newVersionNumber"       INTEGER NOT NULL,
    "revertedByUserId"       INTEGER NOT NULL,
    "revertedByRoleId"       INTEGER NOT NULL,
    "originalActionByUserId" INTEGER,
    "reason"                 TEXT NOT NULL,
    "revertedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromStatusId"           INTEGER NOT NULL,
    "toStatusId"             INTEGER NOT NULL,
    "isTerminalRevert"       BOOLEAN NOT NULL DEFAULT false,
    "escalationDocumentUrl"  TEXT,
    "ipAddress"              VARCHAR(45),
    "userAgent"              TEXT,
    CONSTRAINT "RevertAuditLog_revertedByUserId_fkey"
        FOREIGN KEY ("revertedByUserId") REFERENCES "Users"("id") ON DELETE CASCADE,
    CONSTRAINT "RevertAuditLog_revertedByRoleId_fkey"
        FOREIGN KEY ("revertedByRoleId") REFERENCES "Roles"("id") ON DELETE CASCADE
);

-- 4. Add version tracking columns to FreshLicenseApplicationPersonalDetails
ALTER TABLE "FreshLicenseApplicationPersonalDetails"
    ADD COLUMN IF NOT EXISTS "currentVersionNumber"    INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "lastRevertedAt"          TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "lastRevertedByUserId"    INTEGER,
    ADD COLUMN IF NOT EXISTS "isReverted"              BOOLEAN NOT NULL DEFAULT false;

-- 5. Add version tracking columns to RenewalFormPersonalDetails
ALTER TABLE "RenewalFormPersonalDetails"
    ADD COLUMN IF NOT EXISTS "currentVersionNumber"    INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "lastRevertedAt"          TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "lastRevertedByUserId"    INTEGER,
    ADD COLUMN IF NOT EXISTS "isReverted"              BOOLEAN NOT NULL DEFAULT false;

-- 6. Add revert permission flags to Roles
ALTER TABLE "Roles"
    ADD COLUMN IF NOT EXISTS "can_revert"          BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "can_revert_others"   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "can_revert_terminal" BOOLEAN NOT NULL DEFAULT false;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS "AppVersionSnapshot_appId_type_idx"
    ON "ApplicationVersionSnapshot"("applicationId", "applicationType");

CREATE INDEX IF NOT EXISTS "RevertAuditLog_appId_type_idx"
    ON "RevertAuditLog"("applicationId", "applicationType");

CREATE INDEX IF NOT EXISTS "RevertAuditLog_revertedByUserId_idx"
    ON "RevertAuditLog"("revertedByUserId");

CREATE INDEX IF NOT EXISTS "RevertAuditLog_revertedAt_idx"
    ON "RevertAuditLog"("revertedAt");

-- 8. Seed new REVERT action (if not already exists)
INSERT INTO "Actiones" ("code", "name", "description", "isActive")
SELECT 'REVERT', 'Revert', 'Revert application to a previous version', true
WHERE NOT EXISTS (SELECT 1 FROM "Actiones" WHERE "code" = 'REVERT');

-- 9. Seed new REVERTED status (if not already exists)
INSERT INTO "Statuses" ("code", "name", "description", "isActive", "isStarted")
SELECT 'REVERTED', 'Reverted', 'Application reverted to a previous version', true, false
WHERE NOT EXISTS (SELECT 1 FROM "Statuses" WHERE "code" = 'REVERTED');

-- 10. Set revert permissions for roles
-- can_revert: all officers (not APPLICANT)
UPDATE "Roles" SET "can_revert" = true
WHERE "code" IN ('SHO','ZS','ACP','DCP','JTCP','CP','AS','ADO','CADO','ADMIN','SUPER_ADMIN');

-- can_revert_others: senior officers and above
UPDATE "Roles" SET "can_revert_others" = true
WHERE "code" IN ('DCP','JTCP','CP','ADO','CADO','ADMIN','SUPER_ADMIN');

-- can_revert_terminal: admin only
UPDATE "Roles" SET "can_revert_terminal" = true
WHERE "code" IN ('ADMIN','SUPER_ADMIN');

-- 11. Add REVERT to RolesActionsMapping for eligible roles
-- First get the REVERT action ID, then insert mappings
DO $$
DECLARE
    revert_action_id INTEGER;
    role_rec RECORD;
BEGIN
    SELECT id INTO revert_action_id FROM "Actiones" WHERE code = 'REVERT';
    IF revert_action_id IS NOT NULL THEN
        FOR role_rec IN
            SELECT id FROM "Roles"
            WHERE code IN ('SHO','ZS','ACP','DCP','JTCP','CP','AS','ADO','CADO','ADMIN','SUPER_ADMIN')
        LOOP
            INSERT INTO "RolesActionsMapping" ("roleId", "actionId", "isActive")
            VALUES (role_rec.id, revert_action_id, true)
            ON CONFLICT ("roleId", "actionId") DO NOTHING;
        END LOOP;
    END IF;
END $$;
