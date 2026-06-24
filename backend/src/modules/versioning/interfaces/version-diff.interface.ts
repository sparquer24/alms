// ─── interfaces/version-diff.interface.ts ───────────────────────────────────
// Shape of the diff output when comparing two version snapshots

export interface FieldDiff {
  field: string;         // e.g. 'personalDetails.firstName'
  label: string;         // Human-readable label e.g. 'First Name'
  fromValue: unknown;    // Value at the fromVersion
  toValue: unknown;      // Value at the toVersion
  section: string;       // e.g. 'Personal Details', 'Address', 'Occupation'
}

export interface VersionDiffResult {
  applicationId: number;
  applicationType: string;
  fromVersionNumber: number;
  toVersionNumber: number;
  changedFields: FieldDiff[];
  totalChanges: number;
}
