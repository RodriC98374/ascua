import { describe, expect, it } from 'vitest';

import { HABIT_REMINDER_PLAN_DAYS } from './constants';
import {
  isValidHabitReminder,
  planHabitReminders,
  reminderDaysFor,
  type HabitReminderPlanInput,
} from './habit-reminders';
import type { Habit, HabitSchedule } from './types';
import type { WeekLog } from './weekly-habits';

// Miércoles 23-09-2026, 10:00 en Bolivia.
const MORNING = new Date('2026-09-23T14:00:00Z');
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'read',
    name: 'Leer',
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    reminder: { time: '19:30', daysOfWeek: EVERY_DAY },
    ...overrides,
  };
}

function plan(overrides: Partial<HabitReminderPlanInput<Habit>> = {}) {
  return planHabitReminders({
    habits: [habit()],
    now: MORNING,
    enabled: true,
    weekLogs: [],
    ...overrides,
  });
}

const ids = (reminders: { id: string }[]) => reminders.map((reminder) => reminder.id);

describe('reminderDaysFor', () => {
  it('offers every day for daily and weekly habits', () => {
    expect(reminderDaysFor({ type: 'daily' })).toEqual(EVERY_DAY);
    expect(reminderDaysFor({ type: 'times_per_week', timesPerWeek: 3 })).toEqual(EVERY_DAY);
  });

  it('offers only the fixed days of a days-of-week habit, in order', () => {
    expect(reminderDaysFor({ type: 'days_of_week', daysOfWeek: [5, 1, 3] })).toEqual([1, 3, 5]);
  });
});

describe('isValidHabitReminder', () => {
  const daily = { type: 'daily' } as const;

  it('accepts a time with at least one day', () => {
    expect(isValidHabitReminder({ time: '07:05', daysOfWeek: [1] }, daily)).toBe(true);
    expect(isValidHabitReminder({ time: '23:59', daysOfWeek: EVERY_DAY }, daily)).toBe(true);
  });

  it('rejects malformed times', () => {
    for (const time of ['7:05', '24:00', '12:60', '', '12:00:00']) {
      expect(isValidHabitReminder({ time, daysOfWeek: [1] }, daily)).toBe(false);
    }
  });

  it('rejects empty, repeated or out-of-range days', () => {
    expect(isValidHabitReminder({ time: '08:00', daysOfWeek: [] }, daily)).toBe(false);
    expect(isValidHabitReminder({ time: '08:00', daysOfWeek: [1, 1] }, daily)).toBe(false);
    expect(isValidHabitReminder({ time: '08:00', daysOfWeek: [0] }, daily)).toBe(false);
    expect(isValidHabitReminder({ time: '08:00', daysOfWeek: [8] }, daily)).toBe(false);
    expect(isValidHabitReminder({ time: '08:00', daysOfWeek: [1.5] }, daily)).toBe(false);
  });

  it('rejects days that a days-of-week habit does not have', () => {
    const schedule: HabitSchedule = { type: 'days_of_week', daysOfWeek: [1, 3] };
    expect(isValidHabitReminder({ time: '08:00', daysOfWeek: [3] }, schedule)).toBe(true);
    expect(isValidHabitReminder({ time: '08:00', daysOfWeek: [2] }, schedule)).toBe(false);
  });
});

describe('planHabitReminders', () => {
  it('plans nothing when reminders are disabled', () => {
    expect(plan({ enabled: false })).toEqual([]);
  });

  it('plans one reminder per day of the window at the habit time', () => {
    const reminders = plan();
    expect(reminders).toHaveLength(HABIT_REMINDER_PLAN_DAYS);
    expect(reminders[0]).toEqual({
      id: 'habit-read-2026-09-23',
      habit: habit(),
      dateKey: '2026-09-23',
      // 19:30 de Bolivia = 23:30 UTC.
      fireAt: new Date('2026-09-23T23:30:00Z'),
    });
    expect(reminders.at(-1)?.dateKey).toBe('2026-09-29');
  });

  it('skips habits without a reminder and archived habits', () => {
    // Los hábitos de antes de la fase 17 no traen el campo.
    const missing: Habit = habit({ id: 'missing' });
    delete missing.reminder;
    expect(
      plan({
        habits: [
          habit({ id: 'none', reminder: null }),
          missing,
          habit({ id: 'old', status: 'archived', archivedDateKey: '2026-09-23' }),
        ],
      }),
    ).toEqual([]);
  });

  it('only uses the chosen days of the week', () => {
    // Miércoles 23 y lunes 28.
    const reminders = plan({
      habits: [habit({ reminder: { time: '19:30', daysOfWeek: [1, 3] } })],
    });
    expect(ids(reminders)).toEqual(['habit-read-2026-09-23', 'habit-read-2026-09-28']);
  });

  it('never reminds on a day a days-of-week habit does not count', () => {
    const reminders = plan({
      habits: [
        habit({
          schedule: { type: 'days_of_week', daysOfWeek: [3] },
          reminder: { time: '19:30', daysOfWeek: [1, 3] },
        }),
      ],
    });
    expect(ids(reminders)).toEqual(['habit-read-2026-09-23']);
  });

  it('skips days before the habit starts', () => {
    const reminders = plan({ habits: [habit({ startDateKey: '2026-09-27' })] });
    expect(reminders[0]?.dateKey).toBe('2026-09-27');
    expect(reminders).toHaveLength(3);
  });

  it('skips the reminder of today once it passed', () => {
    const evening = new Date('2026-09-23T23:30:00Z'); // 19:30 justo
    expect(plan({ now: evening })[0]?.dateKey).toBe('2026-09-24');
  });

  it('skips today when the habit is already done, but keeps the next days', () => {
    const weekLogs: WeekLog[] = [{ dateKey: '2026-09-23', entries: { read: { completed: true } } }];
    const reminders = plan({ weekLogs });
    expect(reminders[0]?.dateKey).toBe('2026-09-24');
    expect(reminders).toHaveLength(HABIT_REMINDER_PLAN_DAYS - 1);
  });

  it('keeps today when a quantity habit is below its target', () => {
    const weekLogs: WeekLog[] = [
      { dateKey: '2026-09-23', entries: { read: { completed: false, count: 3 } } },
    ];
    const reminders = plan({
      habits: [habit({ target: { amount: 8, unit: 'vasos' } })],
      weekLogs,
    });
    expect(reminders[0]?.dateKey).toBe('2026-09-23');
  });

  it('stops a weekly habit for the rest of the week once it reaches N, and resumes on Monday', () => {
    const weekly = habit({ schedule: { type: 'times_per_week', timesPerWeek: 2 } });
    const weekLogs: WeekLog[] = [
      { dateKey: '2026-09-21', entries: { read: { completed: true } } },
      { dateKey: '2026-09-22', entries: { read: { completed: true } } },
    ];
    const reminders = plan({ habits: [weekly], weekLogs });
    expect(ids(reminders)).toEqual(['habit-read-2026-09-28', 'habit-read-2026-09-29']);
  });

  it('keeps reminding a weekly habit that has not reached N', () => {
    const weekly = habit({ schedule: { type: 'times_per_week', timesPerWeek: 3 } });
    const weekLogs: WeekLog[] = [{ dateKey: '2026-09-21', entries: { read: { completed: true } } }];
    expect(plan({ habits: [weekly], weekLogs })).toHaveLength(HABIT_REMINDER_PLAN_DAYS);
  });

  it('sorts reminders of several habits by time', () => {
    const reminders = plan({
      habits: [
        habit({ id: 'late', reminder: { time: '21:00', daysOfWeek: [3] } }),
        habit({ id: 'early', reminder: { time: '12:00', daysOfWeek: [3] } }),
        habit({ id: 'also-early', reminder: { time: '12:00', daysOfWeek: [3] } }),
      ],
    });
    // A la misma hora, por ID: el orden no depende del de los hábitos.
    expect(ids(reminders)).toEqual([
      'habit-also-early-2026-09-23',
      'habit-early-2026-09-23',
      'habit-late-2026-09-23',
    ]);
  });

  it('uses Bolivia days near midnight, whatever the device zone', () => {
    // 23:50 del miércoles en Bolivia = 03:50 UTC del jueves.
    const reminders = plan({
      now: new Date('2026-09-24T03:50:00Z'),
      habits: [habit({ reminder: { time: '23:55', daysOfWeek: [3] } })],
    });
    expect(reminders[0]).toMatchObject({
      dateKey: '2026-09-23',
      fireAt: new Date('2026-09-24T03:55:00Z'),
    });
  });
});
