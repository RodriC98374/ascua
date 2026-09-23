import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addDays,
  dateKeyRange,
  daysBetween,
  isValidDateKey,
  msUntilNextDay,
  pendingDateKeysToClose,
  startOfWeek,
  toBoliviaIsoString,
  toDateKey,
  toInstant,
  toMonthKey,
  todayDateKey,
} from './dates';

describe('toDateKey', () => {
  it('returns the Bolivia calendar day for an instant', () => {
    expect(toDateKey(new Date('2026-09-21T15:00:00Z'))).toBe('2026-09-21');
  });

  it('still belongs to the previous day at 23:59 Bolivia (03:59 UTC)', () => {
    expect(toDateKey(new Date('2026-09-22T03:59:59Z'))).toBe('2026-09-21');
  });

  it('switches to the new day exactly at 00:00 Bolivia (04:00 UTC)', () => {
    expect(toDateKey(new Date('2026-09-22T04:00:00Z'))).toBe('2026-09-22');
  });

  it('handles the new year boundary', () => {
    expect(toDateKey(new Date('2027-01-01T03:59:59Z'))).toBe('2026-12-31');
    expect(toDateKey(new Date('2027-01-01T04:00:00Z'))).toBe('2027-01-01');
  });

  describe('with the machine in another time zone', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('gives the same result when the machine is in Asia/Tokyo', () => {
      vi.stubEnv('TZ', 'Asia/Tokyo');
      const instant = new Date('2026-09-22T03:30:00Z');
      // Sanity check: in Tokyo this instant is already the 22nd.
      expect(instant.getDate()).toBe(22);
      expect(toDateKey(instant)).toBe('2026-09-21');
    });
  });
});

describe('todayDateKey', () => {
  it('uses the given instant', () => {
    expect(todayDateKey(new Date('2026-09-22T02:00:00Z'))).toBe('2026-09-21');
  });

  it('defaults to the current instant', () => {
    expect(todayDateKey()).toBe(toDateKey(new Date()));
  });
});

describe('toMonthKey', () => {
  it('extracts the month of a date key', () => {
    expect(toMonthKey('2026-09-21')).toBe('2026-09');
  });
});

describe('addDays', () => {
  it('moves forward and backward', () => {
    expect(addDays('2026-09-21', 1)).toBe('2026-09-22');
    expect(addDays('2026-09-21', -1)).toBe('2026-09-20');
    expect(addDays('2026-09-21', 0)).toBe('2026-09-21');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('respects leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });
});

describe('daysBetween', () => {
  it('counts calendar days from a to b', () => {
    expect(daysBetween('2026-09-21', '2026-09-21')).toBe(0);
    expect(daysBetween('2026-09-21', '2026-09-24')).toBe(3);
    expect(daysBetween('2026-09-24', '2026-09-21')).toBe(-3);
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
  });
});

describe('startOfWeek', () => {
  it('returns the Monday of the week', () => {
    // 21-09-2026 es lunes.
    expect(startOfWeek('2026-09-21')).toBe('2026-09-21');
    expect(startOfWeek('2026-09-24')).toBe('2026-09-21');
  });

  it('treats Sunday as the last day of the week', () => {
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21');
  });
});

describe('isValidDateKey', () => {
  it('accepts real dates in YYYY-MM-DD format', () => {
    expect(isValidDateKey('2026-09-21')).toBe(true);
    expect(isValidDateKey('2028-02-29')).toBe(true);
  });

  it('rejects malformed or impossible dates', () => {
    expect(isValidDateKey('2026-9-21')).toBe(false);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2027-02-29')).toBe(false);
    expect(isValidDateKey('21-09-2026')).toBe(false);
    expect(isValidDateKey('')).toBe(false);
  });
});

describe('dateKeyRange', () => {
  it('lists every day between from and to, inclusive', () => {
    expect(dateKeyRange('2026-09-29', '2026-10-02')).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
  });

  it('returns an empty list when from is after to', () => {
    expect(dateKeyRange('2026-09-22', '2026-09-21')).toEqual([]);
  });
});

describe('pendingDateKeysToClose', () => {
  it('lists the days after the last closed one, up to yesterday', () => {
    expect(pendingDateKeysToClose('2026-09-18', '2026-09-21')).toEqual([
      '2026-09-19',
      '2026-09-20',
    ]);
  });

  it('is empty when yesterday is already closed', () => {
    expect(pendingDateKeysToClose('2026-09-20', '2026-09-21')).toEqual([]);
  });

  it('never includes today', () => {
    expect(pendingDateKeysToClose('2026-09-21', '2026-09-21')).toEqual([]);
  });
});

describe('msUntilNextDay', () => {
  it('counts down to the next midnight in Bolivia', () => {
    expect(msUntilNextDay(new Date('2026-09-21T16:00:00Z'))).toBe(12 * 60 * 60 * 1000); // 12:00
  });

  it('is one minute at 23:59 in Bolivia', () => {
    expect(msUntilNextDay(new Date('2026-09-22T03:59:00Z'))).toBe(60 * 1000);
  });

  it('is a full day right at midnight', () => {
    expect(msUntilNextDay(new Date('2026-09-22T04:00:00Z'))).toBe(24 * 60 * 60 * 1000);
  });

  it('does not depend on the time zone of the device', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(msUntilNextDay(new Date('2026-09-22T03:59:30.500Z'))).toBe(29_500);
    vi.unstubAllEnvs();
  });
});

describe('toBoliviaIsoString', () => {
  it('writes the instant in Bolivia time with its offset', () => {
    expect(toBoliviaIsoString(new Date('2026-09-23T14:05:09.123Z'))).toBe(
      '2026-09-23T10:05:09.123-04:00',
    );
  });

  it('handles the midnight edges of Bolivia', () => {
    expect(toBoliviaIsoString(new Date('2026-09-22T03:59:59.999Z'))).toBe(
      '2026-09-21T23:59:59.999-04:00',
    );
    expect(toBoliviaIsoString(new Date('2026-09-22T04:00:00Z'))).toBe(
      '2026-09-22T00:00:00.000-04:00',
    );
  });

  it('points to the same instant', () => {
    const instant = new Date('2027-01-01T03:30:00.500Z');
    expect(new Date(toBoliviaIsoString(instant)).getTime()).toBe(instant.getTime());
  });

  it('does not depend on the time zone of the device', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(toBoliviaIsoString(new Date('2026-09-23T14:05:09.123Z'))).toBe(
      '2026-09-23T10:05:09.123-04:00',
    );
    vi.unstubAllEnvs();
  });
});

describe('toInstant', () => {
  it('returns the instant at which Bolivia shows that day and time', () => {
    expect(toInstant('2026-09-23', '08:00').toISOString()).toBe('2026-09-23T12:00:00.000Z');
  });

  it('falls on the next UTC day for evening times', () => {
    expect(toInstant('2026-09-23', '21:30').toISOString()).toBe('2026-09-24T01:30:00.000Z');
  });

  it('handles the midnight edges of Bolivia', () => {
    expect(toInstant('2026-09-22', '00:00').toISOString()).toBe('2026-09-22T04:00:00.000Z');
    expect(toInstant('2026-09-21', '23:59').toISOString()).toBe('2026-09-22T03:59:00.000Z');
  });

  it('handles the new year boundary', () => {
    expect(toInstant('2026-12-31', '23:00').toISOString()).toBe('2027-01-01T03:00:00.000Z');
  });

  it('round-trips with toDateKey', () => {
    expect(toDateKey(toInstant('2026-09-21', '23:59'))).toBe('2026-09-21');
    expect(toDateKey(toInstant('2026-09-22', '00:00'))).toBe('2026-09-22');
  });

  it('does not depend on the time zone of the device', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(toInstant('2026-09-23', '08:00').toISOString()).toBe('2026-09-23T12:00:00.000Z');
    vi.unstubAllEnvs();
  });
});
