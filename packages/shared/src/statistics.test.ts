import { describe, expect, it } from 'vitest';

import { evaluateDay } from './day-evaluation';
import { initialGamificationState } from './gamification-state';
import { addClosedDay, EMPTY_MONTHLY_COUNTERS } from './monthly-summary';
import { buildRangeStats, buildYearStats, monthHabitStats } from './statistics';
import type {
  DailyEntries,
  DailyLog,
  DateKey,
  GamificationState,
  Habit,
  HabitTier,
  MonthlyCounters,
  MonthlySummary,
} from './types';

function habit(
  id: string,
  tier: HabitTier,
  startDateKey: DateKey,
  archivedDateKey: DateKey | null = null,
): Habit {
  return {
    id,
    name: id,
    tier,
    schedule: { type: 'daily' },
    status: archivedDateKey ? 'archived' : 'active',
    startDateKey,
    archivedDateKey,
  };
}

function done(...habitIds: string[]): DailyEntries {
  return Object.fromEntries(habitIds.map((id) => [id, { completed: true }]));
}

/** Cierra los días en orden, como `closePendingDays`, y acumula el resumen del mes. */
function closeDays(
  habits: readonly Habit[],
  days: readonly { dateKey: DateKey; entries: DailyEntries }[],
  state: GamificationState,
) {
  const logs: DailyLog[] = [];
  let counters: MonthlyCounters = EMPTY_MONTHLY_COUNTERS;
  let current = state;
  for (const { dateKey, entries } of days) {
    const evaluation = evaluateDay({ dateKey, habits, entries, state: current });
    logs.push({ dateKey, entries, status: evaluation.status, summary: evaluation.summary });
    counters = addClosedDay(counters, evaluation);
    current = evaluation.nextState;
  }
  return { logs, counters };
}

const TODAY = '2026-09-10';
const READING = habit('reading', 'primary', '2026-09-01');
const WORKOUT = habit('workout', 'primary', '2026-09-01', '2026-09-05');
const WATER = habit('water', 'secondary', '2026-09-03');
const JOURNAL = habit('journal', 'secondary', TODAY);
// Orden elegido por el usuario, con un secundario primero: los principales deben subir.
const HABITS = [WATER, READING, JOURNAL, WORKOUT];

const CLOSED = closeDays(
  HABITS,
  [
    { dateKey: '2026-09-01', entries: done('reading', 'workout') }, // perfecto
    { dateKey: '2026-09-02', entries: done('reading') }, // protegido
    { dateKey: '2026-09-03', entries: done('reading', 'workout') }, // cumplido, falta el agua
    { dateKey: '2026-09-04', entries: {} }, // perdido
    { dateKey: '2026-09-05', entries: done('reading', 'workout', 'water') }, // perfecto
    { dateKey: '2026-09-06', entries: done('reading', 'water') }, // perfecto, sin workout
    { dateKey: '2026-09-07', entries: done('reading') }, // cumplido
  ],
  { ...initialGamificationState('2026-09-01'), streakFreezesAvailable: 1 },
);

// El 8 tiene marcas pero la app todavía no lo cierra; el 9 no tiene registro.
const LOGS: DailyLog[] = [
  ...CLOSED.logs,
  { dateKey: '2026-09-08', entries: done('reading'), status: 'open', summary: null },
  { dateKey: TODAY, entries: done('reading', 'water'), status: 'open', summary: null },
];

function statsFor(startDateKey: DateKey, endDateKey: DateKey, logs: readonly DailyLog[] = LOGS) {
  return buildRangeStats({ startDateKey, endDateKey, today: TODAY, habits: HABITS, logs });
}

const september = statsFor('2026-09-01', '2026-09-30');

function dayOf(dateKey: DateKey, stats = september) {
  return stats.days.find((day) => day.dateKey === dateKey);
}

describe('buildRangeStats', () => {
  it('returns every day of the range, in order', () => {
    expect(september.days).toHaveLength(30);
    expect(september.days[0]?.dateKey).toBe('2026-09-01');
    expect(september.days[29]?.dateKey).toBe('2026-09-30');
  });

  it('marks the days after today as future, without data', () => {
    expect(dayOf('2026-09-11')).toEqual({
      dateKey: '2026-09-11',
      status: 'future',
      isToday: false,
      scheduledCount: 0,
      completedCount: 0,
      completionRate: null,
      pointsEarned: null,
      streakAfterClose: null,
      habits: {},
    });
  });

  it('reads a closed day from its summary, with its points and streak', () => {
    expect(dayOf('2026-09-03')).toEqual({
      dateKey: '2026-09-03',
      status: 'completed',
      isToday: false,
      scheduledCount: 3,
      completedCount: 2,
      completionRate: 2 / 3,
      pointsEarned: 20,
      streakAfterClose: 2,
      habits: { reading: 'done', workout: 'done', water: 'not_done' },
    });
  });

  it('tells perfect days apart from completed ones', () => {
    expect(dayOf('2026-09-01')?.status).toBe('perfect');
    expect(dayOf('2026-09-07')?.status).toBe('completed');
  });

  it('shows frozen and missed days', () => {
    expect(dayOf('2026-09-02')).toMatchObject({ status: 'frozen', completionRate: 0.5 });
    expect(dayOf('2026-09-04')).toMatchObject({ status: 'missed', completionRate: 0 });
  });

  it('keeps the photo of a closed day even if the habits changed afterwards', () => {
    const log: DailyLog = {
      dateKey: '2026-09-05',
      entries: {},
      status: 'completed',
      summary: {
        scheduledHabitIds: ['reading'],
        scheduledPrimaryHabitIds: ['reading'],
        completedHabitIds: ['reading'],
        completionRate: 1,
        isPerfectDay: true,
        pointsEarned: 15,
        streakAfterClose: 4,
      },
    };
    const stats = statsFor('2026-09-05', '2026-09-05', [log]);
    expect(dayOf('2026-09-05', stats)).toMatchObject({
      status: 'perfect',
      scheduledCount: 1,
      habits: { reading: 'done' },
    });
  });

  it('computes today live from its marks and the habits scheduled today', () => {
    expect(dayOf(TODAY)).toEqual({
      dateKey: TODAY,
      status: 'open',
      isToday: true,
      scheduledCount: 3,
      completedCount: 2,
      completionRate: 2 / 3,
      pointsEarned: null,
      streakAfterClose: null,
      habits: { reading: 'done', water: 'done', journal: 'not_done' },
    });
  });

  it('treats past days that are not closed yet as open', () => {
    expect(dayOf('2026-09-08')).toMatchObject({
      status: 'open',
      isToday: false,
      scheduledCount: 2,
      completedCount: 1,
    });
    expect(dayOf('2026-09-09')).toMatchObject({
      status: 'open',
      scheduledCount: 2,
      completedCount: 0,
      habits: { reading: 'not_done', water: 'not_done' },
    });
  });

  it('has no data for days without a log and without habits', () => {
    const stats = statsFor('2026-08-31', '2026-09-06');
    expect(dayOf('2026-08-31', stats)).toMatchObject({
      status: 'no_data',
      completionRate: null,
      habits: {},
    });
  });

  it('keeps today open even before any habit exists', () => {
    const stats = buildRangeStats({
      startDateKey: TODAY,
      endDateKey: TODAY,
      today: TODAY,
      habits: [],
      logs: [],
    });
    expect(dayOf(TODAY, stats)).toMatchObject({
      status: 'open',
      isToday: true,
      completionRate: null,
    });
  });

  it('shows a closed day without habits as inactive', () => {
    const inactive = evaluateDay({
      dateKey: '2026-08-31',
      habits: [],
      entries: {},
      state: initialGamificationState('2026-08-31'),
    });
    const log: DailyLog = {
      dateKey: '2026-08-31',
      entries: {},
      status: inactive.status,
      summary: inactive.summary,
    };
    const stats = statsFor('2026-08-31', '2026-08-31', [log]);
    expect(dayOf('2026-08-31', stats)).toMatchObject({
      status: 'inactive',
      scheduledCount: 0,
      completionRate: null,
    });
  });

  it('lists the habits that counted in the range, primaries first, in the given order', () => {
    expect(september.habits.map((row) => row.habit.id)).toEqual([
      'reading',
      'workout',
      'water',
      'journal',
    ]);
    const firstDays = statsFor('2026-09-01', '2026-09-02');
    expect(firstDays.habits.map((row) => row.habit.id)).toEqual(['reading', 'workout']);
  });

  it('counts only closed days in the habit percentages', () => {
    expect(september.habits).toEqual([
      { habit: READING, scheduledDays: 7, completedDays: 6, completionRate: 6 / 7 },
      { habit: WORKOUT, scheduledDays: 5, completedDays: 3, completionRate: 3 / 5 },
      { habit: WATER, scheduledDays: 5, completedDays: 2, completionRate: 2 / 5 },
      { habit: JOURNAL, scheduledDays: 0, completedDays: 0, completionRate: null },
    ]);
  });

  it('adds up the closed days exactly like the monthly summary', () => {
    expect(september.counters).toEqual(CLOSED.counters);
    expect(september.completionRate).toBe(11 / 17);
  });

  it('has no completion rate when no day of the range is closed', () => {
    const future = statsFor('2026-09-14', '2026-09-20');
    expect(future.counters).toEqual(EMPTY_MONTHLY_COUNTERS);
    expect(future.completionRate).toBeNull();
    expect(future.habits).toEqual([]);
  });
});

describe('buildRangeStats with fixed days and times per week', () => {
  // Semana del lunes 21 al domingo 27 de septiembre.
  const WEEK_START = '2026-09-21';
  const WEEK_END = '2026-09-27';
  const read = habit('read', 'primary', '2026-09-01');
  const gym: Habit = {
    ...habit('gym', 'primary', '2026-09-01'),
    schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] },
  };
  const swim: Habit = {
    ...habit('swim', 'secondary', '2026-09-01'),
    schedule: { type: 'times_per_week', timesPerWeek: 2 },
  };
  const yoga: Habit = {
    ...habit('yoga', 'secondary', '2026-09-01'),
    schedule: { type: 'times_per_week', timesPerWeek: 1 },
  };
  const habits = [read, gym, swim, yoga];
  const closed = closeDays(
    habits,
    [
      { dateKey: '2026-09-21', entries: done('read', 'gym', 'swim') },
      { dateKey: '2026-09-22', entries: done('read') },
      { dateKey: '2026-09-23', entries: done('read') },
      { dateKey: '2026-09-24', entries: done('read') },
      { dateKey: '2026-09-25', entries: done('read', 'gym') },
      { dateKey: '2026-09-26', entries: done('read') },
      { dateKey: '2026-09-27', entries: done('read') },
    ],
    { ...initialGamificationState('2026-09-21'), streakFreezesAvailable: 1 },
  );
  const week = buildRangeStats({
    startDateKey: WEEK_START,
    endDateKey: WEEK_END,
    today: '2026-09-28',
    habits,
    logs: closed.logs,
  });
  const day = (dateKey: DateKey) => week.days.find((item) => item.dateKey === dateKey);
  const row = (habitId: string) => week.habits.find((item) => item.habit.id === habitId);

  it('leaves out the days a fixed-day habit does not touch', () => {
    expect(day('2026-09-22')?.habits).toEqual({ read: 'done' });
    expect(day('2026-09-23')?.habits).toEqual({ read: 'done', gym: 'not_done' });
  });

  it('shows a weekly habit only on the days it was done', () => {
    expect(day('2026-09-21')?.habits).toEqual({ read: 'done', gym: 'done', swim: 'done' });
    expect(day('2026-09-24')?.habits).toEqual({ read: 'done' });
  });

  it('measures a fixed-day habit against its own days', () => {
    expect(row('gym')).toMatchObject({ scheduledDays: 3, completedDays: 2 });
    expect(row('gym')?.completionRate).toBeCloseTo(2 / 3);
  });

  it('measures a weekly habit against its times per week', () => {
    expect(row('swim')).toMatchObject({ scheduledDays: 2, completedDays: 1, completionRate: 0.5 });
  });

  it('lists a weekly habit even in a week without marks', () => {
    expect(row('yoga')).toMatchObject({ scheduledDays: 1, completedDays: 0, completionRate: 0 });
  });

  it('computes an open day with the weekly habits done that day', () => {
    const openSaturday = buildRangeStats({
      startDateKey: WEEK_START,
      endDateKey: WEEK_END,
      today: '2026-09-26',
      habits,
      logs: [
        ...closed.logs.slice(0, 5),
        { dateKey: '2026-09-26', entries: done('swim'), status: 'open', summary: null },
      ],
    });
    const saturday = openSaturday.days.find((item) => item.dateKey === '2026-09-26');
    expect(saturday?.habits).toEqual({ read: 'not_done', swim: 'done' });
    expect(saturday?.completionRate).toBe(0.5);
  });

  it('caps a weekly habit at 100 % when it was done more than asked', () => {
    const busy = closeDays(
      [swim],
      ['2026-09-21', '2026-09-22', '2026-09-23'].map((dateKey) => ({
        dateKey,
        entries: done('swim'),
      })),
      initialGamificationState('2026-09-21'),
    );
    const stats = buildRangeStats({
      startDateKey: WEEK_START,
      endDateKey: WEEK_END,
      today: '2026-09-24',
      habits: [swim],
      logs: busy.logs,
    });
    // 3 días cerrados: se esperaba una marca (2 × 3 / 7 ≈ 1) y hubo 3.
    expect(stats.habits[0]).toMatchObject({
      scheduledDays: 1,
      completedDays: 3,
      completionRate: 1,
    });
  });
});

function summary(monthKey: string, counters: Partial<MonthlyCounters>): MonthlySummary {
  return { ...EMPTY_MONTHLY_COUNTERS, ...counters, monthKey };
}

describe('buildYearStats', () => {
  const august = summary('2026-08', {
    closedDays: 31,
    completedDays: 20,
    perfectDays: 5,
    frozenDays: 2,
    missedDays: 9,
    pointsEarned: 400,
    pointsSpent: 150,
    habitStats: {
      reading: { scheduledDays: 31, completedDays: 25 },
      workout: { scheduledDays: 31, completedDays: 10 },
    },
  });
  const septemberSummary = summary('2026-09', {
    closedDays: 9,
    completedDays: 7,
    perfectDays: 3,
    frozenDays: 1,
    missedDays: 1,
    pointsEarned: 150,
    habitStats: {
      reading: { scheduledDays: 9, completedDays: 8 },
      water: { scheduledDays: 5, completedDays: 2 },
    },
  });
  const lastYear = summary('2025-12', {
    closedDays: 31,
    habitStats: { reading: { scheduledDays: 31, completedDays: 31 } },
  });
  const year = buildYearStats({
    year: '2026',
    summaries: [septemberSummary, lastYear, august],
    habits: HABITS,
    today: '2026-09-10',
  });

  it('returns the twelve months in order, empty when there is no summary', () => {
    expect(year.months.map((month) => month.monthKey)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ]);
    expect(year.months[0]).toEqual({
      ...EMPTY_MONTHLY_COUNTERS,
      monthKey: '2026-01',
      completionRate: null,
    });
  });

  it('computes the completion rate of each month from its habit stats', () => {
    expect(year.months[7]).toEqual({ ...august, completionRate: 35 / 62 });
    expect(year.months[8]?.completionRate).toBe(10 / 14);
  });

  it('adds the months of the year up, including habit stats and points spent', () => {
    expect(year.counters).toEqual({
      closedDays: 40,
      completedDays: 27,
      perfectDays: 8,
      frozenDays: 3,
      missedDays: 10,
      pointsEarned: 550,
      pointsSpent: 150,
      habitStats: {
        reading: { scheduledDays: 40, completedDays: 33 },
        workout: { scheduledDays: 31, completedDays: 10 },
        water: { scheduledDays: 5, completedDays: 2 },
      },
      checkInStats: {},
    });
    expect(year.completionRate).toBe(45 / 76);
  });

  it('lists the habits with scheduled days in the year, primaries first', () => {
    expect(year.habits).toEqual([
      { habit: READING, scheduledDays: 40, completedDays: 33, completionRate: 33 / 40 },
      { habit: WORKOUT, scheduledDays: 31, completedDays: 10, completionRate: 10 / 31 },
      { habit: WATER, scheduledDays: 5, completedDays: 2, completionRate: 2 / 5 },
    ]);
  });

  describe('with weekly habits', () => {
    const swim: Habit = {
      ...habit('swim', 'secondary', '2026-09-01'),
      schedule: { type: 'times_per_week', timesPerWeek: 2 },
    };
    const yoga: Habit = {
      ...habit('yoga', 'secondary', '2026-09-15'),
      schedule: { type: 'times_per_week', timesPerWeek: 1 },
    };
    // En el resumen, un semanal solo figura los días que se marcó.
    const september = summary('2026-09', {
      closedDays: 30,
      habitStats: { swim: { scheduledDays: 4, completedDays: 4 } },
    });

    it('measures a weekly habit against its times per week, up to the days already closed', () => {
      const stats = buildYearStats({
        year: '2026',
        summaries: [september],
        habits: [swim],
        today: '2026-10-01',
      });
      // 30 días: 2 × 30 / 7 ≈ 9 marcas esperadas.
      expect(stats.habits).toEqual([
        { habit: swim, scheduledDays: 9, completedDays: 4, completionRate: 4 / 9 },
      ]);
      expect(monthHabitStats(stats.months[8]!, swim, '2026-10-01').completionRate).toBe(4 / 9);

      const midMonth = buildYearStats({
        year: '2026',
        summaries: [september],
        habits: [swim],
        today: '2026-09-15',
      });
      // Del 1 al 14: 2 × 14 / 7 = 4.
      expect(midMonth.habits[0]).toMatchObject({ scheduledDays: 4, completionRate: 1 });
    });

    it('lists a weekly habit without marks from the day it started', () => {
      const stats = buildYearStats({
        year: '2026',
        summaries: [september],
        habits: [swim, yoga],
        today: '2026-10-01',
      });
      // Del 15 al 30: 16 días, 1 × 16 / 7 ≈ 2.
      expect(stats.habits[1]).toEqual({
        habit: yoga,
        scheduledDays: 2,
        completedDays: 0,
        completionRate: 0,
      });
    });

    it('has no rate for a weekly habit in a month without closed days', () => {
      expect(monthHabitStats(year.months[0]!, swim, '2026-10-01').completionRate).toBeNull();
    });

    it('gives a daily habit its own rate for a month, and none without days', () => {
      expect(monthHabitStats(year.months[7]!, READING, '2026-10-01').completionRate).toBe(25 / 31);
      expect(monthHabitStats(year.months[0]!, READING, '2026-10-01').completionRate).toBeNull();
    });
  });
});

describe('check-in in the statistics', () => {
  const logs: DailyLog[] = [
    ...CLOSED.logs.map((log) =>
      log.dateKey === '2026-09-02' ? { ...log, checkIn: { mood: 2, energy: 3 } } : log,
    ),
    { dateKey: '2026-09-08', entries: {}, status: 'open', summary: null, checkIn: { mood: 4 } },
    {
      dateKey: TODAY,
      entries: {},
      status: 'open',
      summary: null,
      checkIn: { mood: 3, energy: 5, motivation: 4 },
    },
  ];

  it('lists the days with a check-in, today included, in order', () => {
    expect(statsFor('2026-09-01', '2026-09-30', logs).checkIn.days).toEqual([
      { dateKey: '2026-09-02', checkIn: { mood: 2, energy: 3 } },
      { dateKey: '2026-09-08', checkIn: { mood: 4 } },
      { dateKey: TODAY, checkIn: { mood: 3, energy: 5, motivation: 4 } },
    ]);
  });

  it('averages each scale over the days it was answered, closed or not', () => {
    expect(statsFor('2026-09-01', '2026-09-30', logs).checkIn.averages).toEqual({
      mood: 3,
      energy: 4,
      motivation: 4,
    });
  });

  it('has no averages without check-ins', () => {
    expect(statsFor('2026-09-01', '2026-09-30').checkIn).toEqual({
      days: [],
      averages: { mood: null, energy: null, motivation: null },
    });
  });

  it('averages the year from the closed days of its monthly summaries', () => {
    const year = buildYearStats({
      year: '2026',
      summaries: [
        summary('2026-08', { checkInStats: { mood: { days: 3, total: 9 } } }),
        summary('2026-09', {
          checkInStats: { mood: { days: 1, total: 5 }, energy: { days: 2, total: 4 } },
        }),
      ],
      habits: HABITS,
      today: TODAY,
    });
    expect(year.checkInAverages).toEqual({ mood: 3.5, energy: 2, motivation: null });
  });
});
