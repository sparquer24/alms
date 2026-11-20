import { dateToDobInWords } from '../components/forms/freshApplication/PersonalInformation';

describe('dateToDobInWords', () => {
  describe('Specific problematic dates highlighted in requirements', () => {
    test('converts 8th correctly to Eighth (not Eightth)', () => {
      expect(dateToDobInWords('1995-08-08')).toBe('Eighth August One Thousand Nine Hundred Ninety Five');
      expect(dateToDobInWords('2000-01-08')).toBe('Eighth January Two Thousand');
    });

    test('converts 21st correctly to Twenty-First (not First)', () => {
      expect(dateToDobInWords('1990-03-21')).toBe('Twenty-First March One Thousand Nine Hundred Ninety');
      expect(dateToDobInWords('2002-07-21')).toBe('Twenty-First July Two Thousand Two');
    });

    test('converts 22nd correctly to Twenty-Second (not Second)', () => {
      expect(dateToDobInWords('1988-10-22')).toBe('Twenty-Second October One Thousand Nine Hundred Eighty Eight');
      expect(dateToDobInWords('2001-11-22')).toBe('Twenty-Second November Two Thousand One');
    });

    test('converts 23rd correctly to Twenty-Third (not Third)', () => {
      expect(dateToDobInWords('1992-05-23')).toBe('Twenty-Third May One Thousand Nine Hundred Ninety Two');
      expect(dateToDobInWords('2003-09-23')).toBe('Twenty-Third September Two Thousand Three');
    });

    test('converts 28th correctly to Twenty-Eighth (not Twenty-Eightth)', () => {
      expect(dateToDobInWords('1996-02-28')).toBe('Twenty-Eighth February One Thousand Nine Hundred Ninety Six');
      expect(dateToDobInWords('1985-06-28')).toBe('Twenty-Eighth June One Thousand Nine Hundred Eighty Five');
    });

    test('converts 31st correctly to Thirty-First (not First)', () => {
      expect(dateToDobInWords('1997-01-31')).toBe('Thirty-First January One Thousand Nine Hundred Ninety Seven');
      expect(dateToDobInWords('1999-12-31')).toBe('Thirty-First December One Thousand Nine Hundred Ninety Nine');
      expect(dateToDobInWords('2000-03-31')).toBe('Thirty-First March Two Thousand');
    });
  });

  describe('All calendar days (1 to 31)', () => {
    const expectedDays: [number, string][] = [
      [1, 'First'],
      [2, 'Second'],
      [3, 'Third'],
      [4, 'Fourth'],
      [5, 'Fifth'],
      [6, 'Sixth'],
      [7, 'Seventh'],
      [8, 'Eighth'],
      [9, 'Ninth'],
      [10, 'Tenth'],
      [11, 'Eleventh'],
      [12, 'Twelfth'],
      [13, 'Thirteenth'],
      [14, 'Fourteenth'],
      [15, 'Fifteenth'],
      [16, 'Sixteenth'],
      [17, 'Seventeenth'],
      [18, 'Eighteenth'],
      [19, 'Nineteenth'],
      [20, 'Twentieth'],
      [21, 'Twenty-First'],
      [22, 'Twenty-Second'],
      [23, 'Twenty-Third'],
      [24, 'Twenty-Fourth'],
      [25, 'Twenty-Fifth'],
      [26, 'Twenty-Sixth'],
      [27, 'Twenty-Seventh'],
      [28, 'Twenty-Eighth'],
      [29, 'Twenty-Ninth'],
      [30, 'Thirtieth'],
      [31, 'Thirty-First'],
    ];

    test.each(expectedDays)('converts day %i to %s', (dayNum, expectedWord) => {
      const paddedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      // Use January 2000 for days 1-31
      const result = dateToDobInWords(`2000-01-${paddedDay}`);
      expect(result).toBe(`${expectedWord} January Two Thousand`);
    });
  });

  describe('Different months and leap years', () => {
    test('handles all 12 months correctly', () => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      monthNames.forEach((monthName, idx) => {
        const paddedMonth = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
        const result = dateToDobInWords(`1995-${paddedMonth}-15`);
        expect(result).toBe(`Fifteenth ${monthName} One Thousand Nine Hundred Ninety Five`);
      });
    });

    test('handles leap year leap day (February 29 in leap year)', () => {
      expect(dateToDobInWords('2000-02-29')).toBe('Twenty-Ninth February Two Thousand');
      expect(dateToDobInWords('2004-02-29')).toBe('Twenty-Ninth February Two Thousand Four');
      expect(dateToDobInWords('1996-02-29')).toBe('Twenty-Ninth February One Thousand Nine Hundred Ninety Six');
    });

    test('rejects February 29 in non-leap year', () => {
      expect(dateToDobInWords('2001-02-29')).toBe('');
      expect(dateToDobInWords('1999-02-29')).toBe('');
      expect(dateToDobInWords('1900-02-29')).toBe('');
    });

    test('rejects 31st for 30-day months', () => {
      expect(dateToDobInWords('1995-04-31')).toBe(''); // April has 30 days
      expect(dateToDobInWords('1995-06-31')).toBe(''); // June has 30 days
      expect(dateToDobInWords('1995-09-31')).toBe(''); // September has 30 days
      expect(dateToDobInWords('1995-11-31')).toBe(''); // November has 30 days
    });

    test('handles invalid inputs gracefully', () => {
      expect(dateToDobInWords('')).toBe('');
      expect(dateToDobInWords('invalid-date')).toBe('');
      expect(dateToDobInWords('2000-13-01')).toBe('');
      expect(dateToDobInWords('2000-00-01')).toBe('');
      expect(dateToDobInWords('2000-01-32')).toBe('');
    });
  });
});
