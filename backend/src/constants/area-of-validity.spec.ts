import { AREA_OF_VALIDITY, normalizeAreaOfValidity } from './area-of-validity';

describe('area of validity', () => {
  describe('normalizeAreaOfValidity', () => {
    it.each([
      ['District-wide', AREA_OF_VALIDITY.DISTRICT],
      ['State-wide', AREA_OF_VALIDITY.STATE],
      ['Throughout India', AREA_OF_VALIDITY.INDIA],
      ['DISTRICT', AREA_OF_VALIDITY.DISTRICT],
      ['STATE', AREA_OF_VALIDITY.STATE],
      ['INDIA', AREA_OF_VALIDITY.INDIA],
      ['Within district boundaries', AREA_OF_VALIDITY.DISTRICT],
      // Legacy multi-select renewal values resolve to the widest area ticked
      ['DISTRICT, STATE', AREA_OF_VALIDITY.STATE],
      ['DISTRICT, STATE, INDIA', AREA_OF_VALIDITY.INDIA],
      ['District-wide, Throughout India', AREA_OF_VALIDITY.INDIA],
    ])('%s -> %s', (raw, expected) => {
      expect(normalizeAreaOfValidity(raw)).toBe(expected);
    });

    it.each([undefined, null, '', '   ', 'somewhere'])('returns null for %p', (raw) => {
      expect(normalizeAreaOfValidity(raw as any)).toBeNull();
    });
  });
});
