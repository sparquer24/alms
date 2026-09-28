/// <reference types="node" />
/**
 * Seeds the Permissions catalog table from the permission keys that were
 * previously hardcoded (and drifting) across three separate frontend files:
 * PermissionMatrix.tsx, app/admin/permissions/page.tsx and app/admin/roles/page.tsx.
 * This becomes the single source of truth those UIs now read from.
 *
 * Idempotent: upserts by `key`, safe to re-run. Existing rows are left as-is
 * (only missing keys are inserted) so any edits made via the admin UI after
 * the initial seed are never overwritten.
 *
 * Usage:
 *   npx ts-node prisma/seed-permissions.ts            # dry run
 *   npx ts-node prisma/seed-permissions.ts --apply     # writes the changes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS: { key: string; label: string; category: string; description?: string }[] = [
  // Capabilities (role-level flags, mirrored from Roles.can_* columns)
  { key: 'can_forward', label: 'Can Forward Applications', category: 'Capabilities' },
  { key: 'can_FLAF', label: 'Can FLAF (Fresh Form)', category: 'Capabilities' },
  { key: 'can_generate_ground_report', label: 'Can Generate Ground Report', category: 'Capabilities' },
  { key: 'can_re_enquiry', label: 'Can Re-enquiry', category: 'Capabilities' },
  { key: 'can_create_freshLicence', label: 'Can Create Fresh Licence', category: 'Capabilities' },
  { key: 'can_access_settings', label: 'Can Access Settings', category: 'Capabilities' },

  // View Permissions
  { key: 'canViewFreshForm', label: 'View Fresh Forms', category: 'View Permissions', description: 'Ability to view fresh application forms' },
  { key: 'canViewForwarded', label: 'View Forwarded Applications', category: 'View Permissions', description: 'Ability to view applications forwarded to user' },
  { key: 'canViewReturned', label: 'View Returned Applications', category: 'View Permissions', description: 'Ability to view returned applications' },
  { key: 'canViewRedFlagged', label: 'View Red Flagged Applications', category: 'View Permissions', description: 'Ability to view red flagged applications' },
  { key: 'canViewDisposed', label: 'View Disposed Applications', category: 'View Permissions', description: 'Ability to view disposed applications' },
  { key: 'canViewSent', label: 'View Sent Applications', category: 'View Permissions', description: 'Ability to view sent applications' },
  { key: 'canViewApplication', label: 'View Applications', category: 'View Permissions', description: 'Ability to view applications' },
  { key: 'canViewReports', label: 'View Reports', category: 'View Permissions', description: 'Ability to view system reports' },

  // Action Permissions
  { key: 'canSubmitApplication', label: 'Submit Application', category: 'Action Permissions', description: 'Ability to submit new applications' },
  { key: 'canCaptureUIN', label: 'Capture UIN', category: 'Action Permissions', description: 'Ability to capture UIN for applications' },
  { key: 'canCaptureBiometrics', label: 'Capture Biometrics', category: 'Action Permissions', description: 'Ability to capture biometric data' },
  { key: 'canUploadDocuments', label: 'Upload Documents', category: 'Action Permissions', description: 'Ability to upload documents' },
  { key: 'canForwardToACP', label: 'Forward to ACP', category: 'Action Permissions', description: 'Ability to forward applications to ACP' },
  { key: 'canForwardToSHO', label: 'Forward to SHO', category: 'Action Permissions', description: 'Ability to forward applications to SHO' },
  { key: 'canForwardToDCP', label: 'Forward to DCP', category: 'Action Permissions', description: 'Ability to forward applications to DCP' },
  { key: 'canForwardToAS', label: 'Forward to AS', category: 'Action Permissions', description: 'Ability to forward applications to AS' },
  { key: 'canForwardToCP', label: 'Forward to CP', category: 'Action Permissions', description: 'Ability to forward applications to CP' },
  { key: 'canConductEnquiry', label: 'Conduct Enquiry', category: 'Action Permissions', description: 'Ability to conduct enquiries' },
  { key: 'canAddRemarks', label: 'Add Remarks', category: 'Action Permissions', description: 'Ability to add remarks to applications' },
  { key: 'canApproveTA', label: 'Approve TA', category: 'Action Permissions', description: 'Ability to approve TA applications' },
  { key: 'canApproveAI', label: 'Approve AI', category: 'Action Permissions', description: 'Ability to approve AI applications' },
  { key: 'canReject', label: 'Reject Applications', category: 'Action Permissions', description: 'Ability to reject applications' },
  { key: 'canRequestResubmission', label: 'Request Resubmission', category: 'Action Permissions', description: 'Ability to request application resubmission' },
  { key: 'canGeneratePDF', label: 'Generate PDF', category: 'Action Permissions', description: 'Ability to generate PDF documents' },
];

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'Running in APPLY mode — the database will be updated.' : 'Running in DRY-RUN mode — no changes will be written. Pass --apply to write.');

  const existing = await prisma.permissions.findMany({ select: { key: true } });
  const existingKeys = new Set(existing.map((p: { key: string }) => p.key));

  const toInsert = PERMISSIONS.filter((p) => !existingKeys.has(p.key));

  if (toInsert.length === 0) {
    console.log('All permission keys already exist. Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  console.log(`${toInsert.length} permission(s) to insert:`);
  toInsert.forEach((p) => console.log(`  + ${p.key} (${p.category})`));

  if (apply) {
    await prisma.permissions.createMany({ data: toInsert });
    console.log('Done.');
  } else {
    console.log('Dry run complete. Re-run with --apply to write these changes.');
  }
}

main()
  .catch((e) => {
    console.error('Error while seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
