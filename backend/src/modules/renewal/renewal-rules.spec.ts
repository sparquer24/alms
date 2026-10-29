import {
  buildRenewalLocks,
  computeRenewedValidTill,
  pickLockedIdentity,
  statusAfterRenewal,
} from './renewal-rules';

describe('renewal rules', () => {
  const now = new Date('2026-09-28T00:00:00.000Z');

  describe('computeRenewedValidTill', () => {
    it('extends from the current expiry when renewed early', () => {
      const result = computeRenewedValidTill(new Date('2027-03-01T00:00:00.000Z'), now);
      expect(result.toISOString()).toBe('2029-03-01T00:00:00.000Z');
    });

    it('runs from the approval date when renewed after expiry', () => {
      const result = computeRenewedValidTill(new Date('2025-01-01T00:00:00.000Z'), now);
      expect(result.toISOString()).toBe('2028-09-28T00:00:00.000Z');
    });

    it('runs from the approval date when the license has no expiry', () => {
      expect(computeRenewedValidTill(null, now).toISOString()).toBe('2028-09-28T00:00:00.000Z');
    });
  });

  describe('statusAfterRenewal', () => {
    it.each([
      ['ACTIVE', 'ACTIVE'],
      ['EXPIRED', 'ACTIVE'],
      ['SUSPENDED', 'SUSPENDED'],
      ['REVOKED', 'REVOKED'],
      ['CANCELLED', 'CANCELLED'],
    ])('%s -> %s', (current, expected) => {
      expect(statusAfterRenewal(current)).toBe(expected);
    });
  });

  describe('locks', () => {
    it('locks only identity values the license holds', () => {
      const identity = pickLockedIdentity({
        firstName: 'Ravi',
        middleName: null,
        lastName: 'Kumar',
        panNumber: '  ',
        aadharNumber: '123456789012',
      });
      expect(identity).toEqual({ firstName: 'Ravi', lastName: 'Kumar', aadharNumber: '123456789012' });
    });

    it('locks endorsed weapons and arms category', () => {
      const locks = buildRenewalLocks({ armsCategory: 'RESTRICTED', endorsedWeapons: [{ id: 3 }, { id: 5 }] });
      expect(locks.weaponIds).toEqual([3, 5]);
      expect(locks.armsCategory).toBe('RESTRICTED');
    });

    it('locks nothing without a license', () => {
      expect(buildRenewalLocks(null)).toEqual({ identity: {}, weaponIds: [], armsCategory: null });
    });
  });
});
