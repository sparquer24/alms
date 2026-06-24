// ─── types/revert.ts ────────────────────────────────────────────────────────
// TypeScript types for all revert/versioning API responses used in the frontend.

export type ApplicationType = 'FRESH' | 'RENEWAL';

// ─── Version History ────────────────────────────────────────────────────────

export interface VersionListItem {
  id: number;
  versionNumber: number;
  triggerAction: string;     // e.g. 'FORWARD', 'APPROVE', 'REVERT', 'SUBMIT'
  createdAt: string;         // ISO date string
  workflowStatusId: number;
  currentUserId: number;
  previousUserId: number | null;
  actionByUserId: number;
  actionByRoleId: number;
  actionByUser: {
    id: number;
    username: string;
    roleId: number;
  };
  actionByRole: {
    id: number;
    name: string;
    code: string;
  };
}

export interface VersionHistory {
  versions: VersionListItem[];
  totalCount: number;
}

// ─── Version Snapshot (full data) ───────────────────────────────────────────

export interface VersionSnapshot extends VersionListItem {
  snapshotData: {
    personalDetails: Record<string, unknown>;
    presentAddress?: Record<string, unknown>;
    permanentAddress?: Record<string, unknown>;
    occupation?: Record<string, unknown>;
    criminalHistories: Record<string, unknown>[];
    licenseHistories: Record<string, unknown>[];
    licenseDetails: Record<string, unknown>[];
    fileUploads: Record<string, unknown>[];
  };
}

// ─── Revert Validation ───────────────────────────────────────────────────────

export interface RevertValidation {
  canRevert: boolean;
  blockers: string[];
  isTerminalRevert: boolean;
  requiresEscalation: boolean;
  targetVersion?: {
    versionNumber: number;
    triggerAction: string;
    createdAt: string;
    workflowStatusId: number;
    currentUserId: number;
  };
}

// ─── Revert Request / Response ──────────────────────────────────────────────

export interface RevertRequest {
  applicationType: ApplicationType;
  targetVersionNumber: number;
  reason: string;
  escalationDocumentUrl?: string;
  expectedCurrentVersion?: number;
}

export interface RevertResult {
  success: boolean;
  newVersionNumber: number;
  fromVersionNumber: number;
  toVersionNumber: number;
  message: string;
  applicationId: number;
  applicationType: ApplicationType;
}

// ─── Diff/Compare ────────────────────────────────────────────────────────────

export interface FieldDiff {
  field: string;
  label: string;
  fromValue: unknown;
  toValue: unknown;
  section: string;
}

export interface VersionDiff {
  applicationId: number;
  applicationType: ApplicationType;
  fromVersionNumber: number;
  toVersionNumber: number;
  changedFields: FieldDiff[];
  totalChanges: number;
}

// ─── Revert Audit Log ────────────────────────────────────────────────────────

export interface RevertAuditLog {
  id: number;
  applicationId: number;
  applicationType: ApplicationType;
  fromVersionNumber: number;
  toVersionNumber: number;
  newVersionNumber: number;
  revertedByUserId: number;
  revertedByRoleId: number;
  originalActionByUserId?: number;
  reason: string;
  revertedAt: string;         // ISO date string
  fromStatusId: number;
  toStatusId: number;
  isTerminalRevert: boolean;
  escalationDocumentUrl?: string;
  ipAddress?: string;
  revertedByUser: { id: number; username: string };
  revertedByRole: { id: number; name: string; code: string };
}

export interface RevertAuditLogPage {
  logs: RevertAuditLog[];
  totalCount: number;
  page: number;
  limit: number;
}
