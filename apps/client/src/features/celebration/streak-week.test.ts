import type { DailyLog, DayStatus } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { buildStreakWeek } from './streak-week';

function log(dateKey: string, status: DayStatus): DailyLog {
  return { dateKey, entries: {}, status, summary: null };
}

describe('buildStreakWeek', () => {
  // 2026-09-24 es jueves: la semana va del lunes 21 al domingo 27.
  const today = '2026-09-24';

  it('lists Monday to Sunday with their initials', () => {
    const week = buildStreakWeek(today, []);
    expect(week.map((day) => day.dateKey)).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ]);
    expect(week.map((day) => day.label)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
  });

  it('maps closed days to their streak state and marks today and the future', () => {
    const week = buildStreakWeek(today, [
      log('2026-09-21', 'completed'),
      log('2026-09-22', 'frozen'),
      log('2026-09-23', 'missed'),
      log('2026-09-24', 'open'),
    ]);
    expect(week.map((day) => day.state)).toEqual([
      'lit',
      'frozen',
      'missed',
      'today',
      'future',
      'future',
      'future',
    ]);
  });

  it('leaves past days without a closed log empty', () => {
    const week = buildStreakWeek(today, [log('2026-09-21', 'inactive'), log('2026-09-22', 'open')]);
    expect(week.slice(0, 3).map((day) => day.state)).toEqual(['empty', 'empty', 'empty']);
  });

  it('puts today on Sunday at the end of the week', () => {
    const week = buildStreakWeek('2026-09-27', [log('2026-09-26', 'completed')]);
    expect(week.at(-1)?.state).toBe('today');
    expect(week.at(-2)?.state).toBe('lit');
  });
});
