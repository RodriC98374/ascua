import { describe, expect, it } from 'vitest';

import { formatTimeLeft, streakRiskAt, type StreakRiskInput } from './streak-risk';

// Bolivia es UTC-4: las 21:00 del 23-09-2026 son la 01:00 UTC del 24.
const AT_RISK_TIME = new Date('2026-09-24T01:00:00Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function risk(overrides: Partial<StreakRiskInput> = {}) {
  return streakRiskAt({
    now: AT_RISK_TIME,
    riskTime: '21:00',
    isGoalMet: false,
    hasPrimaries: true,
    currentStreak: 12,
    streakFreezesAvailable: 0,
    ...overrides,
  });
}

describe('streakRiskAt', () => {
  it('shows nothing once the goal is met', () => {
    expect(risk({ isGoalMet: true })).toBeNull();
  });

  it('shows nothing when there are no primary habits today', () => {
    expect(risk({ hasPrimaries: false })).toBeNull();
  });

  it('shows nothing before the streak risk time in Bolivia', () => {
    expect(risk({ now: new Date(AT_RISK_TIME.getTime() - 1000) })).toBeNull();
  });

  it('counts down to the Bolivia midnight from the risk time on', () => {
    expect(risk()).toEqual({ kind: 'save', msLeft: 3 * HOUR });
  });

  it('uses the configured time, not a fixed one', () => {
    const at1830 = new Date('2026-09-23T22:30:00Z');
    expect(risk({ now: at1830, riskTime: '18:30' })).toEqual({
      kind: 'save',
      msLeft: 5 * HOUR + 30 * MINUTE,
    });
    expect(risk({ now: at1830, riskTime: '19:00' })).toBeNull();
  });

  it('keeps counting until the last minute of the day', () => {
    const at2359 = new Date('2026-09-24T03:59:00Z');
    expect(risk({ now: at2359 })?.msLeft).toBe(MINUTE);
  });

  it('says a freeze will be used when the streak is alive and one is available', () => {
    expect(risk({ streakFreezesAvailable: 1 })?.kind).toBe('freeze');
  });

  it('invites to start the streak when there is none to lose, even with freezes', () => {
    expect(risk({ currentStreak: 0, streakFreezesAvailable: 2 })?.kind).toBe('start');
  });
});

describe('formatTimeLeft', () => {
  it.each([
    [2 * HOUR + 35 * MINUTE, '2 h 35 min'],
    [2 * HOUR + 35 * MINUTE + 59 * 1000, '2 h 35 min'],
    [3 * HOUR, '3 h'],
    [35 * MINUTE, '35 min'],
    [MINUTE, '1 min'],
    [59 * 1000, 'menos de 1 min'],
    [0, 'menos de 1 min'],
  ])('formats %d ms as "%s"', (ms, expected) => {
    expect(formatTimeLeft(ms)).toBe(expected);
  });
});
