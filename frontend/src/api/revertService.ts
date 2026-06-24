// ─── api/revertService.ts ───────────────────────────────────────────────────
// All Axios calls for the versioning / revert API.
// Uses the same cookie-based token strategy as axiosConfig.ts (auth cookie → JSON → .token).

import axios from 'axios';
import jsCookie from 'js-cookie';
import {
  ApplicationType, VersionHistory, VersionSnapshot, RevertValidation,
  RevertRequest, RevertResult, VersionDiff, RevertAuditLog, RevertAuditLogPage,
} from '../types/revert';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

/** Reads the JWT token from the 'auth' cookie — same as axiosConfig.ts */
function getToken(): string {
  try {
    const authCookie = jsCookie.get('auth');
    if (!authCookie) return '';
    try {
      const parsed = JSON.parse(authCookie);
      return parsed.token || parsed.accessToken || parsed.authToken || authCookie;
    } catch {
      return authCookie; // raw token string
    }
  } catch {
    return '';
  }
}

/** Returns an Axios instance with the current Bearer token from the auth cookie */
function getClient() {
  const token = getToken();
  return axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Version History ────────────────────────────────────────────────────────

/**
 * Fetch the full version timeline for an application (latest first).
 * GET /api/versions/:applicationId?applicationType=FRESH
 */
export async function getVersionHistory(
  applicationId: number,
  applicationType: ApplicationType,
): Promise<VersionHistory> {
  const { data } = await getClient().get(`/versions/${applicationId}`, {
    params: { applicationType },
  });
  return data.data;
}

/**
 * Get the full snapshot data for a specific version.
 * GET /api/versions/:applicationId/:versionNumber?applicationType=FRESH
 */
export async function getVersionSnapshot(
  applicationId: number,
  versionNumber: number,
  applicationType: ApplicationType,
): Promise<VersionSnapshot> {
  const { data } = await getClient().get(`/versions/${applicationId}/${versionNumber}`, {
    params: { applicationType },
  });
  return data.data;
}

/**
 * Compare two versions field-by-field.
 * GET /api/versions/:applicationId/compare/diff?applicationType=FRESH&fromVersion=2&toVersion=4
 */
export async function compareVersions(
  applicationId: number,
  applicationType: ApplicationType,
  fromVersion: number,
  toVersion: number,
): Promise<VersionDiff> {
  const { data } = await getClient().get(`/versions/${applicationId}/compare/diff`, {
    params: { applicationType, fromVersion, toVersion },
  });
  return data.data;
}

// ─── Revert ─────────────────────────────────────────────────────────────────

/**
 * Pre-validate a revert before showing confirmation modal.
 * GET /api/versions/:applicationId/revert/validate
 */
export async function validateRevert(
  applicationId: number,
  applicationType: ApplicationType,
  targetVersionNumber: number,
): Promise<RevertValidation> {
  const { data } = await getClient().get(`/versions/${applicationId}/revert/validate`, {
    params: { applicationType, targetVersionNumber },
  });
  return data.data;
}

/**
 * Execute a revert.
 * POST /api/versions/:applicationId/revert
 */
export async function executeRevert(
  applicationId: number,
  payload: RevertRequest,
): Promise<RevertResult> {
  const { data } = await getClient().post(`/versions/${applicationId}/revert`, payload);
  return data.data;
}

// ─── Audit Logs (Admin) ─────────────────────────────────────────────────────

/**
 * List all revert audit logs (admin/super-admin use).
 * GET /api/versions/audit/logs
 */
export async function getRevertAuditLogs(filters?: {
  applicationType?: ApplicationType;
  revertedByUserId?: number;
  isTerminalRevert?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<RevertAuditLogPage> {
  const { data } = await getClient().get('/versions/audit/logs', { params: filters });
  return data.data;
}

/**
 * Get all revert audit logs for a specific application.
 * GET /api/versions/audit/logs/:applicationId
 */
export async function getApplicationRevertLogs(
  applicationId: number,
  applicationType: ApplicationType,
): Promise<RevertAuditLog[]> {
  const { data } = await getClient().get(`/versions/audit/logs/${applicationId}`, {
    params: { applicationType },
  });
  return data.data;
}
