-- =============================================================================
-- Renewal data audit (READ-ONLY)
--
-- Finds records damaged by renewal behaviour that existed before the renewal
-- rules fix (see src/modules/renewal/renewal-rules.ts):
--   1. License identity overwritten by an approved renewal
--   2. Endorsed weapons replaced by an approved renewal
--   3. Suspended / revoked / cancelled licenses reactivated by a renewal
--   4. Renewals whose permanent address was overwritten by the present address
--   5. Open drafts whose identity differs from the license (self-heal on next save)
--
-- Every statement is a SELECT, and the whole script runs in a READ ONLY
-- transaction. Run the "summary" query first; the detail queries list the
-- affected records for review.
--
-- Output includes Aadhaar/PAN comparisons as booleans only — no raw values —
-- so results can be shared for review without exposing personal data.
--
-- Limitation: checks 1 and 2 compare the license with its ORIGINAL fresh
-- application. Imported licenses (no fresh application) cannot be checked this
-- way, and a legitimate correction made through a renewal will also show up.
--
-- Join tables follow Prisma's implicit many-to-many naming ("A" = the model
-- whose name sorts first): "_LicenseEndorsedWeapons" (A = Licenses,
-- B = WeaponTypeMaster) and "_RequestedWeapons" (A = FLAFLicenseDetails,
-- B = WeaponTypeMaster). The Licenses tables are not in prisma/migrations
-- (created via `db push`), so if a query fails on a table name, check with:
--   SELECT tablename FROM pg_tables WHERE tablename LIKE '\_%Weapons';
--
-- Run with:  psql "$DATABASE_URL" -f scripts/audit/renewal-data-audit.sql
-- =============================================================================

BEGIN TRANSACTION READ ONLY;

-- -----------------------------------------------------------------------------
-- Summary: one row per check with the number of affected records
-- -----------------------------------------------------------------------------
WITH identity_changed AS (
  SELECT l.id
  FROM "Licenses" l
  JOIN "FreshLicenseApplicationPersonalDetails" f ON f.id = l."freshApplicationId"
  WHERE l."renewalCount" > 0
    AND (
         l."firstName" IS DISTINCT FROM f."firstName"
      OR l."middleName" IS DISTINCT FROM f."middleName"
      OR l."lastName" IS DISTINCT FROM f."lastName"
      OR l."parentOrSpouseName" IS DISTINCT FROM f."parentOrSpouseName"
      OR l."sex"::text IS DISTINCT FROM f."sex"::text
      OR l."dateOfBirth"::date IS DISTINCT FROM f."dateOfBirth"::date
      OR l."aadharNumber" IS DISTINCT FROM f."aadharNumber"
      OR l."panNumber" IS DISTINCT FROM f."panNumber"
    )
),
license_weapons AS (
  SELECT "A" AS license_id, array_agg("B" ORDER BY "B") AS weapon_ids
  FROM "_LicenseEndorsedWeapons"
  GROUP BY "A"
),
fresh_weapons AS (
  SELECT d."applicationId" AS fresh_id, array_agg(DISTINCT rw."B" ORDER BY rw."B") AS weapon_ids
  FROM "FLAFLicenseDetails" d
  JOIN "_RequestedWeapons" rw ON rw."A" = d.id
  GROUP BY d."applicationId"
),
weapons_changed AS (
  SELECT l.id
  FROM "Licenses" l
  JOIN fresh_weapons fw ON fw.fresh_id = l."freshApplicationId"
  LEFT JOIN license_weapons lw ON lw.license_id = l.id
  WHERE l."renewalCount" > 0
    AND lw.weapon_ids IS DISTINCT FROM fw.weapon_ids
),
reactivated AS (
  SELECT h.id
  FROM "LicenseWorkflowHistory" h
  WHERE h.action = 'RENEWED'
    AND h."previousStatus" IN ('SUSPENDED', 'REVOKED', 'CANCELLED')
    AND h."newStatus" = 'ACTIVE'
),
shared_address AS (
  SELECT r.id
  FROM "RenewalFormPersonalDetails" r
  JOIN "Licenses" lic ON lic.id = r."licenseId"
  JOIN "FreshLicenseApplicationPersonalDetails" f ON f.id = lic."freshApplicationId"
  JOIN "FLAFAddressesAndContactDetails" fp ON fp.id = f."permanentAddressId"
  JOIN "FLAFAddressesAndContactDetails" fs ON fs.id = f."presentAddressId"
  JOIN "RenewalAddressesAndContactDetails" rp ON rp.id = r."permanentAddressId"
  JOIN "RenewalAddressesAndContactDetails" rs ON rs.id = r."presentAddressId"
  -- Fresh application had two different addresses, the renewal ended up with one
  WHERE fp."addressLine" IS DISTINCT FROM fs."addressLine"
    AND rp."addressLine" IS NOT DISTINCT FROM rs."addressLine"
),
draft_identity_mismatch AS (
  SELECT r.id
  FROM "RenewalFormPersonalDetails" r
  JOIN "Licenses" l ON l.id = r."licenseId"
  WHERE COALESCE(r."isSubmit", false) = false
    AND (
         r."firstName" IS DISTINCT FROM l."firstName"
      OR r."lastName" IS DISTINCT FROM l."lastName"
      OR r."parentOrSpouseName" IS DISTINCT FROM l."parentOrSpouseName"
      OR (l."aadharNumber" IS NOT NULL AND r."aadharNumber" IS DISTINCT FROM l."aadharNumber")
      OR (l."dateOfBirth" IS NOT NULL AND r."dateOfBirth"::date IS DISTINCT FROM l."dateOfBirth"::date)
    )
)
SELECT '1. License identity changed by renewal' AS "check", COUNT(*) AS affected FROM identity_changed
UNION ALL SELECT '2. Endorsed weapons changed by renewal', COUNT(*) FROM weapons_changed
UNION ALL SELECT '3. Suspended/revoked/cancelled license reactivated by renewal', COUNT(*) FROM reactivated
UNION ALL SELECT '4. Renewal permanent address overwritten by present', COUNT(*) FROM shared_address
UNION ALL SELECT '5. Open draft identity differs from license (self-heals on save)', COUNT(*) FROM draft_identity_mismatch;

-- -----------------------------------------------------------------------------
-- 1. Detail: which identity fields differ from the original fresh application
-- -----------------------------------------------------------------------------
SELECT
  l.id                                   AS license_id,
  l."licenseNumber",
  l."renewalCount",
  l."lastModifiedRenewalId"              AS last_renewal_id,
  f.id                                   AS fresh_application_id,
  (l."firstName" IS DISTINCT FROM f."firstName"
   OR l."middleName" IS DISTINCT FROM f."middleName"
   OR l."lastName" IS DISTINCT FROM f."lastName")                     AS name_changed,
  l."parentOrSpouseName" IS DISTINCT FROM f."parentOrSpouseName"       AS parent_changed,
  l."sex"::text IS DISTINCT FROM f."sex"::text                         AS sex_changed,
  l."dateOfBirth"::date IS DISTINCT FROM f."dateOfBirth"::date         AS dob_changed,
  l."aadharNumber" IS DISTINCT FROM f."aadharNumber"                   AS aadhaar_changed,
  l."panNumber" IS DISTINCT FROM f."panNumber"                         AS pan_changed
FROM "Licenses" l
JOIN "FreshLicenseApplicationPersonalDetails" f ON f.id = l."freshApplicationId"
WHERE l."renewalCount" > 0
  AND (
       l."firstName" IS DISTINCT FROM f."firstName"
    OR l."middleName" IS DISTINCT FROM f."middleName"
    OR l."lastName" IS DISTINCT FROM f."lastName"
    OR l."parentOrSpouseName" IS DISTINCT FROM f."parentOrSpouseName"
    OR l."sex"::text IS DISTINCT FROM f."sex"::text
    OR l."dateOfBirth"::date IS DISTINCT FROM f."dateOfBirth"::date
    OR l."aadharNumber" IS DISTINCT FROM f."aadharNumber"
    OR l."panNumber" IS DISTINCT FROM f."panNumber"
  )
ORDER BY l.id;

-- -----------------------------------------------------------------------------
-- 2. Detail: endorsed weapons now vs. weapons granted on the fresh application
-- -----------------------------------------------------------------------------
WITH license_weapons AS (
  SELECT lew."A" AS license_id, array_agg(w.name ORDER BY w.id) AS weapons, array_agg(w.id ORDER BY w.id) AS ids
  FROM "_LicenseEndorsedWeapons" lew
  JOIN "WeaponTypeMaster" w ON w.id = lew."B"
  GROUP BY lew."A"
),
fresh_weapons AS (
  SELECT d."applicationId" AS fresh_id,
         array_agg(DISTINCT w.name) AS weapons,
         array_agg(DISTINCT w.id ORDER BY w.id) AS ids
  FROM "FLAFLicenseDetails" d
  JOIN "_RequestedWeapons" rw ON rw."A" = d.id
  JOIN "WeaponTypeMaster" w ON w.id = rw."B"
  GROUP BY d."applicationId"
)
SELECT
  l.id               AS license_id,
  l."licenseNumber",
  l."lastModifiedRenewalId" AS last_renewal_id,
  fw.weapons         AS weapons_granted_on_fresh,
  lw.weapons         AS weapons_endorsed_now
FROM "Licenses" l
JOIN fresh_weapons fw ON fw.fresh_id = l."freshApplicationId"
LEFT JOIN license_weapons lw ON lw.license_id = l.id
WHERE l."renewalCount" > 0
  AND lw.ids IS DISTINCT FROM fw.ids
ORDER BY l.id;

-- -----------------------------------------------------------------------------
-- 3. Detail: renewals that reactivated a suspended/revoked/cancelled license
-- -----------------------------------------------------------------------------
SELECT
  h."licenseId"       AS license_id,
  l."licenseNumber",
  h."applicationId"   AS renewal_id,
  h."previousStatus",
  h."newStatus",
  l.status            AS status_now,
  h."createdAt"       AS renewed_at
FROM "LicenseWorkflowHistory" h
JOIN "Licenses" l ON l.id = h."licenseId"
WHERE h.action = 'RENEWED'
  AND h."previousStatus" IN ('SUSPENDED', 'REVOKED', 'CANCELLED')
  AND h."newStatus" = 'ACTIVE'
ORDER BY h."createdAt" DESC;

-- -----------------------------------------------------------------------------
-- 4. Detail: renewals that collapsed two different addresses into one.
--    `approved` = true means the wrong permanent address was also copied onto
--    the license itself.
-- -----------------------------------------------------------------------------
SELECT DISTINCT
  r.id                  AS renewal_id,
  r."licenseId"         AS license_id,
  r."licenseNumber",
  COALESCE(r."isApproved", false)                       AS approved,
  r."presentAddressId" = r."permanentAddressId"         AS shares_one_row
FROM "RenewalFormPersonalDetails" r
JOIN "Licenses" lic ON lic.id = r."licenseId"
JOIN "FreshLicenseApplicationPersonalDetails" f ON f.id = lic."freshApplicationId"
JOIN "FLAFAddressesAndContactDetails" fp ON fp.id = f."permanentAddressId"
JOIN "FLAFAddressesAndContactDetails" fs ON fs.id = f."presentAddressId"
JOIN "RenewalAddressesAndContactDetails" rp ON rp.id = r."permanentAddressId"
JOIN "RenewalAddressesAndContactDetails" rs ON rs.id = r."presentAddressId"
WHERE fp."addressLine" IS DISTINCT FROM fs."addressLine"
  AND rp."addressLine" IS NOT DISTINCT FROM rs."addressLine"
ORDER BY r.id;

-- -----------------------------------------------------------------------------
-- 5. Detail: open drafts whose identity differs from the license.
--    No action needed: the fixed backend overwrites these on the next save.
-- -----------------------------------------------------------------------------
SELECT r.id AS renewal_id, r."licenseId" AS license_id, r."licenseNumber", r."updatedAt"
FROM "RenewalFormPersonalDetails" r
JOIN "Licenses" l ON l.id = r."licenseId"
WHERE COALESCE(r."isSubmit", false) = false
  AND (
       r."firstName" IS DISTINCT FROM l."firstName"
    OR r."lastName" IS DISTINCT FROM l."lastName"
    OR r."parentOrSpouseName" IS DISTINCT FROM l."parentOrSpouseName"
    OR (l."aadharNumber" IS NOT NULL AND r."aadharNumber" IS DISTINCT FROM l."aadharNumber")
    OR (l."dateOfBirth" IS NOT NULL AND r."dateOfBirth"::date IS DISTINCT FROM l."dateOfBirth"::date)
  )
ORDER BY r."updatedAt" DESC;

ROLLBACK;
