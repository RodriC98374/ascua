import { describe, expect, it } from 'vitest';

import {
  expectedWeeklyMarks,
  isWeekPowered,
  weekCompletions,
  weeklyProgress,
} from './weekly-habits';
import type { DailyEntries, Habit } from './types';

// Semana del lunes 21 al domingo 27 de septiembre de 2026.
const THURSDAY = '2026-09-24';

function habit(id: string, timesPerWeek: number, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    tier: 'secondary',
    schedule: { type: 'times_per_week', timesPerWeek },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    ...overrides,
  };
}

function done(...ids: string[]): DailyEntries {
  return Object.fromEntries(ids.map((id) => [id, { completed: true }]));
}

const log = (dateKey: string, entries: DailyEntries) => ({ dateKey, entries });

describe('expectedWeeklyMarks', () => {
  it('expects N marks every seven days, rounded', () => {
    expect(expectedWeeklyMarks(3, 7)).toBe(3);
    expect(expectedWeeklyMarks(3, 30)).toBe(13);
    expect(expectedWeeklyMarks(2, 1)).toBe(0);
  });
});

describe('weekCompletions', () => {
  it('counts the marks of earlier days of the same week', () => {
    const count = weekCompletions(habit('swim', 3), THURSDAY, [
      log('2026-09-20', done('swim')),
      log('2026-09-22', done('swim')),
      log('2026-09-23', done('read')),
      log(THURSDAY, done('swim')),
    ]);
    expect(count).toBe(1);
  });
});

describe('weeklyProgress', () => {
  const swim = habit('swim', 3);
  const yoga = habit('yoga', 1);

  it('counts the marks of the week so far, today included', () => {
    const [progress] = weeklyProgress([swim], THURSDAY, [
      log('2026-09-21', done('swim')),
      log(THURSDAY, done('swim')),
    ]);
    expect(progress).toEqual({
      habit: swim,
      count: 2,
      target: 3,
      isMet: false,
      earnsPointsToday: true,
    });
  });

  it('stops earning points today once the earlier days already reached N', () => {
    const [progress] = weeklyProgress([yoga], THURSDAY, [log('2026-09-22', done('yoga'))]);
    expect(progress).toMatchObject({ count: 1, isMet: true, earnsPointsToday: false });
  });

  it('asks a habit created mid-week only for the days it has left', () => {
    const late = habit('late', 3, { startDateKey: '2026-09-26' });
    const [progress] = weeklyProgress([late], '2026-09-26', []);
    // Sábado y domingo: a lo sumo 2.
    expect(progress).toMatchObject({ target: 2, isMet: false });
  });

  it('leaves out daily habits and weekly habits that do not exist today', () => {
    const daily: Habit = { ...habit('read', 1), schedule: { type: 'daily' } };
    const archived = habit('old', 2, { status: 'archived', archivedDateKey: '2026-09-22' });
    expect(weeklyProgress([daily, archived, swim], THURSDAY, []).map((p) => p.habit.id)).toEqual([
      'swim',
    ]);
  });
});

describe('isWeekPowered', () => {
  const swim = habit('swim', 2);
  const yoga = habit('yoga', 1);
  const logs = [log('2026-09-21', done('swim', 'yoga')), log('2026-09-23', done('swim'))];

  it('powers the week once every weekly habit reached its times', () => {
    expect(isWeekPowered(weeklyProgress([swim, yoga], THURSDAY, logs))).toBe(true);
  });

  it('does not while one is still short', () => {
    expect(isWeekPowered(weeklyProgress([swim, yoga, habit('run', 1)], THURSDAY, logs))).toBe(
      false,
    );
  });

  it('does not without weekly habits', () => {
    expect(isWeekPowered([])).toBe(false);
  });
});
