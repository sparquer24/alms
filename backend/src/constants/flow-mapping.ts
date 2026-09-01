import { BadRequestException } from '@nestjs/common';
import { RoleFlowApplicationType } from '@prisma/client';

/**
 * Shared application-type helpers for the flow-mapping and hierarchy APIs.
 */

/** Canonical flow-mapping application types. */
export const ROLE_FLOW_APPLICATION_TYPES: readonly RoleFlowApplicationType[] = [
  'ALL',
  'FRESH',
  'RENEWAL',
  'CANCEL',
];

/**
 * Legacy form names accepted by the hierarchy/flow-mapping APIs, mapped to the
 * canonical RoleFlowApplicationType. Kept so callers can send either the enum
 * value (e.g. "RENEWAL") or the form/table name (e.g. "RenewalApplicationForm").
 */
const APPLICATION_TYPE_ALIASES: Record<string, RoleFlowApplicationType> = {
  RENEWALAPPLICATIONFORM: 'RENEWAL',
  RENEWALAPPLICATION: 'RENEWAL',
  RENEWALFORM: 'RENEWAL',
  RENEWALLICENSE: 'RENEWAL',
  RENEWALLICENSEAPPLICATIONFORM: 'RENEWAL',
  FRESHAPPLICATION: 'FRESH',
  FRESHAPPLICATIONFORM: 'FRESH',
  FRESHLICENSE: 'FRESH',
  FRESHLICENSEAPPLICATIONFORM: 'FRESH',
  CANCELAPPLICATION: 'CANCEL',
  CANCELFORM: 'CANCEL',
  CANCELFORMREQUEST: 'CANCEL',
  CANCELREQUEST: 'CANCEL',
  CANCELLATION: 'CANCEL',
};

/**
 * Normalize any supported application-type input (canonical enum values such as
 * "RENEWAL", or legacy form names such as "RenewalApplicationForm") to the
 * internal RoleFlowApplicationType. Case-insensitive and whitespace-tolerant.
 * Defaults to ALL when absent; throws BadRequestException for unrecognized values.
 */
export function normalizeApplicationType(value: any): RoleFlowApplicationType {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized) return 'ALL';

  const alias = APPLICATION_TYPE_ALIASES[normalized];
  if (alias) return alias;

  if ((ROLE_FLOW_APPLICATION_TYPES as readonly string[]).includes(normalized)) {
    return normalized as RoleFlowApplicationType;
  }

  throw new BadRequestException(
    `Invalid applicationType: "${value}". Valid values are: ${ROLE_FLOW_APPLICATION_TYPES.join(', ')}`,
  );
}

/** Application table/flow type used by the users-in-hierarchy endpoint. */
export type HierarchyApplicationType = 'fresh' | 'renewal' | 'cancel';

/**
 * Normalize an application-type value for hierarchy resolution.
 * Unknown or absent values resolve to 'fresh' (legacy behavior of the
 * users-in-hierarchy endpoint), while canonical and legacy renewal/cancel
 * values resolve to their respective types.
 */
export function normalizeHierarchyApplicationType(value?: string): HierarchyApplicationType {
  let appType: RoleFlowApplicationType;
  try {
    appType = normalizeApplicationType(value ?? 'FRESH');
  } catch {
    return 'fresh';
  }

  if (appType === 'RENEWAL') return 'renewal';
  if (appType === 'CANCEL') return 'cancel';
  return 'fresh';
}

/** Query context shared by the flow-mapping lookup endpoints. */
export interface FlowMappingContext {
  applicationType?: string;
  stateId?: number | null;
  districtId?: number | null;
}
