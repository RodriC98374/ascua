import { describe, expect, it } from 'vitest';

import {
  addCheckIn,
  averageCheckIns,
  CHECK_IN_DIMENSIONS,
  checkInAverages,
  isCheckInValue,
  mergeCheckInStats,
  toCheckIn,
} from './check-in';

describe('CHECK_IN_DIMENSIONS', () => {
  it('asks for mood, energy and motivation, in that order', () => {
    expect(CHECK_IN_DIMENSIONS).toEqual(['mood', 'energy', 'motivation']);
  });
});

describe('isCheckInValue', () => {
  it('accepts whole numbers from 1 to 5', () => {
    expect([1, 2, 3, 4, 5].every(isCheckInValue)).toBe(true);
  });

  it('rejects anything else', () => {
    expect([0, 6, 2.5, -1, Number.NaN].some(isCheckInValue)).toBe(false);
    expect(isCheckInValue('3')).toBe(false);
    expect(isCheckInValue(null)).toBe(false);
  });
});

describe('toCheckIn', () => {
  it('keeps only the known scales with valid values', () => {
    expect(toCheckIn({ mood: 4, energy: 9, focus: 3, motivation: 2 })).toEqual({
      mood: 4,
      motivation: 2,
    });
  });

  it('reads anything that is not a map as an empty check-in', () => {
    expect(toCheckIn(undefined)).toEqual({});
    expect(toCheckIn(null)).toEqual({});
    expect(toCheckIn('4')).toEqual({});
  });
});

describe('addCheckIn', () => {
  it('adds each answered scale to its total and days', () => {
    const stats = addCheckIn({ mood: { days: 2, total: 7 } }, { mood: 5, energy: 2 });
    expect(stats).toEqual({ mood: { days: 3, total: 12 }, energy: { days: 1, total: 2 } });
  });

  it('leaves the stats as they were without a check-in', () => {
    const before = { mood: { days: 1, total: 3 } };
    expect(addCheckIn(before, undefined)).toEqual(before);
    expect(addCheckIn(before, {})).toEqual(before);
  });

  it('does not mutate the stats it receives', () => {
    const before = { mood: { days: 1, total: 3 } };
    addCheckIn(before, { mood: 4 });
    expect(before).toEqual({ mood: { days: 1, total: 3 } });
  });
});

describe('mergeCheckInStats', () => {
  it('adds the totals and days of both periods', () => {
    expect(
      mergeCheckInStats(
        { mood: { days: 30, total: 100 }, energy: { days: 10, total: 30 } },
        { mood: { days: 5, total: 20 }, motivation: { days: 2, total: 9 } },
      ),
    ).toEqual({
      mood: { days: 35, total: 120 },
      energy: { days: 10, total: 30 },
      motivation: { days: 2, total: 9 },
    });
  });
});

describe('checkInAverages', () => {
  it('averages each scale over the days it was answered, null without answers', () => {
    expect(checkInAverages({ mood: { days: 4, total: 14 }, energy: { days: 0, total: 0 } })).toEqual(
      { mood: 3.5, energy: null, motivation: null },
    );
  });
});

describe('averageCheckIns', () => {
  it('averages the answers of several days, scale by scale', () => {
    expect(averageCheckIns([{ mood: 4, energy: 2 }, { mood: 2 }, {}])).toEqual({
      mood: 3,
      energy: 2,
      motivation: null,
    });
  });
});
