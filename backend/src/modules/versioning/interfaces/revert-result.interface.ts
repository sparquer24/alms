// ─── interfaces/revert-result.interface.ts ──────────────────────────────────
// Return type shapes for revert service operations

export interface RevertValidationResult {
  canRevert: boolean;
  blockers: string[];
  isTerminalRevert: boolean;
  requiresEscalation: boolean;
  targetVersion?: {
    versionNumber: number;
    triggerAction: string;
    createdAt: Date;
    workflowStatusId: number;
    currentUserId: number;
  };
}

export interface RevertExecutionResult {
  success: boolean;
  newVersionNumber: number;
  fromVersionNumber: number;
  toVersionNumber: number;
  message: string;
  applicationId: number;
  applicationType: string;
}
