import { afterEach, describe, expect, it, vi } from 'vitest';

import { REMINDER_PLAN_DAYS } from './constants';
import { planReminders, type ReminderPlanInput } from './reminders';

// 10:00 del 23-09-2026 en Bolivia.
const MORNING = new Date('2026-09-23T14:00:00Z');

function plan(overrides: Partial<ReminderPlanInput> = {}) {
  return planReminders({
    settings: { enabled: true, dailyReminderTime: '08:00', streakRiskReminderTime: '21:00' },
    now: MORNING,
    isTodayGoalMet: false,
    hasHabitsToday: true,
    ...overrides,
  });
}

describe('planReminders', () => {
  it('plans nothing when reminders are disabled', () => {
    expect(
      plan({
        settings: { enabled: false, dailyReminderTime: '08:00', streakRiskReminderTime: '21:00' },
      }),
    ).toEqual([]);
  });

  it('plans both reminders for every day of the window, sorted by time', () => {
    const reminders = plan();
    const times = reminders.map((reminder) => reminder.fireAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    // El diario de hoy (08:00) ya pasó.
    expect(reminders).toHaveLength(REMINDER_PLAN_DAYS * 2 - 1);
    expect(reminders.at(-1)).toMatchObject({ kind: 'streak_risk', dateKey: '2026-10-22' });
  });

  it('converts the configured Bolivia times into exact instants', () => {
    const [first, second, third] = plan();
    expect(first).toEqual({
      id: 'streak_risk-2026-09-23',
      kind: 'streak_risk',
      dateKey: '2026-09-23',
      fireAt: new Date('2026-09-24T01:00:00Z'),
    });
    expect(second).toEqual({
      id: 'daily-2026-09-24',
      kind: 'daily',
      dateKey: '2026-09-24',
      fireAt: new Date('2026-09-24T12:00:00Z'),
    });
    expect(third).toMatchObject({ id: 'streak_risk-2026-09-24' });
  });

  it('includes today reminders that are still ahead', () => {
    const reminders = plan({ now: new Date('2026-09-23T11:00:00Z') }); // 07:00
    expect(reminders.slice(0, 2).map((reminder) => reminder.id)).toEqual([
      'daily-2026-09-23',
      'streak_risk-2026-09-23',
    ]);
    expect(reminders).toHaveLength(REMINDER_PLAN_DAYS * 2);
  });

  it('skips a reminder whose time is exactly now', () => {
    const reminders = plan({ now: new Date('2026-09-24T01:00:00Z') }); // 21:00
    expect(reminders[0]).toMatchObject({ id: 'daily-2026-09-24' });
  });

  it('cancels only today streak risk reminder once the goal is met', () => {
    const ids = plan({ isTodayGoalMet: true }).map((reminder) => reminder.id);
    expect(ids).not.toContain('streak_risk-2026-09-23');
    expect(ids).toContain('streak_risk-2026-09-24');
    expect(ids[0]).toBe('daily-2026-09-24');
  });

  it('skips today streak risk reminder when no habit is scheduled today', () => {
    const ids = plan({ hasHabitsToday: false }).map((reminder) => reminder.id);
    expect(ids).not.toContain('streak_risk-2026-09-23');
    expect(ids).toContain('streak_risk-2026-09-24');
  });

  it('uses the Bolivia day at 23:59 and moves to the next one at 00:00', () => {
    const beforeMidnight = plan({ now: new Date('2026-09-24T03:59:00Z') }); // 23:59 del 23
    expect(beforeMidnight[0]).toMatchObject({ id: 'daily-2026-09-24' });
    expect(beforeMidnight.at(-1)).toMatchObject({ dateKey: '2026-10-22' });

    const atMidnight = plan({ now: new Date('2026-09-24T04:00:00Z') }); // 00:00 del 24
    expect(atMidnight).toHaveLength(REMINDER_PLAN_DAYS * 2);
    expect(atMidnight.at(-1)).toMatchObject({ dateKey: '2026-10-23' });
  });

  it('plans the same instants when both reminders share the same time', () => {
    const reminders = plan({
      settings: { enabled: true, dailyReminderTime: '21:00', streakRiskReminderTime: '21:00' },
    });
    expect(reminders.slice(0, 2).map((reminder) => reminder.id)).toEqual([
      'daily-2026-09-23',
      'streak_risk-2026-09-23',
    ]);
  });

  describe('with the device in another time zone', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('gives the same plan when the device is in Asia/Tokyo', () => {
      const expected = plan();
      vi.stubEnv('TZ', 'Asia/Tokyo');
      expect(plan()).toEqual(expected);
    });
  });
});
