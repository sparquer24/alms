/**
 * Business rules that make a renewal different from a fresh application.
 * A renewal extends the SAME license for the SAME holder and weapons, so it may
 * not change who holds the license or what is endorsed on it. Shared by the
 * renewal form service and the workflow approval step so both apply the same rules.
 */

export const RENEWAL_VALIDITY_YEARS = 2;

/**
 * Identity fields a renewal may not change once the license holds a value.
 * Empty values stay editable so imported licenses can be completed via renewal.
 */
export const LOCKED_IDENTITY_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'parentOrSpouseName',
  'sex',
  'dateOfBirth',
  'placeOfBirth',
  'aadharNumber',
  'panNumber',
] as const;

export type LockedIdentityField = (typeof LOCKED_IDENTITY_FIELDS)[number];

export interface RenewalLocks {
  /** License values that override anything submitted on the renewal. */
  identity: Partial<Record<LockedIdentityField, unknown>>;
  /** Weapons endorsed on the license; empty means the renewal may select them. */
  weaponIds: number[];
  armsCategory: string | null;
}

const hasValue = (value: unknown) =>
  value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '');

export function pickLockedIdentity(license: Record<string, any> | null | undefined): RenewalLocks['identity'] {
  const identity: RenewalLocks['identity'] = {};
  if (!license) return identity;
  for (const field of LOCKED_IDENTITY_FIELDS) {
    if (hasValue(license[field])) identity[field] = license[field];
  }
  return identity;
}

export function buildRenewalLocks(
  license: (Record<string, any> & { endorsedWeapons?: Array<{ id: number }> }) | null | undefined,
): RenewalLocks {
  return {
    identity: pickLockedIdentity(license),
    weaponIds: (license?.endorsedWeapons ?? []).map((weapon) => weapon.id),
    armsCategory: license?.armsCategory ?? null,
  };
}

/**
 * New expiry for a renewed license: an early renewal extends from the current
 * expiry (no remaining time is lost); a late one runs from the approval date.
 */
export function computeRenewedValidTill(currentValidTill: Date | null | undefined, now: Date = new Date()): Date {
  const current = currentValidTill ? new Date(currentValidTill) : null;
  const base = current && current.getTime() > now.getTime() ? current : new Date(now);
  base.setFullYear(base.getFullYear() + RENEWAL_VALIDITY_YEARS);
  return base;
}

/**
 * Renewal reactivates an active or expired license. A suspended, revoked or
 * cancelled license keeps its status — renewal is not a way to lift those.
 */
export function statusAfterRenewal<T extends string>(currentStatus: T): T | 'ACTIVE' {
  return currentStatus === 'ACTIVE' || currentStatus === 'EXPIRED' ? 'ACTIVE' : currentStatus;
}

/** License statuses that cannot start a renewal at all. */
export const NON_RENEWABLE_STATUSES = new Set(['CANCELLED', 'REVOKED']);
